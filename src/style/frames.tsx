/**
 * Diegetic UI frames — ported from Claude Design's `frames.jsx`
 * (Visual Style Guide Phase 1).
 *
 * Five in-world surfaces the encounter UI lives inside:
 *   - Clipboard     · history / observation notes
 *   - Monitor       · cardiac monitor (frames the patient portrait)
 *   - VitalsStrip   · rolling thermal-paper vitals readout
 *   - DrugChart     · NHS-yellow drug chart for management entries
 *   - ResultsEnvelope · internal mail envelope for pathology/imaging results
 *
 * Each component renders the frame as SVG (so it scales / stays crisp)
 * plus a positioned slot for content. Callers pass children for the slot.
 */

import { useId } from 'react';
import type { CSSProperties, ReactNode } from 'react';

// ─── Clipboard ──────────────────────────────────────────────────────────────

export function Clipboard({
  children,
  width = 320,
  height = 460,
  label = 'PATIENT NOTES',
  style,
}: {
  children?: ReactNode;
  width?: number;
  height?: number;
  label?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        fontFamily: 'JetBrains Mono, monospace',
        ...style,
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden
      >
        <defs>
          <pattern id="paperGrain" width="3" height="3" patternUnits="userSpaceOnUse">
            <rect width="3" height="3" fill="#FBF7E8" />
            <rect width="1" height="1" fill="#F0EBD8" opacity="0.6" />
            <rect x="2" y="1" width="1" height="1" fill="#F0EBD8" opacity="0.4" />
          </pattern>
          <linearGradient id="clipMetal" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#d6d4cd" />
            <stop offset="0.5" stopColor="#9c9a93" />
            <stop offset="1" stopColor="#6b6862" />
          </linearGradient>
        </defs>
        <path
          d={`M0 16 L${width - 18} 16 L${width} 34 L${width} ${height} L0 ${height} Z`}
          fill="#b39963"
        />
        <path d={`M${width - 18} 16 L${width} 34 L${width - 18} 34 Z`} fill="#8c7547" />
        <path
          d={`M8 28 L${width - 30} 28 L${width - 8} 50 L${width - 8} ${height - 12} L8 ${height - 12} Z`}
          fill="url(#paperGrain)"
          stroke="#d4cdaa"
          strokeWidth="1"
        />
        <path
          d={`M${width - 30} 28 L${width - 8} 50 L${width - 30} 50 Z`}
          fill="#e0d7b8"
          stroke="#c4ba99"
          strokeWidth="0.5"
        />
        {Array.from({ length: 14 }).map((_, i) => (
          <line
            key={i}
            x1="16"
            x2={width - 16}
            y1={70 + i * 22}
            y2={70 + i * 22}
            stroke="#d8cfa6"
            strokeWidth="0.5"
          />
        ))}
        <line
          x1="40"
          x2="40"
          y1="54"
          y2={height - 16}
          stroke="#c8362a"
          strokeWidth="0.5"
          opacity="0.5"
        />
        <rect x={width / 2 - 36} y="4" width="72" height="20" rx="3" fill="url(#clipMetal)" />
        <rect x={width / 2 - 34} y="6" width="68" height="2" fill="#f0eee5" opacity="0.6" />
        <rect x={width / 2 - 8} y="20" width="16" height="14" rx="2" fill="#4a4842" />
        <g stroke="#2c4a78" strokeWidth="0.6" fill="none" opacity="0.7">
          <path d="M22 78 q-4 6 0 12" />
          <path d="M24 96 q-4 4 -2 10" />
          <path d="M22 116 l4 8" />
        </g>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 50,
          right: 18,
          top: 50,
          bottom: 22,
          overflow: 'auto',
          fontSize: 12,
          lineHeight: '22px',
          color: '#2B2A25',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: 1.5,
            color: '#7a1e16',
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Monitor ───────────────────────────────────────────────────────────────

export function Monitor({
  children,
  width = 360,
  height = 240,
  sticker = 'CardioVis · v3.2',
  cornerLabel,
  style,
}: {
  children?: ReactNode;
  width?: number;
  height?: number;
  sticker?: string;
  /**
   * Top-left chip text, e.g. "BAY MONITOR · RESUS · 18m". Renders over
   * the scanline overlay so it reads as an OSD on the patient feed.
   * Omit to suppress the chip entirely.
   */
  cornerLabel?: string;
  style?: CSSProperties;
}) {
  const bezel = 14;
  const screenX = bezel;
  const screenY = bezel;
  const screenW = width - bezel * 2;
  const screenH = height - bezel * 2 - 10;
  // Stable instance id so SVG <defs> ids don't collide when more than
  // one Monitor renders on the same page (e.g. asset library preview).
  const idSuffix = useId().replace(/:/g, '_');
  const scanId = `mScan_${idSuffix}`;
  const vignetteId = `mVignette_${idSuffix}`;
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        fontFamily: 'JetBrains Mono, monospace',
        ...style,
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient id={`bezelGrad_${idSuffix}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#3a3a3a" />
            <stop offset="0.5" stopColor="#1a1a1a" />
            <stop offset="1" stopColor="#0a0a0a" />
          </linearGradient>
          <linearGradient id={`glassRefl_${idSuffix}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          {/* M93: subtle horizontal scanlines (3% opacity) and a corner
              vignette darkening the four corners to simulate CRT
              curvature. Both reduce to a single render pass and respect
              prefers-reduced-motion (no animation; static effect). */}
          <pattern
            id={scanId}
            patternUnits="userSpaceOnUse"
            width="100"
            height="3"
          >
            <rect x="0" y="0" width="100" height="1" fill="#000" opacity="0.03" />
          </pattern>
          <radialGradient id={vignetteId} cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.35" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width={width} height={height} rx="6" fill={`url(#bezelGrad_${idSuffix})`} />
        <rect
          x="2"
          y="2"
          width={width - 4}
          height={height - 4}
          rx="4"
          fill="none"
          stroke="#000"
          strokeWidth="1"
        />
        <rect
          x="3"
          y="3"
          width={width - 6}
          height={height - 6}
          rx="3"
          fill="none"
          stroke="#3a3a3a"
          strokeWidth="0.5"
          opacity="0.7"
        />
        <rect
          x={screenX}
          y={screenY}
          width={screenW}
          height={screenH}
          fill="#1A2A28"
        />
        <rect
          x={screenX}
          y={screenY}
          width={screenW}
          height={screenH / 2}
          fill={`url(#glassRefl_${idSuffix})`}
          pointerEvents="none"
        />
        {/* Scanline + vignette overlays sit above the screen fill but
            below the bottom-bezel sticker. They are aria-hidden as
            part of the outer <svg aria-hidden>. */}
        <rect
          x={screenX}
          y={screenY}
          width={screenW}
          height={screenH}
          fill={`url(#${scanId})`}
          pointerEvents="none"
        />
        <rect
          x={screenX}
          y={screenY}
          width={screenW}
          height={screenH}
          fill={`url(#${vignetteId})`}
          pointerEvents="none"
        />
        <rect
          x={width - 110}
          y={height - 12}
          width="100"
          height="8"
          rx="1"
          fill="#1a1a1a"
          stroke="#2a2a2a"
          strokeWidth="0.5"
        />
        <text
          x={width - 60}
          y={height - 6}
          fill="#5a5a5a"
          fontSize="6"
          fontFamily="JetBrains Mono"
          textAnchor="middle"
          letterSpacing="1"
        >
          {sticker}
        </text>
        <circle cx={bezel + 6} cy={height - 8} r="2" fill="#5BBF8F" />
        <circle cx={bezel + 6} cy={height - 8} r="3.5" fill="#5BBF8F" opacity="0.3" />
      </svg>
      {cornerLabel && (
        // BT 17 round 1 — three findings on one block all solve with
        // the same move: render the OSD chip as an HTML overlay
        // outside the SVG. That fixes (1) top-left occluding the
        // patient face by repositioning to bottom-left above the
        // sticker, (2) the brittle SVG-width magic number by letting
        // CSS padding flow naturally with text, and (3) the WCAG
        // contrast regression by using a solid 85%-opacity dark
        // backdrop. pointerEvents: none keeps the chip from catching
        // clicks meant for content underneath.
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: bezel + 6,
            bottom: bezel + 12,
            padding: '2px 6px',
            background: 'rgba(0, 0, 0, 0.85)',
            color: '#86E0B5',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            letterSpacing: 0.5,
            borderRadius: 2,
            pointerEvents: 'none',
            maxWidth: `calc(100% - ${bezel * 2 + 12}px)`,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {cornerLabel}
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          left: bezel + 1,
          top: bezel + 1,
          width: width - bezel * 2 - 2,
          height: height - bezel * 2 - 12,
          overflow: 'hidden',
          color: '#86E0B5',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── VitalsStrip ───────────────────────────────────────────────────────────

export interface VitalReading {
  label: string;
  value: string;
  unit: string;
  tone: string;
}

export function VitalsStripFrame({
  vitals,
  width = 540,
  height = 110,
  style,
}: {
  vitals: VitalReading[];
  width?: number;
  height?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        fontFamily: 'JetBrains Mono, monospace',
        ...style,
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient id="thermalPaper" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fef9e7" />
            <stop offset="0.5" stopColor="#fbf3d4" />
            <stop offset="1" stopColor="#f4e9b6" />
          </linearGradient>
        </defs>
        <rect x="0" y="6" width={width} height={height - 12} fill="url(#thermalPaper)" />
        {Array.from({ length: Math.floor(width / 6) }).map((_, i) => (
          <g key={i}>
            <path d={`M${i * 6} 6 L${i * 6 + 3} 0 L${i * 6 + 6} 6 Z`} fill="#fef9e7" />
            <path
              d={`M${i * 6} ${height - 6} L${i * 6 + 3} ${height} L${i * 6 + 6} ${height - 6} Z`}
              fill="#f4e9b6"
            />
          </g>
        ))}
        {Array.from({ length: Math.floor(width / 12) }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={i * 12}
            x2={i * 12}
            y1="6"
            y2={height - 6}
            stroke="#c8b86a"
            strokeWidth="0.3"
            opacity="0.5"
          />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1="0"
            x2={width}
            y1={20 + i * 18}
            y2={20 + i * 18}
            stroke="#c8b86a"
            strokeWidth="0.3"
            opacity="0.5"
          />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 10px',
        }}
      >
        {vitals.map((v) => (
          <div key={v.label} style={{ textAlign: 'center', lineHeight: 1 }}>
            <div style={{ fontSize: 9, color: '#6b5c3a', letterSpacing: 1, marginBottom: 4 }}>
              {v.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 24, color: v.tone, fontWeight: 700, marginBottom: 2 }}>
              {v.value}
            </div>
            <div style={{ fontSize: 8, color: '#9c8d5c' }}>{v.unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DrugChart ─────────────────────────────────────────────────────────────

export function DrugChart({
  children,
  width = 340,
  height = 460,
  title = 'PRESCRIPTION CHART',
  subtitle,
  stat = false,
  style,
}: {
  children?: ReactNode;
  width?: number;
  height?: number;
  title?: string;
  subtitle?: string;
  stat?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        fontFamily: 'JetBrains Mono, monospace',
        ...style,
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden
      >
        <defs>
          <pattern id="yellowGrain" width="2" height="2" patternUnits="userSpaceOnUse">
            <rect width="2" height="2" fill="#F4E9A6" />
            <rect width="1" height="1" fill="#EBDD8C" opacity="0.5" />
          </pattern>
        </defs>
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="url(#yellowGrain)"
          stroke="#c4ba6a"
          strokeWidth="1"
        />
        <rect x="0" y="0" width={width} height="42" fill="#E0D49A" />
        <line x1="0" x2={width} y1="42" y2="42" stroke="#9C8D5C" strokeWidth="1" />
        {stat && (
          <g transform={`translate(${width - 70}, 8) rotate(-6)`}>
            <rect
              x="0"
              y="0"
              width="56"
              height="22"
              rx="2"
              fill="none"
              stroke="#7A1E16"
              strokeWidth="1.5"
              opacity="0.7"
            />
            <text
              x="28"
              y="15"
              fontFamily="JetBrains Mono"
              fontSize="11"
              fontWeight="700"
              fill="#7A1E16"
              textAnchor="middle"
              opacity="0.7"
              letterSpacing="2"
            >
              STAT
            </text>
          </g>
        )}
        <text
          x="14"
          y="20"
          fontFamily="JetBrains Mono"
          fontSize="9"
          fill="#5a4a20"
          letterSpacing="2"
        >
          {title}
        </text>
        {subtitle && (
          <text
            x="14"
            y="34"
            fontFamily="JetBrains Mono"
            fontSize="13"
            fontWeight="700"
            fill="#2B2A25"
          >
            {subtitle}
          </text>
        )}
        {Array.from({ length: 16 }).map((_, i) => (
          <line
            key={i}
            x1="6"
            x2={width - 6}
            y1={66 + i * 22}
            y2={66 + i * 22}
            stroke="#c4ba6a"
            strokeWidth="0.4"
            opacity="0.6"
          />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 10,
          right: 10,
          top: 56,
          bottom: 12,
          overflow: 'auto',
          fontSize: 11,
          color: '#2B2A25',
          lineHeight: '22px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── ResultsEnvelope ───────────────────────────────────────────────────────

export function ResultsEnvelope({
  children,
  width = 380,
  height = 200,
  ward = 'ED · RESUS',
  from = 'LAB · BLOODS BENCH 4',
  re,
  style,
}: {
  children?: ReactNode;
  width?: number;
  height?: number;
  ward?: string;
  from?: string;
  re?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        fontFamily: 'JetBrains Mono, monospace',
        ...style,
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient id="envBody" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#d8c894" />
            <stop offset="1" stopColor="#bca866" />
          </linearGradient>
        </defs>
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="url(#envBody)"
          stroke="#7a6c3a"
          strokeWidth="1"
        />
        <path d={`M0 0 L${width / 2} 26 L${width} 0`} fill="none" stroke="#7a6c3a" strokeWidth="0.6" />
        <g fontFamily="JetBrains Mono" fontSize="7" fill="#3a3220" letterSpacing="1">
          <text x="14" y="48">
            FROM
          </text>
          <text x="14" y="62" fontSize="9" fill="#1a1a1a">
            {from}
          </text>
          <text x="14" y="82">
            TO
          </text>
          <text x="14" y="98" fontSize="10" fontWeight="700" fill="#1a1a1a">
            {ward}
          </text>
          {re && (
            <text x="14" y="114" fontSize="8">
              RE: {re}
            </text>
          )}
        </g>
        <circle cx={width - 24} cy={height / 2} r="6" fill="#5a4a28" stroke="#3a2c14" strokeWidth="0.6" />
        <circle cx={width - 24} cy={height / 2} r="1.5" fill="#3a2c14" />
        <path
          d={`M${width - 18} ${height / 2} L${width - 6} ${height / 2 - 20}`}
          stroke="#3a2c14"
          strokeWidth="0.5"
        />
        <g transform={`translate(${width - 150}, ${height - 60}) rotate(-8)`}>
          <rect
            x="0"
            y="0"
            width="130"
            height="40"
            rx="2"
            fill="none"
            stroke="#7A1E16"
            strokeWidth="2"
            opacity="0.8"
          />
          <text
            x="65"
            y="17"
            fontFamily="JetBrains Mono"
            fontSize="11"
            fontWeight="700"
            fill="#7A1E16"
            textAnchor="middle"
            opacity="0.85"
            letterSpacing="2"
          >
            PATIENT
          </text>
          <text
            x="65"
            y="32"
            fontFamily="JetBrains Mono"
            fontSize="11"
            fontWeight="700"
            fill="#7A1E16"
            textAnchor="middle"
            opacity="0.85"
            letterSpacing="2"
          >
            RESULTS
          </text>
        </g>
      </svg>
      {children && (
        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            top: 124,
            bottom: 12,
            overflow: 'auto',
            fontSize: 10,
            color: '#1a1a1a',
            lineHeight: '14px',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
