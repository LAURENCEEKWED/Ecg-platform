
# ECG AI Platform - ML Models

This directory contains the machine learning models for the ECG AI Platform.

## Models

1. **Arrhythmia Classifier** (1D-CNN v2.1)
   - Trained on MIT-BIH Arrhythmia Database
   - Classes: NORMAL, TACHYCARDIA, BRADYCARDIA, AFIB, PVC

2. **CVD Risk Predictor** (XGBoost v1.7)
   - Predicts cardiovascular disease risk (0-100 score)
   - Categories: LOW (0-33), MODERATE (34-66), HIGH (67-100)

## Getting Started

### Prerequisites

- Python 3.8+
- pip

### Installation

```bash
cd ml
pip install -r requirements.txt
```

### Training Models

To train both models and prepare the inference service:

```bash
python train_all.py
```

Or run training steps individually:

```bash
# Step 1: Download and preprocess MIT-BIH data
python data_preprocessing.py

# Step 2: Train 1D-CNN arrhythmia classifier
python train_arrhythmia.py

# Step 3: Train XGBoost CVD risk predictor
python train_cvd_risk.py
```

### Running the Inference Service

Start the FastAPI ML service:

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Or:

```bash
python main.py
```

The service will be available at `http://localhost:8001`

### API Documentation

Once the service is running, visit:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## Directory Structure

```
ml/
├── data/                  # Raw and processed data
│   ├── mit-bih/          # MIT-BIH Arrhythmia Database
│   └── processed/        # Preprocessed training data
├── models/               # Saved trained models
├── data_preprocessing.py # Data downloading and preprocessing
├── train_arrhythmia.py   # Train arrhythmia classifier
├── train_cvd_risk.py     # Train CVD risk predictor
├── train_all.py          # Full training pipeline
├── main.py               # FastAPI inference service
├── requirements.txt      # Python dependencies
└── README.md             # This file
```
