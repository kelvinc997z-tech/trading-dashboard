#!/usr/bin/env python3
"""
Quant AI - Model Inference
Loads trained model and predicts price direction
"""

import sys
import json
import joblib
import numpy as np
from pathlib import Path
from datetime import datetime

try:
    import tensorflow as tf
    HAS_TF = True
except ImportError:
    HAS_TF = False

class QuantPredictor:
    def __init__(self, symbol: str, timeframe: str = "1h"):
        self.symbol = symbol.upper()
        self.timeframe = timeframe
        self.models_dir = Path(__file__).parent / "models" / f"{self.symbol}-{self.timeframe}"
        
        self.scaler = None
        self.xgb_model = None
        self.lstm_model = None
        self.ensemble_config = None
        
        self.load_models()
    
    def load_models(self):
        """Load all model artifacts"""
        # Load scaler
        scaler_path = self.models_dir / "scaler.joblib"
        if scaler_path.exists():
            self.scaler = joblib.load(scaler_path)
        else:
            raise FileNotFoundError(f"Scaler not found at {scaler_path}. Model needs training first.")
        
        # Load XGBoost
        xgb_path = self.models_dir / "xgboost_model.joblib"
        if xgb_path.exists():
            self.xgb_model = joblib.load(xgb_path)
        
        # Load LSTM (if exists)
        lstm_path = self.models_dir / "lstm_model.keras"
        if HAS_TF and lstm_path.exists():
            self.lstm_model = tf.keras.models.load_model(str(lstm_path))
        
        # Load ensemble config
        config_path = self.models_dir / "ensemble_config.json"
        if config_path.exists():
            with open(config_path, 'r') as f:
                self.ensemble_config = json.load(f)
        else:
            # Fallback: use whichever models available
            models = []
            weights = []
            if self.xgb_model:
                models.append('xgboost')
                weights.append(0.6)
            if self.lstm_model:
                models.append('lstm')
                weights.append(0.4)
            if not weights:
                raise ValueError("No models available for inference")
            # Normalize
            total = sum(weights)
            weights = [w/total for w in weights]
            self.ensemble_config = {
                'models': models,
                'weights': weights,
            }
    
    def predict(self, features: list) -> dict:
        """
        Make prediction given feature vector.
        Returns: dict with direction, confidence, prices
        """
        # Reshape and scale
        X = np.array(features).reshape(1, -1)
        X_scaled = self.scaler.transform(X)
        
        # Get predictions from each model
        predictions = {}
        
        if self.xgb_model:
            xgb_pred_proba = self.xgb_model.predict_proba(X_scaled)[0]
            predictions['xgboost'] = xgb_pred_proba
        
        if self.lstm_model and HAS_TF:
            # LSTM expects sequence (batch, timesteps, features)
            # For single prediction, we need to create a dummy sequence
            # In real use, features should be a sequence of 60
            sequence_length = 60
            if len(features) >= sequence_length:
                # Assume features are flattened: [latest, lag1, lag2, ...]
                # We need last 60 timesteps
                close_idx = 0  # assuming close price is first feature
                # Extract close prices for sequence
                close_prices = [features[close_idx]] + [features[60 + i] for i in range(59)]  # simplistic
                X_seq = np.array([X_scaled[-sequence_length:]])  # use last 60 timesteps
                lstm_pred_proba = self.lstm_model.predict(X_seq, verbose=0)[0]
                predictions['lstm'] = lstm_pred_proba
        
        # Ensemble: weighted average
        weights = self.ensemble_config['weights']
        model_names = self.ensemble_config['models']
        
        ensemble_proba = np.zeros(3)  # hold, buy, sell
        for name, w in zip(model_names, weights):
            if name in predictions:
                ensemble_proba += predictions[name] * w
        
        # Get final prediction
        predicted_class = int(np.argmax(ensemble_proba))
        confidence = float(ensemble_proba[predicted_class])
        
        direction_map = {0: "neutral", 1: "buy", 2: "sell"}
        direction = direction_map.get(predicted_class, "neutral")
        
        # Calculate TP/SL based on direction and ATR (assuming ATR is at index 13)
        current_price = features[0]
        atr = features[13] if len(features) > 13 else current_price * 0.01
        
        if direction == "buy":
            predicted_change = 0.02 + (confidence - 0.5) * 0.04  # 1-3% based on confidence
            predicted_price = current_price * (1 + predicted_change)
            take_profit = predicted_price
            stop_loss = current_price - atr
        elif direction == "sell":
            predicted_change = -0.02 - (confidence - 0.5) * 0.04
            predicted_price = current_price * (1 + predicted_change)
            take_profit = predicted_price
            stop_loss = current_price + atr
        else:
            predicted_price = current_price
            take_profit = current_price * 1.01
            stop_loss = current_price * 0.99
        
        return {
            "symbol": self.symbol,
            "timeframe": self.timeframe,
            "direction": direction,
            "confidence": round(confidence * 100, 1),
            "predictedPrice": round(predicted_price, 4),
            "predictedChange": round(((predicted_price - current_price) / current_price) * 100, 4),
            "entryPrice": round(current_price, 4),
            "takeProfit": round(take_profit, 4),
            "stopLoss": round(stop_loss, 4),
            "featuresUsed": ["RSI", "MACD", "SMAs", "ATR", "Volume", "PastCloses"],
            "modelType": "ensemble",
            "timestamp": datetime.now().isoformat(),
        }

def main():
    # Read JSON from stdin
    input_str = sys.stdin.read()
    try:
        data = json.loads(input_str)
        symbol = data.get('symbol', 'BTC')
        timeframe = data.get('timeframe', '1h')
        features = data.get('features', [])
        
        predictor = QuantPredictor(symbol, timeframe)
        result = predictor.predict(features)
        print(json.dumps(result))
    except Exception as e:
        error = {"error": str(e)}
        print(json.dumps(error))
        sys.exit(1)

if __name__ == "__main__":
    main()
