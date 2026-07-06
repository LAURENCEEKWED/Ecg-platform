
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export async function generateECGReportPDF(patient, analysis, ecgRecord) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(31, 78, 121);
  doc.text('ECG AI Platform - Analysis Report', 14, 22);
  
  // Patient Information
  doc.setFontSize(14);
  doc.setTextColor(31, 78, 121);
  doc.text('Patient Information', 14, 38);
  
  const patientData = [
    ['Name', `${patient.first_name} ${patient.last_name}`],
    ['Email', patient.email],
  ];
  
  if (patient.phone) patientData.push(['Phone', patient.phone]);
  if (patient.dob) patientData.push(['Date of Birth', patient.dob]);
  if (patient.gender) patientData.push(['Gender', patient.gender === 'M' ? 'Male' : 'Female']);
  
  autoTable(doc, {
    startY: 44,
    head: [],
    body: patientData,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [245, 247, 250], textColor: 0, fontStyle: 'bold' },
  });
  
  // ECG Analysis Results
  const lastTable = doc.lastAutoTable;
  let yPosition = lastTable.finalY + 10;
  doc.setFontSize(14);
  doc.setTextColor(31, 78, 121);
  doc.text('ECG Analysis Results', 14, yPosition);
  
  const analysisData = [
    ['Analyzed At', new Date(analysis.analyzed_at).toLocaleString()],
    ['Rhythm Class', analysis.rhythm_class],
    ['Risk Category', analysis.risk_category],
    ['CVD Risk Score', `${analysis.cvd_risk_score}/100`],
    ['AI Confidence', `${analysis.rhythm_confidence}%`],
    ['Heart Rate', `${analysis.heart_rate_bpm} BPM`],
    ['QT Interval', `${analysis.qt_interval_ms} ms`],
    ['QRS Duration', `${analysis.qrs_duration_ms} ms`],
    ['HRV (RMSSD)', `${analysis.hrv_rmssd_ms} ms`],
  ];
  
  autoTable(doc, {
    startY: yPosition + 6,
    head: [],
    body: analysisData,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [245, 247, 250], textColor: 0, fontStyle: 'bold' },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.row.index === 2 && data.column.index === 1) {
        if (analysis.risk_category === 'HIGH') {
          doc.setTextColor(192, 0, 0);
        } else if (analysis.risk_category === 'MODERATE') {
          doc.setTextColor(255, 140, 0);
        } else {
          doc.setTextColor(0, 135, 90);
        }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(analysis.risk_category, data.cell.x + 2, data.cell.y + 6);
      }
    },
  });
  
  // Recommendations
  const lastAnalysisTable = doc.lastAutoTable;
  yPosition = lastAnalysisTable.finalY + 10;
  doc.setFontSize(14);
  doc.setTextColor(31, 78, 121);
  doc.text('Recommendations', 14, yPosition);
  
  yPosition += 6;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  (analysis.recommendations || []).forEach((rec, i) => {
    const x = 18;
    const text = `${i + 1}. ${rec}`;
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, x, yPosition);
    yPosition += splitText.length * 6 + 2;
  });
  
  // Disclaimer
  yPosition += 4;
  doc.setFillColor(255, 243, 205);
  doc.rect(14, yPosition, 182, 25, 'F');
  doc.setDrawColor(255, 193, 7);
  doc.rect(14, yPosition, 182, 25, 'S');
  
  doc.setFontSize(9);
  doc.setTextColor(133, 100, 4);
  const disclaimerText = 'Disclaimer: This AI-generated analysis is a decision-support tool and does not replace the opinion of a qualified physician. Always consult your doctor before making any health decisions based on this report.';
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, 178);
  doc.text(splitDisclaimer, 16, yPosition + 7);
  
  return doc;
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
