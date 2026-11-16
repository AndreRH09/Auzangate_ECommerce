import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { PATCH_D } from "./patch-path";

// SICÁN · PARCHE BORDADO: un solo macro sobre la tela negra. La máquina borda el parche 6384 · SICÁN fila por fila
// (ida y vuelta, como un relleno satinado); una luz dura pasa rasante y levanta el relieve del hilo. Al final la luz
// recorre el parche terminado y todo funde a negro puro. Sin texto.
export const PATCH = { width: 1080, height: 1080, fps: 30, seconds: 8.5 } as const; // 7.7–8.1 s fundido; 8.1–8.5 s negro

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ROWS = 72; // filas de bordado sobre los 1000 u del parche
const ROW_H = 1000 / ROWS;
const SIZE = 540; // lado del parche en px del cuadro
const T0 = 0.6; // empieza a bordar
const T1 = 6.0; // termina

export const Patch = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = frame / fps;

  const p = interpolate(s, [T0, T1], [0, 1], cl); // avance del bordado (velocidad constante: es una máquina)
  const rowF = p * ROWS;
  const row = Math.min(ROWS - 1, Math.floor(rowF));
  const along = rowF - row; // 0..1 dentro de la fila
  const ltr = row % 2 === 0;
  const needleX = (ltr ? along : 1 - along) * 1000;
  const needleY = (row + 0.5) * ROW_H;
  const sewing = s > T0 && s < T1;

  // luz dura: acompaña a la aguja mientras borda; después barre el parche terminado de izquierda a derecha
  const lightX = sewing ? needleX : interpolate(s, [T1, 7.6], [-200, 1200], { ...cl, easing: Easing.inOut(Easing.sin) });
  const lightY = sewing ? needleY - 260 : 300;

  const zoom = interpolate(s, [0, 8.1], [1.0, 1.1]);
  const fade = interpolate(s, [7.7, 8.1], [0, 1], cl);
  const off = (width - SIZE) / 2;
  const k = SIZE / 1000;
  const bob = sewing ? Math.abs(Math.sin(frame * 1.9)) : 1; // la aguja sube y baja

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        <defs>
          {/* tela negra: tafetán fino con retícula ripstop apenas visible */}
          <pattern id="weave" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#0C0C0D" />
            <path d="M0 1.5 H6 M1.5 0 V6" stroke="#161618" strokeWidth="1.2" />
          </pattern>
          <pattern id="rip" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="60" height="60" fill="url(#weave)" />
            <path d="M0 0.8 H60 M0.8 0 V60" stroke="#1D1D20" strokeWidth="1.6" />
          </pattern>
          {/* hilo satinado: puntadas paralelas en diagonal */}
          <pattern id="satin" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(68)">
            <rect width="5" height="5" fill="#D9D9D6" />
            <path d="M0 0.6 H5" stroke="#FFFFFF" strokeWidth="1.3" />
            <path d="M0 3.4 H5" stroke="#9C9C99" strokeWidth="0.8" />
          </pattern>
          {/* relieve: el hilo levanta sobre la tela y la luz puntual le saca brillo */}
          <filter id="raised" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="b" />
            <feSpecularLighting in="b" surfaceScale="4" specularConstant="1.1" specularExponent="18" lightingColor="#FFFFFF" result="spec">
              <fePointLight x={lightX} y={lightY} z={220} />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn" />
            <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="0.78" k3="0.55" k4="0" result="lit" />
            <feDropShadow in="lit" dx="-3" dy="5" stdDeviation="3" floodColor="#000" floodOpacity="0.85" />
          </filter>
          {/* lo bordado hasta ahora: filas completas + la fila en curso */}
          <mask id="sewn" maskUnits="userSpaceOnUse" x="-20" y="-20" width="1040" height="1040">
            {Array.from({ length: row }, (_, i) => <rect key={i} x={-20} y={i * ROW_H - 0.5} width={1040} height={ROW_H + 1} fill="#fff" />)}
            {p < 1 ? (
              <rect x={ltr ? -20 : needleX} y={row * ROW_H - 0.5} width={ltr ? needleX + 20 : 1020 - needleX} height={ROW_H + 1} fill="#fff" />
            ) : (
              <rect x={-20} y={-20} width={1040} height={1040} fill="#fff" />
            )}
          </mask>
          <radialGradient id="pool" cx="0.62" cy="0.38" r="0.7">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.10" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vig" cx="0.5" cy="0.5" r="0.72">
            <stop offset="0.5" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.85" />
          </radialGradient>
          <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 97} /><feColorMatrix type="saturate" values="0" /></filter>
        </defs>

        <g transform={`translate(${width / 2} ${height / 2}) scale(${zoom}) translate(${-width / 2} ${-height / 2})`}>
          <rect x={-200} y={-200} width={width + 400} height={height + 400} fill="url(#rip)" />
          <g transform={`translate(${off} ${off}) scale(${k})`}>
            <g filter="url(#raised)" mask="url(#sewn)">
              {/* los dos cuadrados del parche y la marca, en hilo blanco */}
              <rect x="48" y="48" width="904" height="904" fill="none" stroke="url(#satin)" strokeWidth="10" />
              <rect x="24" y="24" width="952" height="952" fill="none" stroke="url(#satin)" strokeWidth="18" />
              <path d={PATCH_D} fill="url(#satin)" fillRule="evenodd" />
            </g>
            {sewing && (
              <g>
                {/* hilo que baja a la aguja y la aguja (acero), con brillo en la punta */}
                <line x1={needleX + 40} y1={-400} x2={needleX} y2={needleY - 30 * bob} stroke="#F2F2F0" strokeWidth={1.4} opacity={0.6} />
                <line x1={needleX} y1={-400} x2={needleX} y2={needleY - 30 * bob} stroke="#8E9399" strokeWidth={5} />
                <circle cx={needleX} cy={needleY - 30 * bob} r={3.5} fill="#FFFFFF" />
              </g>
            )}
          </g>
          <rect x={-200} y={-200} width={width + 400} height={height + 400} fill="url(#pool)" />
        </g>
        <rect width={width} height={height} fill="url(#vig)" />

        <rect width={width} height={height} filter="url(#grain)" opacity={0.07} />
        {fade > 0 && <rect width={width} height={height} fill="#000" opacity={fade} />}
      </svg>
    </AbsoluteFill>
  );
};
