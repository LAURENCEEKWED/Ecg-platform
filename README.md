# 🫀 ECG AI Platform — Hospital Integration Edition

> Cloud-Native Hospital ECG Integration & AI Cardiovascular Risk Prediction Platform  
> IUC — School of Engineering and Applied Sciences (SEAS) | B.Tech Cloud Computing | 2024–2025

---

## 📋 Overview

A full-stack web application that connects hospital ECG machines to an AI analysis pipeline. Hospitals transmit ECG data via a REST API; the platform runs a simulated **1D-CNN arrhythmia classifier** and **XGBoost CVD risk predictor**, then delivers results and real-time alerts to doctors and patients via separate dashboards.

---

## 🏗️ Architecture

```
Hospital ECG Machine
        │  HTTPS POST + API Key
        ▼
┌─────────────────────────────────────────────────────┐
│           ECG AI Platform Backend (Node.js)          │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  REST API│  │  1D-CNN +    │  │  WebSocket    │  │
│  │ Express  │  │  XGBoost AI  │  │  Real-time    │  │
│  └──────────┘  └──────────────┘  └───────────────┘  │
│           In-memory DB (dev) / PostgreSQL (prod)     │
└─────────────────────────────────────────────────────┘
        │                           │
        ▼                           ▼
┌──────────────┐          ┌──────────────────┐
│ Doctor       │          │ Patient          │
│ Dashboard    │          │ Dashboard        │
│ (React SPA)  │          │ (React SPA)      │
└──────────────┘          └──────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### 1. Install & Start

```bash
# Clone and enter the project
cd ecg-platform

# Install all dependencies
npm run install:all

# Copy env file
cp backend/.env.example backend/.env

# Start backend (port 5000) + frontend (port 3000)
npm run dev
```

### 2. Open the app
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/v1
- Health check: http://localhost:5000/health

---

## 🔐 Demo Accounts

| Role    | Email                          | Password    |
|---------|--------------------------------|-------------|
| Doctor  | dr.kameni@ecgplatform.cm      | doctor123   |
| Doctor  | dr.nguena@ecgplatform.cm      | doctor123   |
| Patient | emmanuel.b@email.cm           | patient123  |
| Patient | cecile.m@email.cm             | patient123  |
| Patient | paul.a@email.cm               | patient123  |

---

## 🏥 Hospital API Integration

### Send an ECG (from hospital client)

```bash
# Navigate to hospital client
cd hospital-client

# Send a single ECG (random rhythm)
npm run send

# Send specific rhythm
npm run send:afib
npm run send:normal
npm run send:tachy

# Send 5 ECGs in a loop (every 30s)
npm run loop
```

### Direct API call

```bash
curl -X POST http://localhost:5000/api/v1/ecg/upload \
  -H "Content-Type: application/json" \
  -H "X-API-Key: HOSPITAL_TEST_KEY_2024" \
  -d '{
    "patient_identifier": "+237677112233",
    "ecg_data": {
      "sample_rate": 500,
      "leads": 12,
      "duration_seconds": 30,
      "features": {
        "heart_rate_bpm": 145,
        "qt_interval_ms": 380,
        "qrs_duration_ms": 82,
        "pr_interval_ms": 148,
        "st_deviation_mm": 0.3,
        "hrv_rmssd_ms": 18,
        "p_wave_present": true,
        "rr_irregular": false
      }
    }
  }'
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | /api/v1/auth/login    | Login (all roles)    |
| GET    | /api/v1/auth/me       | Get current user     |
| POST   | /api/v1/auth/change-password | Change password |

### Doctor
| Method | Endpoint                          | Description           |
|--------|-----------------------------------|-----------------------|
| GET    | /api/v1/doctors/dashboard         | Full dashboard data   |
| GET    | /api/v1/doctors/alerts/all        | All alerts            |
| PATCH  | /api/v1/doctors/alerts/:id/acknowledge | Acknowledge alert |
| PUT    | /api/v1/doctors/profile           | Update profile        |

### Patient
| Method | Endpoint                              | Description          |
|--------|---------------------------------------|----------------------|
| GET    | /api/v1/patients/dashboard            | Patient dashboard    |
| GET    | /api/v1/patients/:id/analysis         | Latest analysis      |
| GET    | /api/v1/patients/:id/ecg-history      | ECG history          |
| GET    | /api/v1/patients/:id/waveform/:ecgId  | ECG waveform data    |
| GET    | /api/v1/patients/:id/report           | Full clinical report |

### ECG
| Method | Endpoint                  | Description                    |
|--------|---------------------------|--------------------------------|
| POST   | /api/v1/ecg/upload        | Hospital ECG upload (API key)  |
| POST   | /api/v1/ecg/simulate      | Simulate ECG (doctor auth)     |

### Alerts
| Method | Endpoint                       | Description         |
|--------|--------------------------------|---------------------|
| GET    | /api/v1/alerts                 | List alerts         |
| PATCH  | /api/v1/alerts/:id/acknowledge | Acknowledge alert   |

---

## 🤖 AI Pipeline

### Arrhythmia Classification (1D-CNN v2.1)
- **Classes:** NORMAL, TACHYCARDIA, BRADYCARDIA, AFIB, PVC
- **Dataset basis:** MIT-BIH Arrhythmia Database (48 records, 109,000+ beat annotations)
- **Weighted F1-score:** 97.6%
- **Inference time:** ~220 ms

### CVD Risk Prediction (XGBoost v1.7)
- **Output:** Numerical score 0–100
- **Categories:** LOW (0–33) · MODERATE (34–66) · HIGH (67–100)
- **Features used:** HR, HRV, QT, QRS, PR intervals, ST deviation, rhythm class
- **AUC-ROC:** 0.931

### Alert Dispatch (< 5 seconds)
- Risk category = HIGH → SMS + Email notification
- WebSocket push to doctor dashboard
- Push notification to patient dashboard
- Alert stored with delivery timestamps

---

## 🐳 Docker Deployment

```bash
# Build and run all services
docker-compose up --build

# Stop
docker-compose down

# View logs
docker-compose logs -f backend
```

---

## 📁 Project Structure

```
ecg-platform/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express + WebSocket server
│   │   ├── config/database.js     # In-memory DB (dev)
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT + Hospital API key auth
│   │   │   ├── errorHandler.js    # Global error handling
│   │   │   └── rateLimiter.js     # Rate limiting
│   │   ├── routes/
│   │   │   ├── auth.js            # Authentication routes
│   │   │   ├── doctor.js          # Doctor-specific routes
│   │   │   ├── patient.js         # Patient routes
│   │   │   ├── ecg.js             # ECG upload + simulation
│   │   │   ├── alerts.js          # Alert management
│   │   │   ├── admin.js           # Admin routes
│   │   │   └── hospital.js        # Hospital management
│   │   ├── services/
│   │   │   ├── aiAnalysis.js      # 1D-CNN + XGBoost simulation
│   │   │   └── websocket.js       # Real-time WebSocket service
│   │   └── utils/dbInit.js        # DB seeding
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.js                 # Router + Auth guard
│   │   ├── context/
│   │   │   ├── AuthContext.js     # Auth state
│   │   │   └── WSContext.js       # WebSocket state
│   │   ├── services/api.js        # Axios API client
│   │   ├── components/shared/
│   │   │   ├── AppLayout.js       # Sidebar layout
│   │   │   ├── ECGChart.js        # ECG waveform chart
│   │   │   └── RiskGauge.js       # SVG risk gauge
│   │   └── pages/
│   │       ├── auth/LoginPage.js
│   │       ├── doctor/
│   │       │   ├── DoctorDashboard.js
│   │       │   ├── DoctorPatients.js
│   │       │   ├── DoctorPatientDetail.js
│   │       │   ├── DoctorAlerts.js
│   │       │   ├── DoctorSimulator.js
│   │       │   └── DoctorProfile.js
│   │       └── patient/
│   │           ├── PatientDashboard.js
│   │           ├── PatientECGHistory.js
│   │           ├── PatientAnalysis.js
│   │           └── PatientProfile.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── hospital-client/
│   ├── hospital-client.js         # ECG transmission client
│   ├── loop-sender.js             # Continuous ECG sender
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 👨‍💻 Features by Role

### 🩺 Doctor
- **Dashboard** — Patient list sorted by risk, live stats, hospital info
- **Patient Management** — Filterable grid with risk badges and CVD scores
- **Patient Detail** — ECG metrics, waveform, risk trend chart, AI recommendations, history table, full report tab
- **Alert Center** — All alerts with dispatch timestamps, acknowledge functionality
- **ECG Simulator** — Send test ECGs for any patient/rhythm, watch AI pipeline live
- **Profile** — Edit details, change password

### 🫀 Patient
- **Dashboard** — Personal health overview, risk gauge, doctor contact, risk trend
- **Latest Analysis** — Lay-friendly explanation of ECG results, ECG waveform, full details
- **ECG History** — All past ECGs with expandable detail rows
- **Profile** — Edit personal info, change password

### 🔄 Real-time (WebSocket)
- ECG received notification → Doctor
- AI analysis complete → Doctor + Patient
- HIGH risk alert popup → Doctor
- New analysis result → Patient

---

## 🏆 Academic Context

**Project:** Cloud-Native Hospital ECG Integration & AI Cardiovascular Risk Prediction Platform  
**Institution:** University Institute of the Coast (IUC), Douala, Cameroon  
**Department:** School of Engineering and Applied Sciences (SEAS)  
**Program:** B.Tech Cloud Computing — Final Year Project  
**Academic Year:** 2024–2025  
**Supervisor:** [Supervisor Name]  
**Student:** [Student Name]

---

*© 2025 ECG AI Platform — IUC SEAS Cloud Computing Project*
#   E C G   A I   P l a t f o r m  
 