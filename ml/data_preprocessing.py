import os
import wfdb
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from scipy.signal import resample, butter, filtfilt

# Configuration
MIT_BIH_PATH = "data/mit-bih"
PROCESSED_DATA_PATH = "data/processed"
SAMPLING_RATE = 360  # Original MIT-BIH sampling rate
TARGET_SAMPLING_RATE = 500  # Same as app uses
WINDOW_SIZE = 500  # 1 second window at 500 Hz

# Official list of MIT-BIH Arrhythmia Database records
MIT_BIH_RECORDS = [
    '100', '101', '102', '103', '104', '105', '106', '107', '108', '109',
    '111', '112', '113', '114', '115', '116', '117', '118', '119',
    '121', '122', '123', '124',
    '200', '201', '202', '203', '205', '207', '208', '209', '210',
    '212', '213', '214', '215', '217', '219', '220', '221', '222', '223',
    '228', '230', '231', '232', '233', '234'
]

RHYTHM_CLASSES = {
    'N': 'NORMAL',    # Normal beat
    'L': 'NORMAL',    # Left bundle branch block
    'R': 'NORMAL',    # Right bundle branch block
    'A': 'AFIB',      # Atrial premature
    'V': 'PVC',       # Premature ventricular contraction
    'F': 'PVC',       # Fusion of ventricular and normal
    'f': 'AFIB',      # Atrial fibrillation (from .atr files)
    'j': 'NORMAL',    # Nodal (junctional) premature
    'n': 'NORMAL',    # Supraventricular premature
    'E': 'PVC',       # Ventricular escape
    '/': 'NORMAL',    # Paced beat
    'Q': 'NORMAL',    # Unclassifiable
    '~': 'NORMAL'     # Signal quality change
}

def butter_bandpass(lowcut=0.5, highcut=45, fs=TARGET_SAMPLING_RATE, order=5):
    """Create a butterworth bandpass filter"""
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='band')
    return b, a

def butter_bandpass_filter(data, lowcut=0.5, highcut=45, fs=TARGET_SAMPLING_RATE, order=5):
    """Apply bandpass filter to ECG signal"""
    b, a = butter_bandpass(lowcut, highcut, fs, order)
    y = filtfilt(b, a, data)
    return y

def download_mit_bih():
    """Download MIT-BIH Arrhythmia Database"""
    print("Downloading MIT-BIH Arrhythmia Database...")
    os.makedirs(MIT_BIH_PATH, exist_ok=True)
    try:
        wfdb.dl_database('mitdb', dl_dir=MIT_BIH_PATH)
        print("Download complete!")
    except Exception as e:
        print(f"Warning: Could not download full database: {e}")
        print("Proceeding with available data...")

def extract_ecg_features(signal, fs):
    """Extract ECG features from a signal segment"""
    # Basic features
    mean_hr = 60 * (fs / (np.mean(np.diff(np.where(np.diff(signal) > 0.5)[0])) if len(np.where(np.diff(signal) > 0.5)[0]) > 1 else 70))
    
    # More features (simulated for CVD risk)
    qt_interval = 420 + np.random.randn() * 40
    qrs_duration = 88 + np.random.randn() * 10
    pr_interval = 160 + np.random.randn() * 20
    st_deviation = 0.1 + np.random.randn() * 0.1
    hrv_rmssd = 45 + np.random.randn() * 15
    p_wave_axis = 45 + np.random.randn() * 20
    
    return {
        'heart_rate_bpm': np.clip(mean_hr, 40, 200),
        'qt_interval_ms': np.clip(qt_interval, 320, 520),
        'qrs_duration_ms': np.clip(qrs_duration, 60, 120),
        'pr_interval_ms': np.clip(pr_interval, 120, 240),
        'st_deviation_mm': np.clip(st_deviation, -0.5, 0.5),
        'hrv_rmssd_ms': np.clip(hrv_rmssd, 10, 100),
        'p_wave_axis': np.clip(p_wave_axis, -90, 90)
    }

def generate_synthetic_data():
    """Generate synthetic training data if MIT-BIH is unavailable"""
    print("Generating synthetic training data...")
    
    num_samples = 5000
    X = []
    y = []
    features_list = []
    
    # Generate synthetic ECG-like signals with different rhythms
    for i in range(num_samples):
        # Generate a noisy sine wave as a synthetic ECG
        t = np.linspace(0, 1, WINDOW_SIZE, endpoint=False)
        freq = np.random.uniform(1, 3)
        signal = np.sin(2 * np.pi * freq * t) + 0.1 * np.random.randn(WINDOW_SIZE)
        
        # Randomly assign class
        class_idx = np.random.randint(0, 5)
        classes = ['NORMAL', 'TACHYCARDIA', 'BRADYCARDIA', 'AFIB', 'PVC']
        rhythm_class = classes[class_idx]
        
        X.append(signal)
        y.append(rhythm_class)
        
        # Generate synthetic features
        features = extract_ecg_features(signal, TARGET_SAMPLING_RATE)
        
        # Adjust features based on class
        if rhythm_class == 'TACHYCARDIA':
            features['heart_rate_bpm'] = np.random.uniform(100, 180)
        elif rhythm_class == 'BRADYCARDIA':
            features['heart_rate_bpm'] = np.random.uniform(30, 60)
        
        features_list.append(features)
    
    return np.array(X), np.array(y), pd.DataFrame(features_list)

def preprocess_mit_bih():
    """Preprocess MIT-BIH database into training data"""
    print("Preprocessing MIT-BIH data...")
    
    # Create output directories
    os.makedirs(PROCESSED_DATA_PATH, exist_ok=True)
    
    # Download data if not present
    if not os.path.exists(os.path.join(MIT_BIH_PATH, '100.hea')):
        download_mit_bih()
    
    X = []
    y = []
    features_list = []
    processed_records = 0
    
    # Process each official record
    for record_name in MIT_BIH_RECORDS:
        # Skip if record doesn't exist locally
        hea_file = os.path.join(MIT_BIH_PATH, f'{record_name}.hea')
        dat_file = os.path.join(MIT_BIH_PATH, f'{record_name}.dat')
        atr_file = os.path.join(MIT_BIH_PATH, f'{record_name}.atr')
        
        if not (os.path.exists(hea_file) and os.path.exists(dat_file) and os.path.exists(atr_file)):
            print(f"Skipping record {record_name} (incomplete download)...")
            continue
        
        try:
            print(f"Processing record {record_name}...")
            
            # Load record
            record = wfdb.rdrecord(os.path.join(MIT_BIH_PATH, record_name))
            annotation = wfdb.rdann(os.path.join(MIT_BIH_PATH, record_name), 'atr')
            
            # Get signal (using lead II with fallback protection)
            if 'MLII' in record.sig_name:
                lead_idx = record.sig_name.index('MLII')
            else:
                lead_idx = 0  # Fallback to the primary available lead if MLII is missing
                
            signal = record.p_signal[:, lead_idx]
            fs = record.fs
            
            # Resample to 500 Hz
            if fs != TARGET_SAMPLING_RATE:
                num_samples = int(len(signal) * TARGET_SAMPLING_RATE / fs)
                signal = resample(signal, num_samples)
                fs = TARGET_SAMPLING_RATE
            
            # Apply bandpass filter
            signal = butter_bandpass_filter(signal)
            
            # Normalize signal
            scaler = StandardScaler()
            signal = scaler.fit_transform(signal.reshape(-1, 1)).flatten()
            
            # Get annotations and split into windows
            ann_samples = annotation.sample
            ann_symbols = annotation.symbol
            
            # Convert annotation samples to new sampling rate if needed
            if record.fs != TARGET_SAMPLING_RATE:
                ann_samples = (ann_samples * TARGET_SAMPLING_RATE / record.fs).astype(int)
            
            # Process each beat
            for i in range(len(ann_samples) - 1):
                r_peak = ann_samples[i]
                start = r_peak - WINDOW_SIZE // 2
                end = start + WINDOW_SIZE
                
                if start < 0 or end >= len(signal):
                    continue
                
                window = signal[start:end]
                
                # Get rhythm class
                symbol = ann_symbols[i]
                rhythm_class = RHYTHM_CLASSES.get(symbol, 'NORMAL')
                
                X.append(window)
                y.append(rhythm_class)
                
                # Extract features for CVD risk
                features = extract_ecg_features(window, fs)
                features_list.append(features)
            
            processed_records += 1
            
        except Exception as e:
            print(f"Warning: Failed to process record {record_name}: {e}")
            continue
    
    # If we don't have enough real data, use synthetic data
    if len(X) < 1000:
        print(f"Warning: Only {len(X)} samples from real data. Generating synthetic data...")
        X_synth, y_synth, features_synth = generate_synthetic_data()
        
        if len(X) > 0:
            X = np.concatenate([np.array(X), X_synth])
            y = np.concatenate([np.array(y), y_synth])
            features_list = features_list + features_synth.to_dict('records')
        else:
            X, y, features_df = X_synth, y_synth, features_synth
    else:
        X = np.array(X)
        y = np.array(y)
        features_df = pd.DataFrame(features_list)
    
    # Encode labels
    label_map = {'NORMAL': 0, 'TACHYCARDIA': 1, 'BRADYCARDIA': 2, 'AFIB': 3, 'PVC': 4}
    y_encoded = np.array([label_map.get(label, 0) for label in y])
    
    # Simulate heart rate to add TACHYCARDIA/BRADYCARDIA samples
    if isinstance(features_df, list):
        features_df = pd.DataFrame(features_df)
    
    for i in range(len(X)):
        hr = features_df.iloc[i]['heart_rate_bpm']
        if hr > 100:
            y_encoded[i] = label_map['TACHYCARDIA']
        elif hr < 60:
            y_encoded[i] = label_map['BRADYCARDIA']
    
    # Save processed data
    np.save(os.path.join(PROCESSED_DATA_PATH, 'X_ecg.npy'), X)
    np.save(os.path.join(PROCESSED_DATA_PATH, 'y_arrhythmia.npy'), y_encoded)
    features_df.to_csv(os.path.join(PROCESSED_DATA_PATH, 'ecg_features.csv'), index=False)
    
    print(f"Preprocessing complete!")
    print(f"Records processed: {processed_records}/{len(MIT_BIH_RECORDS)}")
    print(f"Total samples: {len(X)}")
    print(f"Classes distribution: {np.bincount(y_encoded)}")
    
    return X, y_encoded, features_df

if __name__ == "__main__":
    preprocess_mit_bih()