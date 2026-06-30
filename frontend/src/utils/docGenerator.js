
export async function generateECGReportDoc(patient, analysis, ecgRecord) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ECG Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #1f4e79; border-bottom: 2px solid #1f4e79; padding-bottom: 10px; }
    h2 { color: #1f4e79; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #f5f7fa; }
    .risk-high { color: #c00000; font-weight: bold; }
    .risk-moderate { color: #ff8c00; font-weight: bold; }
    .risk-low { color: #00875a; font-weight: bold; }
    .recommendation { margin: 8px 0; padding: 10px; background: #f5f7fa; border-left: 4px solid #1f4e79; }
    .disclaimer { margin-top: 40px; padding: 15px; background: #fff3cd; border: 1px solid #ffc107; color: #856404; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>ECG AI Platform - Analysis Report</h1>
  
  <h2>Patient Information</h2>
  <table>
    <tr><th>Name</th><td>${patient.first_name} ${patient.last_name}</td></tr>
    <tr><th>Email</th><td>${patient.email}</td></tr>
    ${patient.phone ? `<tr><th>Phone</th><td>${patient.phone}</td></tr>` : ''}
    ${patient.dob ? `<tr><th>Date of Birth</th><td>${patient.dob}</td></tr>` : ''}
    ${patient.gender ? `<tr><th>Gender</th><td>${patient.gender === 'M' ? 'Male' : 'Female'}</td></tr>` : ''}
  </table>

  <h2>ECG Analysis Results</h2>
  <table>
    <tr><th>Analyzed At</th><td>${new Date(analysis.analyzed_at).toLocaleString()}</td></tr>
    <tr><th>Rhythm Class</th><td>${analysis.rhythm_class}</td></tr>
    <tr><th>Risk Category</th><td class="risk-${analysis.risk_category.toLowerCase()}">${analysis.risk_category}</td></tr>
    <tr><th>CVD Risk Score</th><td>${analysis.cvd_risk_score}/100</td></tr>
    <tr><th>AI Confidence</th><td>${analysis.rhythm_confidence}%</td></tr>
    <tr><th>Heart Rate</th><td>${analysis.heart_rate_bpm} BPM</td></tr>
    <tr><th>QT Interval</th><td>${analysis.qt_interval_ms} ms</td></tr>
    <tr><th>QRS Duration</th><td>${analysis.qrs_duration_ms} ms</td></tr>
    <tr><th>HRV (RMSSD)</th><td>${analysis.hrv_rmssd_ms} ms</td></tr>
  </table>

  <h2>Recommendations</h2>
  ${(analysis.recommendations || []).map((rec, i) => `
    <div class="recommendation">
      <strong>${i + 1}.</strong> ${rec}
    </div>
  `).join('')}

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This AI-generated analysis is a decision-support tool and does not replace the opinion of a qualified physician. Always consult your doctor before making any health decisions based on this report.
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  return blob;
}

export async function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareReport(blob, filename, title, text) {
  try {
    const file = new File([blob], filename, { type: 'text/html' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return { success: true };
    } else {
      throw new Error("Share not supported");
    }
  } catch (err) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: false, fallback: "clipboard" };
    } catch (e) {
      return { success: false, fallback: null };
    }
  }
}
