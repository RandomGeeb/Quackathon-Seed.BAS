"use client";

import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { X } from "lucide-react";
import type { CAU } from "@/lib/mock-data";
import { CAU_TYPE_COLOR, CAU_TIER_COLOR } from "@/lib/mock-data";
import * as THREE from "three";

// ─── 3D Model ──────────────────────────────────────────────────────────────

function GPUModel() {
  const { scene } = useGLTF("/assets/gpu-rtx3080.glb");
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.15;
  });

  return (
    <group ref={ref}>
      <primitive object={scene} scale={15} />
    </group>
  );
}

function ModelFallback() {
  return (
    <mesh>
      <boxGeometry args={[2.5, 0.4, 1.2]} />
      <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.9} />
    </mesh>
  );
}

// ─── CLI Terminal ──────────────────────────────────────────────────────────

type CLILine = {
  text: string;
  color?: "dim" | "accent" | "warn" | "error" | "muted" | "divider";
};

function buildLines(cau: CAU): CLILine[] {
  const utilPct = Math.round((cau.scuUsed / cau.scu) * 100);
  const barFilled = Math.round(utilPct / 10);
  const bar = "█".repeat(barFilled) + "░".repeat(10 - barFilled);
  const tempStatus = cau.temp > 75 ? "WARN" : cau.temp > 60 ? "ELEV" : "OK";
  const tempColor = cau.temp > 75 ? "error" : cau.temp > 60 ? "warn" : "accent";

  const lines: CLILine[] = [
    { text: "BAS-SCAN v2.4.1 // DEVICE INSPECTOR", color: "dim" },
    { text: "─────────────────────────────────────", color: "divider" },
    { text: `> INIT.............. SCANNING`, color: "accent" },
    { text: `> UNIT_ID........... ${cau.id}` },
    { text: `> DEVICE............ ${cau.name}` },
    { text: `> TYPE.............. ${cau.type}` },
    { text: `> TIER.............. ${cau.tier}-CLASS` },
    { text: `> STATUS............ ${cau.status.toUpperCase()}`, color: cau.status === "active" ? "accent" : "warn" },
    { text: "─────────────────────────────────────", color: "divider" },
    { text: "> HARDWARE PROFILE" },
    { text: `> MODEL............. ${cau.model}` },
    ...(cau.vram   ? [{ text: `> VRAM.............. ${cau.vram}` } as CLILine] : []),
    ...(cau.cores  ? [{ text: `> CORES............. ${cau.cores}C` } as CLILine] : []),
    ...(cau.clock  ? [{ text: `> CLOCK............. ${cau.clock}` } as CLILine] : []),
    ...(cau.capacity ? [{ text: `> CAPACITY.......... ${cau.capacity}` } as CLILine] : []),
    { text: "─────────────────────────────────────", color: "divider" },
    { text: "> TELEMETRY" },
    { text: `> SCU_CAPACITY...... ${cau.scu.toLocaleString()} SCU` },
    { text: `> SCU_UTILIZED...... ${cau.scuUsed.toLocaleString()} SCU` },
    { text: `> UTIL_PCT.......... ${utilPct}% [${bar}]`, color: utilPct > 85 ? "warn" : "accent" },
    { text: `> TEMPERATURE....... ${cau.temp}°C [${tempStatus}]`, color: tempColor },
    { text: `> POWER_DRAW........ ${cau.power} W` },
    { text: "─────────────────────────────────────", color: "divider" },
    { text: `> ACQ_DATE.......... ${cau.acquiredDate}`, color: "dim" },
    { text: "─────────────────────────────────────", color: "divider" },
    { text: "> SCAN COMPLETE [OK]", color: "accent" },
  ];

  return lines;
}

function CLITerminal({ cau, accentColor }: { cau: CAU; accentColor: string }) {
  const lines = buildLines(cau);
  const [revealed, setRevealed] = useState(0);
  const [blink, setBlink] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reveal lines one by one
  useEffect(() => {
    setRevealed(0);
    const id = setInterval(() => {
      setRevealed((n) => {
        if (n >= lines.length) { clearInterval(id); return n; }
        return n + 1;
      });
    }, 60);
    return () => clearInterval(id);
  }, [cau.id, lines.length]);

  // Blink cursor
  useEffect(() => {
    const id = setInterval(() => setBlink((b) => !b), 530);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [revealed]);

  const colorMap: Record<string, string> = {
    accent:  accentColor,
    warn:    "#ffaa00",
    error:   "#ff4444",
    dim:     "rgba(255,255,255,0.35)",
    muted:   "rgba(255,255,255,0.25)",
    divider: "rgba(255,255,255,0.12)",
  };

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-0.5 scrollbar-none"
      style={{ scrollbarWidth: "none" }}
    >
      {lines.slice(0, revealed).map((line, i) => (
        <p
          key={i}
          className="font-mono text-[10px] leading-relaxed whitespace-pre"
          style={{ color: line.color ? colorMap[line.color] : "rgba(255,255,255,0.70)" }}
        >
          {line.text}
        </p>
      ))}
      {/* Cursor */}
      {revealed < lines.length && (
        <p className="font-mono text-[10px] leading-relaxed" style={{ color: accentColor }}>
          {blink ? "█" : " "}
        </p>
      )}
      {revealed >= lines.length && (
        <p className="font-mono text-[10px] leading-relaxed" style={{ color: accentColor }}>
          {">"} {blink ? "█" : " "}
        </p>
      )}
    </div>
  );
}

// ─── Corner Marks ──────────────────────────────────────────────────────────

function CornerMarks({ color }: { color: string }) {
  return (
    <>
      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l pointer-events-none" style={{ borderColor: `${color}50` }} />
      <span className="absolute top-0 right-0 w-3 h-3 border-t border-r pointer-events-none" style={{ borderColor: `${color}50` }} />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l pointer-events-none" style={{ borderColor: `${color}50` }} />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r pointer-events-none" style={{ borderColor: `${color}50` }} />
    </>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────

export default function GPUViewerModal({ cau, onClose }: { cau: CAU; onClose: () => void }) {
  const typeColor = CAU_TYPE_COLOR[cau.type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-[#0d0d0d] border overflow-hidden flex flex-col lg:flex-row"
        style={{ borderColor: `${typeColor}25`, maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <CornerMarks color={typeColor} />

        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${typeColor}60, transparent)` }}
        />

        {/* ── Left: 3D Viewer ── */}
        <div className="relative flex-1 min-h-[320px] lg:min-h-[500px] bg-[#080808]">
          <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
            <div className="w-1.5 h-1.5 animate-pulse" style={{ backgroundColor: typeColor }} />
            <span className="font-mono text-[8px] tracking-[0.3em] uppercase" style={{ color: `${typeColor}90` }}>
              3D.INTERACTIVE
            </span>
          </div>

          <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center">
            <span className="font-mono text-[7px] text-white/25 tracking-[0.25em] uppercase">
              DRAG TO ROTATE · SCROLL TO ZOOM
            </span>
          </div>

          <Canvas
            camera={{ position: [0, 0, 5], fov: 55 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: "transparent" }}
          >
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} />
            <directionalLight position={[-3, 2, -2]} intensity={0.4} color={typeColor} />
            <pointLight position={[0, 3, 0]} intensity={0.6} color={typeColor} distance={8} />

            <Suspense fallback={<ModelFallback />}>
              <GPUModel />
              <Environment preset="city" />
              <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={6} blur={2} color={typeColor} />
            </Suspense>

            <OrbitControls enablePan={false} minDistance={2} maxDistance={10} autoRotate={false} />
          </Canvas>
        </div>

        {/* ── Right: CLI Terminal ── */}
        <div
          className="w-full lg:w-80 flex flex-col border-t lg:border-t-0 lg:border-l bg-[#060606]"
          style={{ borderColor: `${typeColor}20` }}
        >
          {/* Terminal title bar */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b shrink-0"
            style={{ borderColor: `${typeColor}15` }}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 animate-pulse" style={{ backgroundColor: typeColor }} />
              <span className="font-mono text-[8px] tracking-[0.3em] uppercase" style={{ color: `${typeColor}70` }}>
                TERMINAL // ASSET.SCAN
              </span>
            </div>
            <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* CLI output */}
          <CLITerminal cau={cau} accentColor={typeColor} />
        </div>
      </div>
    </div>
  );
}
