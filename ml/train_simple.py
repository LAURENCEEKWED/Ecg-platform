
import os
import numpy as np
import pandas as pd
import joblib
import tensorflow as tf
from tensorflow.keras import layers, models
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder

# Create directories
os.makedirs('data/processed', exist_ok=True)
os.makedirs('models', exist_ok=True)

# Generate synthetic data
print('Generating synthetic training data...')
WINDOW_SIZE = 500
num_samples = 5000
X = []
y = []
features_list = []

for i in range(num_samples):
    t = np.linspace(0, 1, WINDOW_SIZE, endpoint=False)
    freq = np.random.uniform(1, 3)
    signal = np.sin(2 * np.pi * freq * t) + 0.1 * np.random.randn(WINDOW_SIZE)
    X.append(signal)
    
    class_idx = np.random.randint(0, 5)
    classes = ['NORMAL', 'TACHYCARDIA', 'BRADYCARDIA', 'AFIB', 'PVC']
    y.append(class_idx)
    
    hr = np.random.uniform(60, 100)
    if class_idx == 1:
        hr = np.random.uniform(100, 180)
    if class_idx == 2:
        hr = np.random.uniform(30, 60)
    
    features_list.append({
        'heart_rate_bpm': hr,
        'qt_interval_ms': 420 + np.random.randn() * 40,
        'qrs_duration_ms': 88 + np.random.randn() * 10,
        'pr_interval_ms': 160 + np.random.randn() * 20,
        'st_deviation_mm': 0.1 + np.random.randn() * 0.1,
        'hrv_rmssd_ms': 45 + np.random.randn() * 15,
        'p_wave_axis': 45 + np.random.randn() * 20,
        'rhythm_encoded': class_idx
    })

X = np.array(X)
y = np.array(y)
features_df = pd.DataFrame(features_list)

np.save('data/processed/X_ecg.npy', X)
np.save('data/processed/y_arrhythmia.npy', y)
features_df.to_csv('data/processed/ecg_features.csv', index=False)

print('Synthetic data created! Now training models...')

# Train simple arrhythmia model
print('Training arrhythmia classification model...')
model = models.Sequential([
    layers.Input(shape=(WINDOW_SIZE,)),
    layers.Reshape((WINDOW_SIZE, 1)),
    layers.Conv1D(32, 7, activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling1D(2),
    layers.Conv1D(64, 5, activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling1D(2),
    layers.GlobalAveragePooling1D(),
    layers.Dense(32, activation='relu'),
    layers.Dense(5, activation='softmax')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
model.fit(X, y, epochs=5, batch_size=32, validation_split=0.2, verbose=1)
model.save('models/arrhythmia_cnn_v2.1.keras')
print('✅ Arrhythmia model trained and saved!')

# Train simple CVD risk model
print('\nTraining CVD risk prediction model...')
X_risk = features_df.drop('rhythm_encoded', axis=1)
y_risk = np.random.randint(0, 100, size=num_samples)  # Simulated risk score

X_train, X_val, y_train, y_val = train_test_split(X_risk, y_risk, test_size=0.2, random_state=42)

model_risk = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1)
model_risk.fit(X_train, y_train)
model_risk.save_model('models/cvd_risk_xgboost_v1.7.json')
print('✅ CVD risk model trained and saved!')

# Save scaler and encoder
print('\nSaving preprocessing objects...')
scaler = StandardScaler()
scaler.fit(X_risk)
joblib.dump(scaler, 'models/cvd_scaler.pkl')

le = LabelEncoder()
le.fit(['NORMAL', 'TACHYCARDIA', 'BRADYCARDIA', 'AFIB', 'PVC'])
joblib.dump(le, 'models/rhythm_encoder.pkl')

print('\n🎉 All models trained successfully!')
print('\nModels are in: c:\\Users\\user\\Desktop\\ecg-platform\\ml\\models')
