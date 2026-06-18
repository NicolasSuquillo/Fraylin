"use client";

import { useEffect, useRef } from "react";

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  size: number;
  color: string;
  shape: 0 | 1; // 0 = rect, 1 = circle
  spin: number;
}

const COLORS = ["#C9A84C", "#E8C87A", "#A07830", "#FAF7F2", "#ffffff", "#fcd34d", "#D4AF5E", "#9A7020"];

/**
 * Confeti de celebración sobre canvas — sin dependencias.
 * Una sola ráfaga con gravedad; se desvanece y limpia solo.
 * `fire` permite re-disparar (key/contador) si se quiere.
 */
export default function SuccessConfetti({ fire = 0, count = 140 }: { fire?: number; count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = (canvas.width = window.innerWidth * dpr);
    let H = (canvas.height = window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.scale(dpr, dpr);

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spawn = (originX: number): Piece[] =>
      Array.from({ length: count / 2 }, () => {
        const angle = Math.random() * Math.PI - Math.PI / 2; // hacia arriba/lados
        const speed = 6 + Math.random() * 9;
        return {
          x: originX,
          y: vh * 0.32,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
          vy: Math.sin(angle) * speed - 4,
          rot: Math.random() * Math.PI,
          vrot: (Math.random() - 0.5) * 0.3,
          size: 6 + Math.random() * 7,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          shape: Math.random() > 0.5 ? 1 : 0,
          spin: Math.random() * Math.PI * 2,
        };
      });

    let pieces: Piece[] = [...spawn(vw * 0.28), ...spawn(vw * 0.72)];

    const gravity = 0.22;
    const drag = 0.992;
    let raf = 0;
    let frame = 0;
    const maxFrames = 260;

    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);
      const fade = frame > maxFrames - 70 ? Math.max(0, (maxFrames - frame) / 70) : 1;

      for (const p of pieces) {
        p.vy += gravity;
        p.vx *= drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.spin += 0.12;

        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        const flutter = Math.cos(p.spin); // simula giro 3D estrechando el ancho
        if (p.shape === 1) {
          ctx.beginPath();
          ctx.ellipse(0, 0, (p.size / 2) * Math.abs(flutter), p.size / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect((-p.size / 2) * Math.abs(flutter), -p.size / 2, p.size * Math.abs(flutter), p.size);
        }
        ctx.restore();
      }

      pieces = pieces.filter((p) => p.y < vh + 40);
      if (frame < maxFrames && pieces.length > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    };

    raf = requestAnimationFrame(tick);

    const onResize = () => {
      W = canvas.width = window.innerWidth * dpr;
      H = canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [fire, count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60]"
    />
  );
}
