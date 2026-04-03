#!/usr/bin/env python3
"""
Simplified Training Script for Quant AI
Works with small datasets (even synthetic) for development/demo

Usage: python scripts/train_simple.py [--csv data/BTC_1h_train.csv] [--symbol BTC] [--timeframe 1h]
"""

import os
import sys
import json
import argparse
import logging
from pathlib import Path
from datetime import datetime

import pandas as pd
import numpy as np
import xgboost as xgb
import joblib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_dataset(csv_path: str) -> tuple:
    """Load training data from CSV (features + target column)"""
    df = pd.read_csv(csv_path, index_col=0)  # first column is timestamp index
    
    if 'target' not in df.columns:
        raise ValueError("CSV must have 'target' column")
    
    # Separate features and target
    y = df['target'].values
    X = df.drop(columns=['target']).values
    feature_names = list(df.drop(columns=['target']).columns)
    
    logger.info(f"Loaded dataset: {len(X)} samples, {len(feature_names)} features")
    logger.info(f"Class distribution: {pd.Series(y).value_counts().to_dict()}")
    
    return X, y, feature_names

def generate_synthetic_data(n_samples: int = 500, n_features: int = 82) -> tuple:
    """Generate synthetic data for demo purposes"""
    logger.info(f"Generating synthetic data: {n_samples} samples, {n_features} features")
    
    # Generate random features
    X = np.random.randn(n_samples, n_features)
    
    # Generate synthetic target based on some patterns
    # Use first few features to create signal
    signal = (X[:, 0] * 0.3 + X[:, 1] * 0.2 + X[:, 2] * -0.1)  # close, volume, rsi pattern
    signal += np.random.randn(n_samples) * 0.5  # noise
    
    # Multi-class: 0=hold, 1=buy, 2=sell
    y = np.zeros(n_samples, dtype=int)
    y[signal > 0.5] = 1  # buy
    y[signal < -0.5] = 2  # sell
    
    # Feature names (generic)
    feature_names = [f'f{i}' for i in range(n_features)]
    
    logger.info(f"Synthetic class distribution: {pd.Series(y).value_counts().to_dict()}")
    
    return X, y, feature_names

def train_xgboost(X_train: np.ndarray, y_train: np.ndarray, 
                  X_val: np.ndarray, y_val: np.ndarray,
                  feature_names: list, model_dir: Path):
    """Train XGBoost classifier with early stopping"""
    logger.info("Training XGBoost model...")
    
    params = {
        'n_estimators': 200,
        'max_depth': 6,
        'learning_rate': 0.05,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'objective': 'multi:softprob',
        'num_class': 3,
        'eval_metric': 'mlogloss',
        'seed': 42,
        'n_jobs': -1,
    }
    
    model = xgb.XGBClassifier(**params)
    
    # Train with early stopping using eval_set
    model.set_params(eval_set=[(X_val, y_val)], verbose=50)
    model.fit(X_train, y_train)
    
    # Save model
    model_path = model_dir / "xgboost_model.joblib"
    joblib.dump(model, model_path)
    logger.info(f"✓ Model saved to {model_path}")
    
    # Feature importance
    importance = model.feature_importances_
    feat_imp = pd.DataFrame({
        'feature': feature_names,
        'importance': importance
    }).sort_values('importance', ascending=False)
    
    feat_imp_path = model_dir / "feature_importance.csv"
    feat_imp.to_csv(feat_imp_path, index=False)
    logger.info(f"✓ Feature importance saved to {feat_imp_path}")
    
    # Metrics
    train_pred = model.predict(X_train)
    val_pred = model.predict(X_val)
    train_acc = (train_pred == y_train).mean()
    val_acc = (val_pred == y_val).mean()
    
    logger.info(f"Training accuracy: {train_acc:.2%}")
    logger.info(f"Validation accuracy: {val_acc:.2%}")
    logger.info(f"Feature importance (top 10):")
    for _, row in feat_imp.head(10).iterrows():
        logger.info(f"  {row['feature']}: {row['importance']:.4f}")
    
    return model, feat_imp

def main():
    parser = argparse.ArgumentParser(description='Simplified Quant AI Model Training')
    parser.add_argument('--csv', help='Path to training CSV (features + target column)')
    parser.add_argument('--symbol', default='BTC', help='Symbol for model naming')
    parser.add_argument('--timeframe', default='1h', help='Timeframe (1h, 4h, 1d)')
    parser.add_argument('--synthetic', action='store_true', help='Use synthetic data instead of CSV')
    parser.add_argument('--samples', type=int, default=1000, help='Number of synthetic samples if using --synthetic')
    parser.add_argument('--model-dir', default=None, help='Custom model output directory')
    
    args = parser.parse_args()
    
    try:
        # Load or generate data
        if args.synthetic or not args.csv:
            logger.info("Using synthetic data for training (demo mode)")
            X, y, feature_names = generate_synthetic_data(args.samples, n_features=82)
        else:
            if not os.path.exists(args.csv):
                raise FileNotFoundError(f"CSV not found: {args.csv}")
            X, y, feature_names = load_dataset(args.csv)
        
        # Check minimum data
        if len(X) < 100:
            logger.warning(f"Dataset is small ({len(X)} samples). Model may overfit.")
        
        # Split train/val (80/20)
        split_idx = int(len(X) * 0.8)
        X_train, X_val = X[:split_idx], X[split_idx:]
        y_train, y_val = y[:split_idx], y[split_idx:]
        
        logger.info(f"Train set: {len(X_train)} samples")
        logger.info(f"Val set: {len(X_val)} samples")
        
        # Create model directory
        symbol = args.symbol.upper()
        timeframe = args.timeframe
        model_dir = Path(args.model_dir or f"models/{symbol}-{timeframe}")
        model_dir.mkdir(parents=True, exist_ok=True)
        
        # Save feature names
        features_path = model_dir / "feature_names.json"
        with open(features_path, 'w') as f:
            json.dump(feature_names, f, indent=2)
        logger.info(f"✓ Feature names saved to {features_path}")
        
        # Train
        model, feat_imp = train_xgboost(X_train, y_train, X_val, y_val, feature_names, model_dir)
        
        logger.info("\n✅ Training complete!")
        logger.info(f"Model files in: {model_dir}")
        logger.info("\nNext steps:")
        logger.info("  1. Test inference: python scripts/inference_from_model.py BTC 1h")
        logger.info("  2. Deploy model files to Vercel (commit to git)")
        logger.info("  3. Use /api/quant-ai/predict endpoint")
        
    except Exception as e:
        logger.error(f"Failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
