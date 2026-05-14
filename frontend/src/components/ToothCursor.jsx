import React, { useEffect, useRef, useState } from "react";

/* Custom tooth cursor that follows mouse and "breaks" on click */
export default function ToothCursor() {
  const dotRef = useRef(null);
  const [bursts, setBursts] = useState([]);
  const burstId = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return; // skip touch devices

    document.documentElement.classList.add("tooth-cursor-active");

    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;
    let raf;

    const move = (e) => { tx = e.clientX; ty = e.clientY; };
    const click = (e) => {
      const id = ++burstId.current;
      setBursts(b => [...b, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setBursts(b => b.filter(p => p.id !== id)), 900);
    };

    const tick = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x - 14}px, ${y - 16}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mousedown", click);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", click);
      document.documentElement.classList.remove("tooth-cursor-active");
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="tooth-cursor" data-testid="tooth-cursor" aria-hidden>
        <ToothSVG />
      </div>
      {bursts.map(b => (
        <div key={b.id} className="tooth-burst" style={{ left: b.x, top: b.y }} aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="shard" style={{ "--i": i }}>
              <ToothShard />
            </span>
          ))}
        </div>
      ))}
    </>
  );
}

function ToothSVG() {
  return (
    <svg width="28" height="32" viewBox="0 0 32 36" fill="none">
      <path d="M16 2C9 2 4 6 4 12c0 4 1 6 2 10s2 8 4 10c1.5 1.5 3 0 3.5-2l1-5c.3-1.5 2.7-1.5 3 0l1 5c.5 2 2 3.5 3.5 2 2-2 3-6 4-10s2-6 2-10c0-6-5-10-12-10z"
        fill="#FAF8F5" stroke="#2C2621" strokeWidth="1.6" strokeLinejoin="round"/>
      <ellipse cx="11" cy="11" rx="2" ry="3" fill="rgba(255,255,255,0.7)"/>
    </svg>
  );
}

function ToothShard() {
  return (
    <svg width="14" height="16" viewBox="0 0 32 36" fill="none">
      <path d="M16 4C10 4 6 8 6 13c0 5 4 16 6 18 1 1 2 0 2.5-1l1-4c.3-1 2-1 2.3 0l1 4c.5 1 1.5 2 2.5 1 2-2 6-13 6-18 0-5-4-9-10-9z"
        fill="#FAF8F5" stroke="#2C2621" strokeWidth="2"/>
    </svg>
  );
}
