#!/usr/bin/env python3
"""
Quant AI - Model Training Pipeline
Trains LSTM and XGBoost models for price direction prediction
"""

import os
import sys
import json
import joblib
import argparse
import logging
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import xgboost as xgb

# TensorFlow/LSTM (optional, fallback to sklearn if not available)
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential, load_model
    from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
    HAS_TF = True
except ImportError:
    HAS_TF = False
    print("TensorFlow not installed. LSTM training disabled. Use XGBoost only.")

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from lib.db import db  # Prisma db client (if needed to fetch data)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QuantModelTrainer:
    def __init__(self, symbol: str, timeframe: str = "1h"):
        self.symbol = symbol.upper()
        self.timeframe = timeframe
        self.models_dir = Path(__file__).parent.parent / "models" / f"{self.symbol}-{self.timeframe}"
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        self.scaler = StandardScaler()
        self.lstm_model = None
        self.xgb_model = None
        
    def prepare_features(self, df: pd.DataFrame, lookback: int = 60) -> tuple:
        """
        Prepare feature matrix X and target y from OHLC + indicators dataframe.
        Target: 1 if next period price increase > threshold, 0 otherwise
        """
        df = df.copy()
        
        # Ensure required columns exist
        required = ['close', 'volume', 'rsi', 'macd', 'macd_signal', 'macd_hist',
                   'sma_20', 'sma_50', 'sma_200', 'ema_12', 'ema_26',
                   'bollinger_upper', 'bollinger_middle', 'bollinger_lower',
                   'atr', 'adx', 'stoch_k', 'stoch_d', 'williams_r', 'cci', 'mfi', 'obv']
        
        for col in required:
            if col not in df.columns:
                df[col] = 0  # fallback
        
        # Create future return target (next N periods)
        horizon = 1  # predict 1 period ahead
        df['future_return'] = df['close'].shift(-horizon) / df['close'] - 1
        threshold = 0.002  # 0.2% minimum move to be considered buy signal
        df['target'] = ((df['future_return'] > threshold) & (df['future_return'] < 0.05)).astype(int)
        # Sell signals: future_return < -threshold
        df.loc[df['future_return'] < -threshold, 'target'] = 2  # 2 = sell
        
        # Feature columns
        feature_cols = ['close', 'volume'] + [c for c in required if c not in ['close', 'volume']]
        
        # Add lagged closes (last 60 periods)
        for lag in range(1, 61):
            df[f'close_lag_{lag}'] = df['close'].shift(lag)
            feature_cols.append(f'close_lag_{lag}')
        
        # Drop NaN
        df = df.dropna()
        
        if len(df) < 100:
            raise ValueError(f"Insufficient data after cleaning: {len(df)} rows")
        
        X = df[feature_cols].values
        y = df['target'].values  # 0=hold, 1=buy, 2=sell
        
        return X, y, feature_cols
    
    def prepare_lstm_sequences(self, X: np.ndarray, y: np.ndarray, sequence_length: int = 60) -> tuple:
        """Convert features to sequences for LSTM"""
        X_seq, y_seq = [], []
        for i in range(sequence_length, len(X)):
            X_seq.append(X[i-sequence_length:i])
            y_seq.append(y[i])
        return np.array(X_seq), np.array(y_seq)
    
    def train_xgboost(self, X_train: np.ndarray, y_train: np.ndarray, X_val: np.ndarray, y_val: np.ndarray):
        """Train XGBoost classifier"""
        logger.info("Training XGBoost model...")
        
        params = {
            'n_estimators': 200,
            'max_depth': 6,
            'learning_rate': 0.05,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'objective': 'multi:softprob',
            'num_class': 3,  # hold, buy, sell
            'eval_metric': 'mlogloss',
            'seed': 42,
            'n_jobs': -1,
        }
        
        model = xgb.XGBClassifier(**params)
        
        # Train with early stopping
        model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=50,
            early_stopping_rounds=20
        )
        
        # Save model
        model_path = self.models_dir / "xgboost_model.joblib"
        joblib.dump(model, model_path)
        logger.info(f"XGBoost model saved to {model_path}")
        
        # Feature importance
        importance = model.feature_importances_
        feat_imp = pd.DataFrame({'feature': self.feature_names, 'importance': importance})
        feat_imp = feat_imp.sort_values('importance', ascending=False)
        feat_imp_path = self.models_dir / "feature_importance.csv"
        feat_imp.to_csv(feat_imp_path, index=False)
        
        self.xgb_model = model
        return model
    
    def train_lstm(self, X_train_seq: np.ndarray, y_train: np.ndarray, X_val_seq: np.ndarray, y_val: np.ndarray):
        """Train LSTM model"""
        if not HAS_TF:
            logger.warning("TensorFlow not available, skipping LSTM")
            return None
            
        logger.info("Training LSTM model...")
        
        n_features = X_train_seq.shape[2]
        
        model = Sequential([
            LSTM(128, return_sequences=True, input_shape=(X_train_seq.shape[1], n_features)),
            Dropout(0.3),
            BatchNormalization(),
            LSTM(64, return_sequences=False),
            Dropout(0.3),
            BatchNormalization(),
            Dense(32, activation='relu'),
            Dropout(0.2),
            Dense(3, activation='softmax')  # 3 classes: hold, buy, sell
        ])
        
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        callbacks = [
            EarlyStopping(monitor='val_loss', patience=20, restore_best_weights=True),
            ModelCheckpoint(
                str(self.models_dir / 'lstm_model.keras'),
                save_best_only=True,
                monitor='val_accuracy'
            )
        ]
        
        history = model.fit(
            X_train_seq, y_train,
            validation_data=(X_val_seq, y_val),
            epochs=100,
            batch_size=32,
            callbacks=callbacks,
            verbose=1
        )
        
        logger.info("LSTM training complete")
        self.lstm_model = model
        return model
    
    def train_ensemble(self, X_train: np.ndarray, y_train: np.ndarray, X_val: np.ndarray, y_val: np.ndarray):
        """Train both models and create ensemble weights based on validation performance"""
        # Train XGBoost
        xgb_model = self.train_xgboost(X_train, y_train, X_val, y_val)
        xgb_val_score = xgb_model.score(X_val, y_val)
        
        # Train LSTM if available
        lstm_val_score = 0
        if HAS_TF:
            X_train_seq, y_train_seq = self.prepare_lstm_sequences(X_train, y_train)
            X_val_seq, y_val_seq = self.prepare_lstm_sequences(X_val, y_val)
            
            if len(X_train_seq) > 100 and len(X_val_seq) > 50:
                lstm_model = self.train_lstm(X_train_seq, y_train_seq, X_val_seq, y_val_seq)
                if lstm_model:
                    lstm_loss, lstm_acc = lstm_model.evaluate(X_val_seq, y_val_seq, verbose=0)
                    lstm_val_score = lstm_acc
        
        # Calculate ensemble weights (inverse of error)
        models = []
        weights = []
        
        if xgb_val_score > 0.5:
            models.append('xgboost')
            weights.append(xgb_val_score)
        
        if lstm_val_score > 0.5:
            models.append('lstm')
            weights.append(lstm_val_score)
        
        # Normalize weights
        if weights:
            total = sum(weights)
            weights = [w/total for w in weights]
        
        ensemble_config = {
            'models': models,
            'weights': weights,
            'xgb_score': float(xgb_val_score),
            'lstm_score': float(lstm_val_score),
            'created_at': datetime.now().isoformat(),
            'symbol': self.symbol,
            'timeframe': self.timeframe,
        }
        
        config_path = self.models_dir / "ensemble_config.json"
        with open(config_path, 'w') as f:
            json.dump(ensemble_config, f, indent=2)
        
        logger.info(f"Ensemble config saved: models={models}, weights={weights}")
        return ensemble_config
    
    def run(self, data_path: str = None):
        """Main training pipeline"""
        logger.info(f"Starting training for {self.symbol} {self.timeframe}")
        
        # Load data (from CSV or database)
        if data_path:
            df = pd.read_csv(data_path)
        else:
            # Fetch from database (Prisma)
            logger.info("Fetching data from database...")
            # Placeholder: you need to implement fetching from OHLCData + Indicator tables
            raise NotImplementedError("Database fetch not implemented yet. Provide CSV via --data-path")
        
        # Prepare features
        logger.info("Preparing features...")
        X, y, self.feature_names = self.prepare_features(df)
        
        # Train/val split
        split_idx = int(len(X) * 0.8)
        X_train, X_val = X[:split_idx], X[split_idx:]
        y_train, y_val = y[:split_idx], y[split_idx:]
        
        logger.info(f"Train set: {len(X_train)}, Val set: {len(X_val)}")
        logger.info(f"Class distribution - hold: {(y==0).sum()}, buy: {(y==1).sum()}, sell: {(y==2).sum()}")
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_val_scaled = self.scaler.transform(X_val)
        
        # Save scaler
        scaler_path = self.models_dir / "scaler.joblib"
        joblib.dump(self.scaler, scaler_path)
        logger.info(f"Scaler saved to {scaler_path}")
        
        # Train ensemble
        ensemble_config = self.train_ensemble(X_train_scaled, y_train, X_val_scaled, y_val)
        
        # Evaluate final ensemble on validation
        logger.info("Training complete! Model metrics:")
        logger.info(f"XGBoost validation accuracy: {ensemble_config['xgb_score']:.4f}")
        if ensemble_config['lstm_score']:
            logger.info(f"LSTM validation accuracy: {ensemble_config['lstm_score']:.4f}")
        
        # Save metadata
        metadata = {
            'symbol': self.symbol,
            'timeframe': self.timeframe,
            'training_samples': len(X_train),
            'validation_samples': len(X_val),
            'feature_names': self.feature_names,
            'ensemble': ensemble_config,
            'created_at': datetime.now().isoformat(),
        }
        
        meta_path = self.models_dir / "metadata.json"
        with open(meta_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Training complete! Models saved to {self.models_dir}")
        return metadata

def main():
    parser = argparse.ArgumentParser(description="Train Quant AI model")
    parser.add_argument("--symbol", required=True, help="Trading symbol (e.g., BTC, ETH)")
    parser.add_argument("--timeframe", default="1h", help="Timeframe (e.g., 1h, 4h, 1d)")
    parser.add_argument("--data", help="Path to CSV data file (optional, will use DB if not provided)")
    
    args = parser.parse_args()
    
    trainer = QuantModelTrainer(args.symbol, args.timeframe)
    try:
        metadata = trainer.run(data_path=args.data)
        print(json.dumps(metadata, indent=2))
    except Exception as e:
        logger.error(f"Training failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
