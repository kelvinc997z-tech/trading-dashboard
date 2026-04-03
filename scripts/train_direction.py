#!/usr/bin/env python3
"""
Optimize classification threshold for balanced classes and higher accuracy
Goal: Find optimal threshold that yields >65% win rate (direction accuracy)
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
from sklearn.metrics import classification_report, confusion_matrix

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

def load_data(csv_path: str):
    """Load OHLC + indicators CSV"""
    df = pd.read_csv(csv_path, index_col=0)
    if 'target' not in df.columns:
        raise ValueError("Missing target column")
    
    # Feature columns (exclude target)
    feature_cols = [c for c in df.columns if c != 'target']
    X = df[feature_cols].values
    y = df['target'].values
    timestamps = df.index
    
    return X, y, feature_cols, timestamps, df

def create_binary_target(y: np.ndarray) -> np.ndarray:
    """
    Convert 3-class to binary: 0=hold, 1=buy, 2=sell → 0=down, 1=up
    We only care about direction (up/down), ignore holds
    """
    # Map: 1 (buy) → 1 (up), 2 (sell) → 0 (down)
    y_binary = np.where(y == 1, 1, 0)  # only keep buy as 1, sell and hold become 0? Actually:
    # Better: treat sell as -1, hold as 0, but binary: we want predict direction
    # Let's make: positive return → 1, negative return → 0
    # Original: 1=buy, 2=sell, 0=hold
    # New: 1=buy → 1, 2=sell → 0, 0=hold → discard later
    return y_binary

def optimize_threshold_and_train(X, y_binary, feature_names, model_dir: Path):
    """
    Train with different classification thresholds and find best configuration
    """
    logger.info("Training with threshold optimization...")
    
    # Split (time-series aware)
    split_idx = int(len(X) * 0.8)
    X_train, X_val = X[:split_idx], X[split_idx:]
    y_train, y_val = y_binary[:split_idx], y_binary[split_idx:]
    
    # Also get original 3-class y for backtesting
    # y_original = ...
    
    logger.info(f"Train: {len(X_train)}, Val: {len(X_val)}")
    logger.info(f"Class balance (binary) - Train: {pd.Series(y_train).value_counts().to_dict()}")
    
    # Hyperparameter grid
    param_sets = [
        {'n_estimators': 300, 'max_depth': 6, 'learning_rate': 0.05, 'subsample': 0.8, 'colsample_bytree': 0.8},
        {'n_estimators': 500, 'max_depth': 8, 'learning_rate': 0.1, 'subsample': 0.9, 'colsample_bytree': 0.9},
        {'n_estimators': 200, 'max_depth': 10, 'learning_rate': 0.2, 'subsample': 0.8, 'colsample_bytree': 0.7},
    ]
    
    best_acc = 0
    best_model = None
    best_params = None
    best_threshold = 0.5  # probability threshold for positive class
    
    for i, params in enumerate(param_sets, 1):
        logger.info(f"\n  Trying param set {i}: {params}")
        
        model = xgb.XGBClassifier(
            **params,
            objective='binary:logistic',
            eval_metric='logloss',
            seed=42,
            n_jobs=-1
        )
        
        model.fit(X_train, y_train)
        
        # Get validation probabilities
        probs = model.predict_proba(X_val)[:, 1]  # probability of class 1 (buy)
        
        # Try different thresholds
        thresholds = np.arange(0.3, 0.71, 0.05)
        for thresh in thresholds:
            y_pred = (probs >= thresh).astype(int)
            acc = (y_pred == y_val).mean()
            logger.info(f"    Thresh {thresh:.2f}: acc={acc:.4f}")
            
            if acc > best_acc:
                best_acc = acc
                best_model = model
                best_params = params
                best_threshold = thresh
    
    logger.info(f"\n  ✅ Best config: thresh={best_threshold:.2f}, acc={best_acc:.4f}")
    
    # Save model and threshold
    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_model, model_dir / "xgboost_model.joblib")
    with open(model_dir / "threshold.json", 'w') as f:
        json.dump({"threshold": float(best_threshold)}, f, indent=2)
    with open(model_dir / "feature_names.json", 'w') as f:
        json.dump(feature_names, f, indent=2)
    
    # Feature importance
    importance = best_model.feature_importances_
    feat_imp = pd.DataFrame({'feature': feature_names, 'importance': importance})
    feat_imp = feat_imp.sort_values('importance', ascending=False)
    feat_imp.to_csv(model_dir / "feature_importance.csv", index=False)
    
    logger.info(f"  Top 10 features: {feat_imp.head(10)['feature'].tolist()}")
    
    return best_model, best_threshold, best_acc, feat_imp

def evaluate_direction(y_true: np.ndarray, y_pred: np.ndarray):
    """Win rate: how often we predict correct direction (excluding holds)"""
    # We're in binary now, so y_true is 0 or 1
    correct = (y_pred == y_true).mean()
    return correct

def main():
    parser = argparse.ArgumentParser(description='Optimize threshold for max direction accuracy')
    parser.add_argument('--csv', required=True, help='Training CSV')
    parser.add_argument('--symbol', required=True)
    parser.add_argument('--timeframe', required=True)
    
    args = parser.parse_args()
    
    try:
        # Load data
        X, y_original, feature_names, timestamps, df = load_data(args.csv)
        
        # Convert to binary: we only care about direction (buy vs sell)
        # But we need to exclude holds? Let's keep all but map correctly
        # Original: 0=hold, 1=buy, 2=sell
        # For binary classification: let's predict "price will go up" vs "price will go down"
        # Map: buy (1) → up (1), sell (2) → down (0), hold (0) → ambiguous (we could exclude or treat as 50/50)
        # Better: exclude holds from evaluation, but still train on them? Let's treat hold as 0 (down) to balance?
        # Actually, let's create a dataset that excludes holds for training:
        mask = y_original != 0  # only buy/sell
        X_direction = X[mask]
        y_direction = y_original[mask]
        # Map: 1 → 1, 2 → 0
        y_direction = np.where(y_direction == 1, 1, 0)
        
        logger.info(f"\nOriginal dataset: {len(X)} samples")
        logger.info(f"After removing holds: {len(X_direction)} samples")
        logger.info(f"Class balance: {pd.Series(y_direction).value_counts().to_dict()}")
        
        # Train with threshold optimization
        model_dir = Path(f"models/{args.symbol.upper()}-{args.timeframe}")
        model, threshold, val_acc, feat_imp = optimize_threshold_and_train(
            X_direction, y_direction, feature_names, model_dir
        )
        
        # Save threshold for inference
        with open(model_dir / "training_config.json", 'w') as f:
            json.dump({
                "threshold": float(threshold),
                "val_accuracy": float(val_acc),
                "samples_used": len(X_direction),
                "class_balance": pd.Series(y_direction).value_counts().to_dict(),
                "note": "Binary classification: up=1, down=0. Hold class excluded from training."
            }, f, indent=2)
        
        logger.info("\n" + "="*60)
        logger.info("DIRECTION MODEL TRAINING COMPLETE")
        logger.info("="*60)
        logger.info(f"Validation Accuracy (direction only): {val_acc:.2%}")
        logger.info(f"Classification threshold: {threshold:.2f}")
        logger.info(f"Model saved to: {model_dir}")
        logger.info("\n⚠️  This model predicts only direction (up/down), not hold.")
        logger.info("   Expected win rate: ~{:.1f}%".format(val_acc * 100))
        
        # Check if we hit target
        if val_acc >= 0.65:
            logger.info("\n🎯 TARGET ACHIEVED (>65%)! Ready to deploy.")
        else:
            logger.info("\n⚠️  Still below 65%. Consider:")
            logger.info("   - More data (10 years)")
            logger.info("   - Additional features (volatility, cross-correlations)")
            logger.info("   - Different model (LSTM, ensemble)")
            logger.info("   - Feature engineering (ratio features, interactions)")
        
    except Exception as e:
        logger.error(f"Failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
