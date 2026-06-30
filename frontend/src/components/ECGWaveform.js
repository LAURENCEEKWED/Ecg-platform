import React, { useState, useEffect, useRef, useCallback } from 'react';

// Realistic ECG waveform generators
const ECGWaveforms = {
  NORMAL: (t) => {
    // Normal sinus rhythm: PQRST complex
    const cycle = t % 1;
    if (cycle < 0.1) return 0.05 * Math.sin(cycle * 20 * Math.PI); // P wave
    if (cycle < 0.15) return -0.1 * (cycle - 0.1) * 20; // Q wave
    if (cycle < 0.2) return 1 - 0.5 * (cycle - 0.15) * 20; // R wave
    if (cycle < 0.25) return -0.3 * (cycle - 0.2) * 20; // S wave
    if (cycle < 0.4) return 0.05 * Math.sin((cycle - 0.25) * 10 * Math.PI); // ST segment
    if (cycle < 0.6) return 0.08 * Math.sin((cycle - 0.4) * 5 * Math.PI); // T wave
    return 0; // U wave and rest
  },
  TACHYCARDIA: (t) => {
    // Fast rhythm (150 BPM)
    const cycle = t % 0.4;
    if (cycle < 0.04) return 0.05 * Math.sin(cycle * 50 * Math.PI);
    if (cycle < 0.06) return -0.1 * (cycle - 0.04) * 50;
    if (cycle < 0.08) return 1 - 0.5 * (cycle - 0.06) * 50;
    if (cycle < 0.1) return -0.3 * (cycle - 0.08) * 50;
    if (cycle < 0.16) return 0.05 * Math.sin((cycle - 0.1) * 25 * Math.PI);
    if (cycle < 0.24) return 0.08 * Math.sin((cycle - 0.16) * 12.5 * Math.PI);
    return 0;
  },
  BRADYCARDIA: (t) => {
    // Slow rhythm (45 BPM)
    const cycle = t % 1.33;
    if (cycle < 0.12) return 0.05 * Math.sin(cycle * 16.67 * Math.PI);
    if (cycle < 0.18) return -0.1 * (cycle - 0.12) * 16.67;
    if (cycle < 0.24) return 1 - 0.5 * (cycle - 0.18) * 16.67;
    if (cycle < 0.3) return -0.3 * (cycle - 0.24) * 16.67;
    if (cycle < 0.48) return 0.05 * Math.sin((cycle - 0.3) * 8.33 * Math.PI);
    if (cycle < 0.72) return 0.08 * Math.sin((cycle - 0.48) * 4.17 * Math.PI);
    return 0;
  },
  AFIB: (t) => {
    // Atrial fibrillation: irregular rhythm
    const cycle = t % 0.5;
    const noise = Math.sin(t * 50) * 0.05;
    if (cycle < 0.04 + Math.random() * 0.02) return 0.03 * Math.sin(cycle * 50 * Math.PI) + noise;
    if (cycle < 0.06 + Math.random() * 0.02) return -0.08 * (cycle - 0.04) * 50 + noise;
    if (cycle < 0.08 + Math.random() * 0.02) return 0.8 - 0.4 * (cycle - 0.06) * 50 + noise;
    if (cycle < 0.1 + Math.random() * 0.02) return -0.25 * (cycle - 0.08) * 50 + noise;
    if (cycle < 0.16) return 0.04 * Math.sin((cycle - 0.1) * 25 * Math.PI) + noise;
    return noise;
  },
  PVC: (t) => {
    // Premature ventricular contraction
    const cycle = t % 1.2;
    if (cycle < 0.1) return 0.05 * Math.sin(cycle * 20 * Math.PI);
    if (cycle < 0.15) return -0.1 * (cycle - 0.1) * 20;
    if (cycle < 0.2) return 1 - 0.5 * (cycle - 0.15) * 20;
    if (cycle < 0.25) return -0.3 * (cycle - 0.2) * 20;
    if (cycle < 0.4) return 0.05 * Math.sin((cycle - 0.25) * 10 * Math.PI);
    if (cycle < 0.6) return 0.08 * Math.sin((cycle - 0.4) * 5 * Math.PI);
    // PVC beat
    if (cycle < 0.75) return -0.2 * Math.sin((cycle - 0.6) * 10 * Math.PI);
    if (cycle < 0.8) return -1 + 0.2 * (cycle - 0.75) * 20;
    if (cycle < 0.85) return -0.8 + 0.6 * (cycle - 0.8) * 20;
    if (cycle < 0.9) return 0.2 * (cycle - 0.85) * 20;
    return 0;
  }
};

const ECGWaveform = ({
  rhythmType = 'NORMAL',
  width = 800,
  height = 200,
  speed = 2,
  grid = true,
  animate = true,
  color = '#dc2626',
  strokeWidth = 2
}) => {
  const canvasRef = useRef(null);
  const timeRef = useRef(0);
  const animationRef = useRef(null);

  const getWaveformValue = useCallback((t) => {
    const generator = ECGWaveforms[rhythmType] || ECGWaveforms.NORMAL;
    return generator(t);
  }, [rhythmType]);

  const drawGrid = useCallback((ctx, w, h) => {
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.1)';
    ctx.lineWidth = 0.5;

    // Minor grid (1mm)
    const minorGridSize = w / 100;
    for (let x = 0; x <= w; x += minorGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += minorGridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Major grid (5mm)
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.2)';
    ctx.lineWidth = 1;
    const majorGridSize = minorGridSize * 5;
    for (let x = 0; x <= w; x += majorGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += majorGridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }, []);

  const drawWaveform = useCallback((ctx, w, h, currentTime) => {
    ctx.clearRect(0, 0, w, h);

    if (grid) {
      drawGrid(ctx, w, h);
    }

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const centerY = h / 2;
    const amplitude = h * 0.4;
    const duration = 4; // Show 4 seconds of data

    for (let x = 0; x < w; x++) {
      const t = currentTime + (x / w) * duration;
      const value = getWaveformValue(t);
      const y = centerY - value * amplitude;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }, [grid, color, strokeWidth, getWaveformValue, drawGrid]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (!animate) {
      drawWaveform(ctx, width, height, 0);
      return;
    }

    const animateLoop = () => {
      timeRef.current += 0.01 * speed;
      drawWaveform(ctx, width, height, timeRef.current);
      animationRef.current = requestAnimationFrame(animateLoop);
    };

    animationRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, animate, speed, drawWaveform]);

  return (
    <div style={{
      width: '100%',
      background: '#fff5f5',
      borderRadius: 16,
      padding: 16,
      border: '1px solid rgba(220,38,38,0.1)'
    }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
};

export default ECGWaveform;
