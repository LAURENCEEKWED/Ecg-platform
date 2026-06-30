import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function ECGChart({ data, rhythmClass, rPeaks = [], height = 180 }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data?.length) return;

    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext('2d');
    const labels = Array.from({ length: data.length }, (_, i) => (i / 500).toFixed(3));

    // Create ECG line gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0,255,128,0.3)');
    gradient.addColorStop(1, 'rgba(0,255,128,0)');

    // R-peak annotations
    const rPeakAnnotations = {};
    rPeaks.forEach((peak, idx) => {
      rPeakAnnotations[`rPeak${idx}`] = {
        type: 'point',
        xValue: peak,
        yValue: data[peak],
        radius: 4,
        backgroundColor: '#FF6B6B',
        borderColor: '#FF6B6B'
      };
    });

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Lead II',
          data,
          borderColor: '#00FF80',
          backgroundColor: gradient,
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0,0,0,0.85)',
            titleColor: '#00FF80',
            bodyColor: '#FFFFFF',
            callbacks: {
              label: ctx => `${ctx.parsed.y.toFixed(3)} mV`
            }
          }
        },
        scales: {
          x: {
            display: true,
            ticks: {
              color: 'rgba(255,255,255,0.3)',
              maxTicksLimit: 10,
              font: { size: 10 }
            },
            grid: {
              color: 'rgba(0,255,0,0.05)',
              lineWidth: 1
            },
            title: { display: true, text: 'Time (s)', color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
          },
          y: {
            display: true,
            ticks: {
              color: 'rgba(255,255,255,0.3)',
              font: { size: 10 }
            },
            grid: {
              color: 'rgba(0,255,0,0.05)',
              lineWidth: 1
            },
            title: { display: true, text: 'mV', color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
          }
        },
        interaction: { mode: 'index', intersect: false }
      }
    });

    return () => { chartRef.current?.destroy(); };
  }, [data, rPeaks, height]);

  if (!data?.length) return (
    <div className="ecg-container" style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>No ECG data available</p>
    </div>
  );

  return (
    <div className="ecg-container" style={{ height: height + 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, position: 'relative', zIndex: 1 }}>
        <span style={{ color: '#00FF80', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em' }}>ECG — LEAD II</span>
        {rhythmClass && (
          <span style={{ fontSize: '0.7rem', color: rhythmClass === 'NORMAL' ? '#00FF80' : '#FF6B6B', fontWeight: 700, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4 }}>
            {rhythmClass}
          </span>
        )}
      </div>
      <div style={{ height, position: 'relative', zIndex: 1 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
