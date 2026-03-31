"""
Quant AI - Model Training Script
Trains LSTM and XGBoost models on cryptocurrency data
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json
import joblib
from pathlib import Path

# ML libraries
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential, load_model
    from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
    from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
    from tensorflow.keras.optimizers import Adam
    HAS_TENSORFLOW = True
except ImportError:
    HAS_TENSORFLOW = False
    print("TensorFlow not installed. LSTM training will be skipped.")

try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("XGBoost not installed. XGBoost training will be skipped.")

from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

class QuantModelTrainer:
    def __init__(self, symbol: str, timeframe: str = "1h"):
        self.symbol = symbol
        self.timeframe = timeframe
        self.models_dir = Path("./models")
        self.models_dir.mkdir(exist_ok=True)
        
        self.scaler = StandardScaler()
        self.lstm_model = None
        self.xgb_model = None
        
    def load_data(self, data_path: str = None):
        """Load OHLC + indicator data from database or CSV"""
        if data_path:
            df = pd.read_csv(data_path)
        else:
            # In production, fetch from database via Prisma
            # For now, generate synthetic data for demo
            df = self._generate_synthetic_data()
        
        # Sort by timestamp
        df = df.sort_values('timestamp').reset_index(drop=True)
        
        # Ensure all required columns exist
        required_cols = ['open', 'high', 'low', 'close', 'volume']
        indicator_cols = [c for c in df.columns if c not in ['timestamp', 'symbol', 'timeframe'] + required_cols]
        
        self.feature_columns = required_cols + indicator_cols
        return df
    
    def _generate_synthetic_data(self, n_samples: int = 5000):
        """Generate synthetic OHLC data for demo purposes"""
        np.random.seed(42)
        
        # Generate random walk
        price = 100.0
        prices = []
        times = []
        
        start_date = datetime.now() - timedelta(days=365)
        
        for i in range(n_samples):
            change = np.random.normal(0, 0.01)  # 1% daily volatility
            price *= (1 + change)
            
            open_price = price
            high_price = price * (1 + abs(np.random.normal(0, 0.005)))
            low_price = price * (1 - abs(np.random.normal(0, 0.005)))
            close_price = price + np.random.normal(0, 0.002)
            volume = np.random.randint(1000, 10000)
            
            prices.append({
                'timestamp': start_date + timedelta(hours=i),
                'open': open_price,
                'high': high_price,
                'low': low_price,
                'close': close_price,
                'volume': volume,
                # Synthetic indicators
                'rsi': np.random.randint(20, 80),
                'macd': np.random.normal(0, 1),
                'macd_signal': np.random.normal(0, 1),
                'sma20': close_price * (1 + np.random.normal(0, 0.01)),
                'sma50': close_price * (1 + np.random.normal(0, 0.02)),
                'sma200': close_price * (1 + np.random.normal(0, 0.05)),
            })
            
            price = close_price
        
        df = pd.DataFrame(prices)
        
        # Calculate additional indicators
        df['returns'] = df['close'].pct_change()
        df['atr'] = df['high'] - df['low']
        df['bb_upper'] = df['sma20'] * 1.02
        df['bb_lower'] = df['sma20'] * 0.98
        
        return df
    
    def prepare_features(self, df: pd.DataFrame, lookback: int = 60):
        """Create feature matrix X and target variable y"""
        features = []
        targets = []
        
        for i in range(lookback, len(df) - 1):
            # Get lookback window
            window = df.iloc[i-lookback:i]
            current = df.iloc[i]
            next_period = df.iloc[i+1]
            
            # Feature vector
            feature_vec = []
            
            # Price features
            feature_vec.extend([
                current['open'],
                current['high'],
                current['low'],
                current['close'],
                current['volume'],
            ])
            
            # Technical indicators
            for col in self.feature_columns:
                if col not in ['timestamp', 'symbol', 'timeframe']:
                    feature_vec.append(current[col])
            
            # Past closes (for trend)
            feature_vec.extend(window['close'].tolist())
            
            features.append(feature_vec)
            
            # Target: next period's price change percentage
            change_pct = ((next_period['close'] - current['close']) / current['close']) * 100
            targets.append(change_pct)
        
        X = np.array(features)
        y = np.array(targets)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled, y
    
    def train_lstm(self, X_train: np.ndarray, y_train: np.ndarray, epochs: int = 50):
        """Train LSTM model"""
        if not HAS_TENSORFLOW:
            print("Skipping LSTM - TensorFlow not available")
            return None
        
        # Reshape for LSTM [samples, timesteps, features]
        # We treat the lookback period as timesteps
        n_samples, n_features = X_train.shape
        
        # For simplicity, reshape to [samples, 1, features]
        # In a real implementation, you'd structure this better
        X_train_reshaped = X_train.reshape((n_samples, 1, n_features))
        
        model = Sequential([
            LSTM(64, return_sequences=True, input_shape=(1, n_features)),
            Dropout(0.2),
            BatchNormalization(),
            LSTM(32, return_sequences=False),
            Dropout(0.2),
            BatchNormalization(),
            Dense(16, activation='relu'),
            Dense(1)
        ])
        
        optimizer = Adam(learning_rate=0.001)
        model.compile(optimizer=optimizer, loss='mse', metrics=['mae'])
        
        early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
        reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5)
        
        print(f"Training LSTM on {n_samples} samples...")
        history = model.fit(
            X_train_reshaped, y_train,
            validation_split=0.2,
            epochs=epochs,
            batch_size=32,
            callbacks=[early_stop, reduce_lr],
            verbose=1
        )
        
        self.lstm_model = model
        return history.history
    
    def train_xgboost(self, X_train: np.ndarray, y_train: np.ndarray):
        """Train XGBoost model"""
        if not HAS_XGBOOST:
            print("Skipping XGBoost - xgboost not available")
            return None
        
        params = {
            'objective': 'reg:squarederror',
            'n_estimators': 100,
            'max_depth': 6,
            'learning_rate': 0.1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': 42,
            'tree_method': 'hist'  # Faster histogram-based
        }
        
        model = xgb.XGBRegressor(**params)
        
        print(f"Training XGBoost on {len(X_train)} samples...")
        model.fit(X_train, y_train, eval_set=[(X_train, y_train)], verbose=10)
        
        self.xgb_model = model
        return model
    
    def ensemble_predict(self, X: np.ndarray) -> np.ndarray:
        """Combine predictions from LSTM and XGBoost"""
        predictions = []
        
        if self.lstm_model:
            X_lstm = X.reshape((X.shape[0], 1, X.shape[1]))
            lstm_pred = self.lstm_model.predict(X_lstm, verbose=0).flatten()
            predictions.append(lstm_pred)
        
        if self.xgb_model:
            xgb_pred = self.xgb_model.predict(X)
            predictions.append(xgb_pred)
        
        if len(predictions) == 0:
            raise ValueError("No trained models available")
        
        # Weighted average (equal weights for now)
        ensemble_pred = np.mean(predictions, axis=0)
        return ensemble_pred
    
    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray):
        """Evaluate model performance"""
        predictions = self.ensemble_predict(X_test)
        
        mae = mean_absolute_error(y_test, predictions)
        mse = mean_squared_error(y_test, predictions)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test, predictions)
        
        # Directional accuracy
        pred_direction = np.sign(predictions)
        true_direction = np.sign(y_test)
        direction_accuracy = np.mean(pred_direction == true_direction) * 100
        
        return {
            'mae': float(mae),
            'mse': float(mse),
            'rmse': float(rmse),
            'r2': float(r2),
            'direction_accuracy': float(direction_accuracy)
        }
    
    def save_models(self):
        """Save models and scaler to disk"""
        model_dir = self.models_dir / f"{self.symbol}-{self.timeframe}"
        model_dir.mkdir(exist_ok=True)
        
        if self.lstm_model:
            self.lstm_model.save(model_dir / "lstm_model.h5")
        
        if self.xgb_model:
            self.xgb_model.save_model(str(model_dir / "xgboost_model.json"))
        
        # Save scaler
        joblib.dump(self.scaler, model_dir / "scaler.pkl")
        
        # Save metadata
        metadata = {
            'symbol': self.symbol,
            'timeframe': self.timeframe,
            'features': self.feature_columns,
            'created_at': datetime.now().isoformat()
        }
        with open(model_dir / "metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Models saved to {model_dir}")
    
    def load_models(self):
        """Load trained models from disk"""
        model_dir = self.models_dir / f"{self.symbol}-{self.timeframe}"
        
        if not model_dir.exists():
            raise FileNotFoundError(f"No trained models found for {self.symbol} {self.timeframe}")
        
        # Load scaler
        self.scaler = joblib.load(model_dir / "scaler.pkl")
        
        # Load LSTM if exists
        lstm_path = model_dir / "lstm_model.h5"
        if lstm_path.exists() and HAS_TENSORFLOW:
            self.lstm_model = load_model(lstm_path)
        
        # Load XGBoost if exists
        xgb_path = model_dir / "xgboost_model.json"
        if xgb_path.exists() and HAS_XGBOOST:
            self.xgb_model = xgb.XGBRegressor()
            self.xgb_model.load_model(str(xgb_path))
        
        print(f"Models loaded from {model_dir}")


def main():
    """Main training function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Train Quant AI models")
    parser.add_argument('--symbol', type=str, default='BTC', help='Trading symbol')
    parser.add_argument('--timeframe', type=str, default='1h', help='Timeframe (1h, 4h, 1d)')
    parser.add_argument('--data', type=str, help='Path to CSV data file (optional)')
    parser.add_argument('--test-size', type=float, default=0.2, help='Test split size')
    
    args = parser.parse_args()
    
    print(f"\n{'='*60}")
    print(f"Quant AI Training - {args.symbol} {args.timeframe}")
    print(f"{'='*60}\n")
    
    trainer = QuantModelTrainer(args.symbol, args.timeframe)
    
    # Load data
    print("Loading data...")
    df = trainer.load_data(args.data)
    print(f"Loaded {len(df)} samples")
    
    # Prepare features
    print("\nPreparing features...")
    X, y = trainer.prepare_features(df)
    print(f"Feature matrix shape: {X.shape}")
    print(f"Target vector shape: {y.shape}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, shuffle=False  # Time series - no shuffle
    )
    print(f"\nTrain: {len(X_train)} samples, Test: {len(X_test)} samples")
    
    # Train models
    print("\n" + "="*60)
    print("Training Models")
    print("="*60)
    
    # XGBoost
    if HAS_XGBOOST:
        print("\n[1] Training XGBoost...")
        trainer.train_xgboost(X_train, y_train)
    else:
        print("\n[1] Skipping XGBoost (not installed)")
    
    # LSTM
    if HAS_TENSORFLOW:
        print("\n[2] Training LSTM...")
        trainer.train_lstm(X_train, y_train)
    else:
        print("\n[2] Skipping LSTM (not installed)")
    
    # Evaluate
    if trainer.lstm_model or trainer.xgb_model:
        print("\n" + "="*60)
        print("Evaluation")
        print("="*60)
        
        metrics = trainer.evaluate(X_test, y_test)
        for key, value in metrics.items():
            print(f"{key}: {value:.4f}")
    
    # Save models
    if trainer.lstm_model or trainer.xgb_model:
        print("\nSaving models...")
        trainer.save_models()
    
    print("\n✅ Training complete!")


if __name__ == "__main__":
    main()
