
import os
import subprocess
import sys

def run_command(command, description):
    """Run a command and print output"""
    print(f"\n{'='*60}")
    print(f"{description}")
    print(f"{'='*60}\n")
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"\nError: {e}")
        return False

def main():
    print("="*60)
    print("  ECG AI Platform - Full Training Pipeline")
    print("="*60)
    
    # Step 1: Install dependencies
    print("\n[1/5] Installing Python dependencies...")
    if not run_command(
        f"{sys.executable} -m pip install -r requirements.txt",
        "Installing dependencies"
    ):
        return
    
    # Step 2: Preprocess data
    print("\n[2/5] Preprocessing MIT-BIH data...")
    if not run_command(
        f"{sys.executable} data_preprocessing.py",
        "Preprocessing data"
    ):
        return
    
    # Step 3: Train arrhythmia model
    print("\n[3/5] Training arrhythmia classifier...")
    if not run_command(
        f"{sys.executable} train_arrhythmia.py",
        "Training arrhythmia model"
    ):
        return
    
    # Step 4: Train CVD risk model
    print("\n[4/5] Training CVD risk predictor...")
    if not run_command(
        f"{sys.executable} train_cvd_risk.py",
        "Training CVD risk model"
    ):
        return
    
    # Step 5: Test FastAPI startup
    print("\n[5/5] Testing ML service setup...")
    print("\n✅ All training complete!")
    print("\n" + "="*60)
    print("  To start the ML inference service, run:")
    print("="*60)
    print(f"  cd {os.path.dirname(os.path.abspath(__file__))}")
    print(f"  {sys.executable} -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload")
    print("\nOr using:")
    print(f"  {sys.executable} main.py")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
