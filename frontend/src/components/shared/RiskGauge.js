import React from 'react';

export default function RiskGauge({ score = 0, category = 'LOW', size = 160 }) {
  const radius = size / 2 - 16;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference - (score / 100) * circumference;

  const colors = { LOW: '#00875A', MODERATE: '#FF8C00', HIGH: '#C00000' };
  const color = colors[category] || '#94A3B8';

  const cx = size / 2;
  const cy = size / 2 + 10;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        {/* Background arc */}
        <path
          d={`M ${16} ${cy} A ${radius} ${radius} 0 0 1 ${size - 16} ${cy}`}
          fill="none" stroke="#E2E8F0" strokeWidth={12} strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M ${16} ${cy} A ${radius} ${radius} 0 0 1 ${size - 16} ${cy}`}
          fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
        />
        {/* Center score */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={size * 0.22} fontWeight={800} fill={color} fontFamily="Inter, sans-serif">
          {score}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill="#94A3B8" fontFamily="Inter, sans-serif">
          / 100
        </text>
        {/* Labels */}
        <text x={16} y={cy + 22} textAnchor="middle" fontSize={9} fill="#94A3B8" fontFamily="Inter, sans-serif">Low</text>
        <text x={size - 16} y={cy + 22} textAnchor="middle" fontSize={9} fill="#94A3B8" fontFamily="Inter, sans-serif">High</text>
      </svg>
      <div style={{ marginTop: -8 }}>
        <span className={`risk-badge ${category}`} style={{ fontSize: '0.8rem', padding: '4px 14px' }}>
          {category} RISK
        </span>
      </div>
    </div>
  );
}
