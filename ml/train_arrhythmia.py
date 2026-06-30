
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, f1_score
import matplotlib.pyplot as plt
from data_preprocessing import preprocess_mit_bih

# Configuration
MODEL_PATH = "models"
RHYTHM_CLASSES = ['NORMAL', 'TACHYCARDIA', 'BRADYCARDIA', 'AFIB', 'PVC']
WINDOW_SIZE = 500

def create_1d_cnn_model(input_shape, num_classes):
    """Create a 1D CNN model for arrhythmia classification"""
    model = models.Sequential([
        # Input layer
        layers.Input(shape=input_shape),
        
        # Reshape for 1D conv
        layers.Reshape((input_shape[0], 1)),
        
        # Conv Block 1
        layers.Conv1D(64, 7, activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling1D(2),
        layers.Dropout(0.2),
        
        # Conv Block 2
        layers.Conv1D(128, 5, activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling1D(2),
        layers.Dropout(0.2),
        
        # Conv Block 3
        layers.Conv1D(256, 3, activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling1D(2),
        layers.Dropout(0.3),
        
        # Conv Block 4
        layers.Conv1D(256, 3, activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling1D(2),
        layers.Dropout(0.3),
        
        # Global pooling
        layers.GlobalAveragePooling1D(),
        
        # Dense layers
        layers.Dense(128, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.4),
        
        layers.Dense(64, activation='relu'),
        layers.BatchNormalization(),
        
        # Output layer
        layers.Dense(num_classes, activation='softmax')
    ])
    
    # Compile model
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def train_arrhythmia_model():
    """Train the arrhythmia classification model"""
    print("Training 1D-CNN Arrhythmia Classifier...")
    os.makedirs(MODEL_PATH, exist_ok=True)
    
    # Load or preprocess data
    if os.path.exists("data/processed/X_ecg.npy"):
        X = np.load("data/processed/X_ecg.npy")
        y = np.load("data/processed/y_arrhythmia.npy")
    else:
        X, y, _ = preprocess_mit_bih()
    
    # Split data
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Create model
    model = create_1d_cnn_model((WINDOW_SIZE,), len(RHYTHM_CLASSES))
    model.summary()
    
    # Callbacks
    early_stopping = callbacks.EarlyStopping(
        monitor='val_loss',
        patience=10,
        restore_best_weights=True,
        verbose=1
    )
    
    reduce_lr = callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=5,
        min_lr=1e-6,
        verbose=1
    )
    
    model_checkpoint = callbacks.ModelCheckpoint(
        os.path.join(MODEL_PATH, 'arrhythmia_cnn_best.keras'),
        monitor='val_accuracy',
        save_best_only=True,
        verbose=1
    )
    
    # Train
    history = model.fit(
        X_train, y_train,
        epochs=50,
        batch_size=64,
        validation_data=(X_val, y_val),
        callbacks=[early_stopping, reduce_lr, model_checkpoint]
    )
    
    # Plot training history
    plt.figure(figsize=(12, 4))
    plt.subplot(1, 2, 1)
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.title('Training and Validation Loss')
    
    plt.subplot(1, 2, 2)
    plt.plot(history.history['accuracy'], label='Training Accuracy')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.title('Training and Validation Accuracy')
    plt.savefig(os.path.join(MODEL_PATH, 'arrhythmia_training_history.png'))
    
    # Evaluate
    y_pred = model.predict(X_val)
    y_pred_classes = np.argmax(y_pred, axis=1)
    print("\nClassification Report:")
    print(classification_report(y_val, y_pred_classes, target_names=RHYTHM_CLASSES))
    
    # Calculate weighted F1-score
    weighted_f1 = f1_score(y_val, y_pred_classes, average='weighted')
    print(f"\nWeighted F1-score: {weighted_f1:.3f}")
    
    # Save final model
    model.save(os.path.join(MODEL_PATH, 'arrhythmia_cnn_v2.1.keras'))
    print("\nModel training complete!")
    print(f"Model saved to {MODEL_PATH}")
    
    return model

if __name__ == "__main__":
    train_arrhythmia_model()
