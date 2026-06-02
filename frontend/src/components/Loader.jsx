import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const LOGO_URL = "/images/logo.jpeg";

export default function Loader({ onDone }) {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHide(true), 1500);
    const t2 = setTimeout(() => onDone?.(), 2200);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      data-testid="page-loader"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-bgmain transition-all duration-700 ${
        hide ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative flex flex-col items-center">
        <div className="relative">
          <img
            src={LOGO_URL}
            alt="Smile Savers Dental Clinic"
            className={`w-40 h-40 object-contain transition-all duration-1000 ${hide ? "scale-110 opacity-0" : "scale-100 opacity-100"}`}
            style={{ animation: "logoBreath 1.4s ease-in-out infinite" }}
          />
          <div className="absolute inset-0 -z-10 rounded-full" style={{
            background: "radial-gradient(circle, rgba(188,163,143,0.35) 0%, transparent 70%)",
            animation: "pulse 1.4s ease-in-out infinite"
          }}/>
        </div>
        <div className="mt-8 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cocoa" style={{ animation: "bounce 0.8s ease-in-out infinite", animationDelay: "0s" }}/>
          <div className="w-2 h-2 rounded-full bg-cocoa" style={{ animation: "bounce 0.8s ease-in-out infinite", animationDelay: "0.15s" }}/>
          <div className="w-2 h-2 rounded-full bg-cocoa" style={{ animation: "bounce 0.8s ease-in-out infinite", animationDelay: "0.3s" }}/>
        </div>
        <div className="mt-3 eyebrow text-mocha">Crafting smiles…</div>
      </div>

      <style>{`
        @keyframes logoBreath { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        @keyframes pulse { 0%,100% { opacity: 0.3; transform: scale(0.95); } 50% { opacity: 0.8; transform: scale(1.1); } }
        @keyframes bounce { 0%,100% { transform: translateY(0); opacity: 0.6; } 50% { transform: translateY(-8px); opacity: 1; } }
      `}</style>
    </div>
  );
}
