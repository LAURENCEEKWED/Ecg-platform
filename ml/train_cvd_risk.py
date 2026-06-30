
import os
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, roc_auc_score, confusion_matrix
import joblib
from data_preprocessing import preprocess_mit_bih, extract_ecg_features

# Configuration
MODEL_PATH = "models"
RHYTHM_CLASSES = ['NORMAL', 'TACHYCARDIA', 'BRADYCARDIA', 'AFIB', 'PVC']

def generate_cvd_labels(features, rhythm_class):
    """Generate simulated CVD risk labels based on ECG features and rhythm"""
    base_risk = 15
    
    # Adjust risk based on rhythm
    rhythm_risk_boost = {
        'NORMAL': 0,
        'TACHYCARDIA': 30,
        'BRADYCARDIA': 15,
        'AFIB': 45,
        'PVC': 25
    }
    base_risk += rhythm_risk_boost.get(rhythm_class, 0)
    
    # Adjust risk based on features
    if features['heart_rate_bpm'] > 100 or features['heart_rate_bpm'] < 60:
        base_risk += 10
    if features['qt_interval_ms'] > 460 or features['qt_interval_ms'] < 360:
        base_risk += 15
    if features['qrs_duration_ms'] > 110:
        base_risk += 10
    if abs(features['st_deviation_mm']) > 0.2:
        base_risk += 20
    if features['hrv_rmssd_ms'] < 20:
        base_risk += 15
    
    # Add some randomness
    risk = np.clip(base_risk + np.random.randn() * 10, 0, 100)
    
    return risk

def train_cvd_risk_model():
    """Train the XGBoost CVD risk prediction model"""
    print("Training XGBoost CVD Risk Predictor...")
    os.makedirs(MODEL_PATH, exist_ok=True)
    
    # Load or preprocess data
    if os.path.exists("data/processed/ecg_features.csv"):
        features_df = pd.read_csv("data/processed/ecg_features.csv")
    else:
        _, _, features_df = preprocess_mit_bih()
    
    # Load arrhythmia data to get rhythm classes
    if os.path.exists("data/processed/y_arrhythmia.npy"):
        y_arrhythmia = np.load("data/processed/y_arrhythmia.npy")
    else:
        _, y_arrhythmia, _ = preprocess_mit_bih()
    
    # Get rhythm class strings
    rhythm_labels = np.array([RHYTHM_CLASSES[i] for i in y_arrhythmia])
    
    # Generate CVD risk labels
    cvd_scores = []
    for idx in range(len(features_df)):
        features = features_df.iloc[idx].to_dict()
        rhythm = rhythm_labels[idx]
        score = generate_cvd_labels(features, rhythm)
        cvd_scores.append(score)
    
    cvd_scores = np.array(cvd_scores)
    
    # Prepare training data
    le = LabelEncoder()
    rhythm_encoded = le.fit_transform(rhythm_labels)
    
    X = pd.concat([
        features_df,
        pd.DataFrame({'rhythm_encoded': rhythm_encoded})
    ], axis=1)
    
    y = cvd_scores
    
    # Split data
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    
    # Create and train XGBoost model
    model = xgb.XGBRegressor(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=6,
        min_child_weight=3,
        subsample=0.8,
        colsample_bytree=0.8,
        objective='reg:squarederror',
        random_state=42
    )
    
    model.fit(
        X_train_scaled, y_train,
        eval_set=[(X_val_scaled, y_val)],
        early_stopping_rounds=20,
        verbose=10
    )
    
    # Evaluate
    y_pred = model.predict(X_val_scaled)
    mae = mean_absolute_error(y_val, y_pred)
    print(f"\nMean Absolute Error (CVD risk): {mae:.2f}")
    
    # For AUC-ROC, let's categorize into HIGH vs non-HIGH
    y_val_categorical = (y_val >= 67).astype(int)
    y_pred_categorical = (y_pred >= 67).astype(int)
    
    # Check if there are at least two classes
    if len(np.unique(y_val_categorical)) > 1:
        roc_auc = roc_auc_score(y_val_categorical, y_pred >= 67)
        print(f"AUC-ROC (HIGH risk): {roc_auc:.3f}")
    else:
        print("Not enough samples for AUC-ROC calculation")
    
    # Save model and scaler
    model.save_model(os.path.join(MODEL_PATH, 'cvd_risk_xgboost_v1.7.json'))
    joblib.dump(scaler, os.path.join(MODEL_PATH, 'cvd_scaler.pkl'))
    joblib.dump(le, os.path.join(MODEL_PATH, 'rhythm_encoder.pkl'))
    
    print("\nCVD Risk model training complete!")
    print(f"Model saved to {MODEL_PATH}")
    
    return model, scaler, le

if __name__ == "__main__":
    train_cvd_risk_model()
