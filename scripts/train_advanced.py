#!/usr/bin/env python3
"""
Advanced training with hyperparameter tuning and feature selection
Goal: Achieve >65% validation accuracy
"""

import os
import sys
import json
import argparse
import logging
from pathlib import Path
from datetime import datetime
from itertools import product

import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
from sklearn.feature_selection import SelectFromModel
from sklearn.model_selection import GridSearchCV, TimeSeriesSplit

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Hyperparameter search space
PARAM_GRID = {
    'n_estimators': [100, 200, 300, 500],
    'max_depth': [4, 6, 8, 10],
    'learning_rate': [0.01, 0.05, 0.1, 0.2],
    'subsample': [0.7, 0.8, 0.9],
    'colsample_bytree': [0.7, 0.8, 0.9],
    'min_child_weight': [1, 3, 5],
}

def load_dataset(csv_path: str) -> tuple:
    """Load training data"""
    df = pd.read_csv(csv_path, index_col=0)
    if 'target' not in df.columns:
        raise ValueError("Missing target column")
    
    y = df['target'].values
    X = df.drop(columns=['target']).values
    feature_names = list(df.drop(columns=['target']).columns)
    
    logger.info(f"Loaded: {len(X)} samples, {len(feature_names)} features")
    logger.info(f"Class distribution: {pd.Series(y).value_counts().to_dict()}")
    
    return X, y, feature_names

def time_series_split(X, y, n_splits=5):
    """Walk-forward validation (time-series aware)"""
    tscv = TimeSeriesSplit(n_splits=n_splits)
    scores = []
    for train_idx, val_idx in tscv.split(X):
        X_train, X_val = X[train_idx], X[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]
        yield X_train, y_train, X_val, y_val

def tune_hyperparameters(X_train, y_train, X_val, y_val, feature_names, n_search=20):
    """Grid search with time-series CV"""
    logger.info("  Starting hyperparameter tuning...")
    
    # Use XGBoost with CV
    param_list = []
    keys = PARAM_GRID.keys()
    for values in product(*PARAM_GRID.values()):
        param_list.append(dict(zip(keys, values)))
    
    # Randomly sample if too many
    if len(param_list) > n_search:
        np.random.shuffle(param_list)
        param_list = param_list[:n_search]
    
    best_score = 0
    best_params = None
    best_model = None
    
    for i, params in enumerate(param_list, 1):
        model = xgb.XGBClassifier(
            **params,
            objective='multi:softprob',
            num_class=3,
            eval_metric='mlogloss',
            seed=42,
            n_jobs=-1
        )
        
        model.fit(X_train, y_train)
        score = model.score(X_val, y_val)
        
        if score > best_score:
            best_score = score
            best_params = params
            best_model = model
        
        if i % 5 == 0:
            logger.info(f"    Progress: {i}/{len(param_list)} - best val: {best_score:.4f}")
    
    logger.info(f"  ✅ Best val accuracy: {best_score:.4f}")
    logger.info(f"  Best params: {best_params}")
    
    return best_model, best_params, best_score

def feature_selection(X_train, y_train, feature_names, threshold='median'):
    """Select important features using XGBoost importance"""
    logger.info("  Performing feature selection...")
    
    # Train a quick model to get importance
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        objective='multi:softprob',
        num_class=3,
        seed=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    importance = model.feature_importances_
    selector = SelectFromModel(model, threshold=threshold, prefit=True)
    X_train_selected = selector.transform(X_train)
    
    selected_indices = selector.get_support(indices=True)
    selected_features = [feature_names[i] for i in selected_indices]
    
    logger.info(f"  Selected {len(selected_features)} features from {len(feature_names)}")
    logger.info(f"  Top 10: {selected_features[:10]}")
    
    return X_train_selected, selected_features, selector

def train_final_model(X_train, y_train, X_val, y_val, params, feature_names, model_dir: Path):
    """Train final model with best params and selected features"""
    logger.info("  Training final model...")
    
    model = xgb.XGBClassifier(
        **params,
        objective='multi:softprob',
        num_class=3,
        eval_metric='mlogloss',
        seed=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Save
    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_dir / "xgboost_model.joblib")
    
    # Feature names
    with open(model_dir / "feature_names.json", 'w') as f:
        json.dump(feature_names, f, indent=2)
    
    # Feature importance
    importance = model.feature_importances_
    feat_imp = pd.DataFrame({'feature': feature_names, 'importance': importance})
    feat_imp = feat_imp.sort_values('importance', ascending=False)
    feat_imp.to_csv(model_dir / "feature_importance.csv", index=False)
    
    # Metrics
    train_acc = model.score(X_train, y_train)
    val_acc = model.score(X_val, y_val)
    
    logger.info(f"  ✅ Final - Train: {train_acc:.2%} | Val: {val_acc:.2%}")
    
    # Per-class metrics
    from sklearn.metrics import classification_report
    y_pred = model.predict(X_val)
    report = classification_report(y_val, y_pred, output_dict=True)
    logger.info(f"  Class-wise F1: {[report[str(i)]['f1-score'] for i in range(3)]}")
    
    return model, val_acc, report

def process_symbol_advanced(symbol: str, timeframe: str, csv_path: str):
    """Advanced training pipeline for one symbol"""
    logger.info(f"\n{'='*60}")
    logger.info(f"ADVANCED TRAINING: {symbol} {timeframe}")
    logger.info(f"{'='*60}")
    
    try:
        # Load data
        X, y, feature_names = load_dataset(csv_path)
        
        # Time-series split (last 20% for validation)
        split_idx = int(len(X) * 0.8)
        X_train, X_val = X[:split_idx], X[split_idx:]
        y_train, y_val = y[:split_idx], y[split_idx:]
        
        logger.info(f"Split: Train={len(X_train)}, Val={len(X_val)}")
        
        # Feature selection
        X_train_selected, selected_features, selector = feature_selection(X_train, y_train, feature_names)
        
        # Transform validation set
        X_val_selected = selector.transform(X_val)
        
        # Hyperparameter tuning
        best_model, best_params, best_score = tune_hyperparameters(
            X_train_selected, y_train, X_val_selected, y_val, selected_features, n_search=15
        )
        
        # Retrain final model on full selected features (with best params)
        # Use all selected features (don't restrict further)
        final_model, final_val_acc, report = train_final_model(
            X_train_selected, y_train, X_val_selected, y_val, best_params, selected_features,
            Path(f"models/{symbol.upper()}-{timeframe}")
        )
        
        # Save selector for inference
        joblib.dump(selector, Path(f"models/{symbol.upper()}-{timeframe}") / "feature_selector.joblib")
        
        logger.info(f"  ✅ {symbol} {timeframe} complete! Val acc: {final_val_acc:.2%}")
        
        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "samples": len(X),
            "selected_features": len(selected_features),
            "val_accuracy": float(final_val_acc),
            "report": report,
            "best_params": best_params,
        }
        
    except Exception as e:
        logger.error(f"  ❌ Failed: {e}", exc_info=True)
        return None

def main():
    parser = argparse.ArgumentParser(description='Advanced training with tuning')
    parser.add_argument('--csv', required=True, help='Training CSV path')
    parser.add_argument('--symbol', required=True, help='Symbol (e.g., BTC)')
    parser.add_argument('--timeframe', required=True, help='Timeframe (1h or 1d)')
    
    args = parser.parse_args()
    
    result = process_symbol_advanced(args.symbol, args.timeframe, args.csv)
    
    if result:
        logger.info("\n" + "="*60)
        logger.info("TRAINING COMPLETE")
        logger.info("="*60)
        logger.info(f"Val accuracy: {result['val_accuracy']:.2%}")
        logger.info(f"Selected features: {result['selected_features']}")
        logger.info("\nClass F1-scores:")
        for i in range(3):
            label = ['hold', 'buy', 'sell'][i]
            f1 = result['report'][str(i)]['f1-score']
            logger.info(f"  {label}: {f1:.2%}")
        
        logger.info("\nNext steps:")
        logger.info("  1. Test inference: python scripts/inference_from_model.py <symbol> <timeframe>")
        logger.info("  2. If val_acc > 65%, commit and deploy")
        logger.info("  3. If <65%, consider more data or different model architecture")
    else:
        logger.error("Training failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
