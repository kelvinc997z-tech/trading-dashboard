#!/usr/bin/env python3
"""
Test inference using trained XGBoost model
Run: python scripts/inference_from_model.py BTC 1h --features FEATURES_ARRAY_JSON
"""

import os
import sys
import json
import argparse
import logging
from pathlib import Path
from datetime import datetime

import numpy as np
import joblib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_model(model_dir: Path):
    """Load trained XGBoost model and feature names"""
    model_path = model_dir / "xgboost_model.joblib"
    features_path = model_dir / "feature_names.json"
    
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")
    if not features_path.exists():
        raise FileNotFoundError(f"Feature names not found: {features_path}")
    
    model = joblib.load(model_path)
    with open(features_path, 'r') as f:
        feature_names = json.load(f)
    
    logger.info(f"Loaded model from {model_path}")
    logger.info(f"Features ({len(feature_names)}): {feature_names[:10]}...")
    
    return model, feature_names

def predict(model, feature_names: list, features: np.ndarray) -> dict:
    """Make prediction from feature vector"""
    # Ensure features is 2D array (1 sample)
    if features.ndim == 1:
        features = features.reshape(1, -1)
    
    # Check feature count
    if features.shape[1] != len(feature_names):
        raise ValueError(f"Expected {len(feature_names)} features, got {features.shape[1]}")
    
    # Predict probabilities
    probs = model.predict_proba(features)[0]  # [hold, buy, sell]
    pred_class = model.predict(features)[0]
    
    direction_map = {0: "neutral", 1: "buy", 2: "sell"}
    direction = direction_map.get(pred_class, "neutral")
    confidence = float(probs[pred_class] * 100)
    
    # Generate TP/SL based on direction and recent features (simplified)
    current_price = features[0, 0]  # first feature is close price
    atr = features[0, 14] if features.shape[1] > 14 else current_price * 0.01
    
    if direction == "buy":
        take_profit = current_price * 1.02  # simplistic
        stop_loss = current_price - atr
    elif direction == "sell":
        take_profit = current_price * 0.98
        stop_loss = current_price + atr
    else:
        take_profit = current_price * 1.01
        stop_loss = current_price * 0.99
    
    return {
        "direction": direction,
        "confidence": round(confidence, 2),
        "entryPrice": round(float(current_price), 2),
        "takeProfit": round(float(take_profit), 2),
        "stopLoss": round(float(stop_loss), 2),
        "probabilities": {
            "hold": round(float(probs[0]) * 100, 2),
            "buy": round(float(probs[1]) * 100, 2),
            "sell": round(float(probs[2]) * 100, 2),
        },
        "modelType": "xgboost",
    }

def main():
    parser = argparse.ArgumentParser(description='Test model inference')
    parser.add_argument('symbol', help='Symbol (e.g., BTC)')
    parser.add_argument('timeframe', help='Timeframe (1h, 4h, 1d)')
    parser.add_argument('--features', help='JSON array of feature values (optional)')
    parser.add_argument('--model-dir', default=None, help='Custom model directory')
    
    args = parser.parse_args()
    
    try:
        # Load model
        symbol = args.symbol.upper()
        timeframe = args.timeframe
        model_dir = Path(args.model_dir or f"models/{symbol}-{timeframe}")
        
        model, feature_names = load_model(model_dir)
        
        # Generate or load features
        if args.features:
            # User provided features as JSON
            features = np.array(json.loads(args.features), dtype=np.float32)
        else:
            # Generate random features for demo (replace with real later)
            logger.info("No features provided, generating random features for demo...")
            features = np.random.randn(len(feature_names)).astype(np.float32)
            # Set close price to something realistic (e.g., BTC ~70000)
            if symbol == "BTC":
                features[0] = 70000 + np.random.randn() * 1000
            # Set RSI to some value
            if 'rsi' in feature_names:
                idx = feature_names.index('rsi')
                features[idx] = 50 + np.random.randn() * 10
        
        # Predict
        result = predict(model, feature_names, features)
        
        print("\n" + "="*50)
        print(f"🎯 PREDICTION FOR {symbol} {timeframe}")
        print("="*50)
        print(f"Direction: {result['direction'].upper()}")
        print(f"Confidence: {result['confidence']}%")
        print(f"Entry Price: ${result['entryPrice']:,.2f}")
        print(f"Take Profit: ${result['takeProfit']:,.2f}")
        print(f"Stop Loss: ${result['stopLoss']:,.2f}")
        print("\nProbabilities:")
        print(f"  Hold: {result['probabilities']['hold']}%")
        print(f"  Buy:  {result['probabilities']['buy']}%")
        print(f"  Sell: {result['probabilities']['sell']}%")
        print("="*50)
        
        logger.info("Inference successful!")
        
    except Exception as e:
        logger.error(f"Failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
