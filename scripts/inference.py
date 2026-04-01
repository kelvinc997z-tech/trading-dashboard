#!/usr/bin/env python3
"""
ML Model Inference Script
Called from Node.js to load models and generate predictions
"""

import sys
import json
import joblib
import numpy as np
from pathlib import Path

try:
    import tensorflow as tf
    HAS_TF = True
except ImportError:
    HAS_TF = False
    print("TensorFlow not available, LSTM disabled", file=sys.stderr)

try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("XGBoost not available, XGBoost disabled", file=sys.stderr)


def load_model(symbol: str, timeframe: str):
    """Load trained model for given symbol/timeframe"""
    models_dir = Path(__file__).parent.parent / "models"
    model_path = models_dir / f"{symbol}-{timeframe}"
    
    if not model_path.exists():
        return None
    
    # Try loading XGBoost first (faster)
    xgb_path = model_path / "xgb_model.json"
    if xgb_path.exists() and HAS_XGBOOST:
        model = xgb.Booster()
        model.load_model(str(xgb_path))
        return {"type": "xgboost", "model": model}
    
    # Try LSTM
    lstm_path = model_path / "lstm_model.h5"
    if lstm_path.exists() and HAS_TF:
        model = tf.keras.models.load_model(str(lstm_path))
        return {"type": "lstm", "model": model}
    
    return None


def predict(features: list, symbol: str, timeframe: str):
    """Generate prediction using loaded model"""
    model_info = load_model(symbol, timeframe)
    
    if model_info is None:
        # No model available, return dummy prediction
        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "direction": "neutral",
            "confidence": 50.0,
            "predictedPrice": None,
            "predictedChange": 0.0,
            "modelType": "fallback-heuristic",
            "error": "No trained model available"
        }
    
    X = np.array(features).reshape(1, -1)  # shape (1, n_features)
    
    if model_info["type"] == "xgboost":
        dmatrix = xgb.DMatrix(X)
        pred = model_info["model"].predict(dmatrix)[0]
        # Convert regression output to direction
        if pred > 0.5:
            direction = "buy"
            confidence = min(pred * 100, 99)
        elif pred < -0.5:
            direction = "sell"
            confidence = min(abs(pred) * 100, 99)
        else:
            direction = "neutral"
            confidence = 50
        
        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "direction": direction,
            "confidence": round(confidence, 2),
            "predictedPrice": None,  # Would need additional logic to convert % change to price
            "predictedChange": round(float(pred), 4),
            "modelType": "xgboost"
        }
    
    elif model_info["type"] == "lstm":
        # Reshape for LSTM [1, timesteps, features] - assumes features already include lookback?
        # For simplicity, treat as dense input (need proper reshaping in practice)
        pred = model_info["model"].predict(X, verbose=0)[0][0]
        
        direction = "buy" if pred > 0 else "sell"
        confidence = min(abs(pred) * 100, 99)
        
        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "direction": direction,
            "confidence": round(confidence, 2),
            "predictedPrice": None,
            "predictedChange": round(float(pred * 100), 4),  # assume output is % change
            "modelType": "lstm"
        }
    
    return {"error": "Unknown model type"}


if __name__ == "__main__":
    # Expect JSON on stdin
    try:
        input_data = json.loads(sys.stdin.read())
        features = input_data["features"]
        symbol = input_data["symbol"]
        timeframe = input_data.get("timeframe", "1h")
        
        result = predict(features, symbol, timeframe)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
