"use client";

import { useCallback, useEffect, useRef } from "react";

const SLIDES = [
  { src: "/carousel/goose-1.jpg", alt: "Canada goose in flight" },
  { src: "/carousel/goose-2.png", alt: "White goose close-up" },
  { src: "/carousel/goose-3.png", alt: "Canada goose standing by water" },
  { src: "/carousel/cobra.jpg", alt: "Cobra" },
  { src: "/carousel/chicken.png", alt: "Rooster" },
] as const;

const COUNT = SLIDES.length;
const ANGLE = 360 / COUNT;

export function GooseCarousel() {
  const rotRef = useRef(0);
  const velRef = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const ringRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  const paint = useCallback(() => {
    const el = ringRef.current;
    if (!el) return;
    el.style.transform = `rotateY(${rotRef.current}deg)`;
    el.querySelectorAll<HTMLElement>("[data-slide]").forEach((card, i) => {
      const world = (((i * ANGLE + rotRef.current) % 360) + 360) % 360;
      const dist = Math.min(world, 360 - world) / ANGLE;
      card.style.opacity = dist < 0.55 ? "1" : dist < 1.55 ? "0.88" : "0.5";
    });
  }, []);

  useEffect(() => {
    const tick = () => {
      if (!dragging.current) {
        velRef.current *= 0.9;
        if (Math.abs(velRef.current) < 0.12) {
          velRef.current = 0;
          const snapped = Math.round(rotRef.current / ANGLE) * ANGLE;
          const diff = snapped - rotRef.current;
          if (Math.abs(diff) < 0.2) rotRef.current = snapped;
          else rotRef.current += diff * 0.14;
        } else {
          rotRef.current += velRef.current;
        }
      }
      paint();
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [paint]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      velRef.current += e.deltaY * 0.04 + e.deltaX * 0.04;
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastX.current = e.clientX;
    velRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    velRef.current = dx * 0.22;
    rotRef.current += velRef.current;
  };

  const endDrag = () => {
    dragging.current = false;
  };

  return (
    <div
      ref={rootRef}
      className="relative mx-auto h-[22rem] w-full max-w-full cursor-grab touch-none overflow-hidden select-none active:cursor-grabbing [--carousel-radius:9.75rem] md:h-[28rem] md:[--carousel-radius:15rem] [perspective:900px] md:[perspective:1200px]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        ref={ringRef}
        className="absolute inset-0 [transform-style:preserve-3d]"
        style={{ transform: "rotateY(0deg)" }}
      >
        {SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            data-slide
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d] [backface-visibility:hidden]"
            style={{
              transform: `rotateY(${i * ANGLE}deg) translateZ(var(--carousel-radius))`,
            }}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              draggable={false}
              className="h-52 w-40 rounded-2xl object-cover md:h-72 md:w-56"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
