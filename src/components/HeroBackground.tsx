"use client";

import React, { useMemo } from "react";

/* ─────────────────────────────────────────────────────────────
   Deterministic PRNG — identical on server and client
───────────────────────────────────────────────────────────── */
function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}

interface Star { cx:number; cy:number; r:number; op:number; tw:number; td:number; bright:boolean }
interface Prominence { angle:number; len:number; width:number; delay:number; dur:number }

/* ─────────────────────────────────────────────────────────────
   3-D SVG SPHERE ORB
   Renders a photorealistic sphere using layered radial gradients:
   1. Base warm-amber body
   2. Tight white specular highlight (upper-left)
   3. Soft fill light (lower-right bounce)
   4. Dark limb (edge extinction)
───────────────────────────────────────────────────────────── */
function SphereOrb({ size, delay, duration, animName }: {
  size: number; delay: number; duration: number; animName: string;
}) {
  const s = size;
  const id = animName.replace(/[^a-z0-9]/gi, "");
  return (
    <svg
      width={s} height={s}
      viewBox={`0 0 ${s} ${s}`}
      style={{
        position: "absolute",
        transform: `translate(-50%, -50%)`,
        animation: `${animName} ${duration}s ${delay}s linear infinite`,
        overflow: "visible",
        filter: `drop-shadow(0 0 ${s * 0.6}px rgba(255,170,50,0.9)) drop-shadow(0 0 ${s * 1.4}px rgba(255,100,10,0.5))`,
      }}
    >
      <defs>
        {/* Base body gradient */}
        <radialGradient id={`ob-${id}`} cx="38%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#fff5d0"/>
          <stop offset="18%"  stopColor="#ffc050"/>
          <stop offset="45%"  stopColor="#e07010"/>
          <stop offset="75%"  stopColor="#8a3500"/>
          <stop offset="100%" stopColor="#3a1000"/>
        </radialGradient>
        {/* Specular highlight — tight white blob upper-left */}
        <radialGradient id={`os-${id}`} cx="28%" cy="26%" r="32%">
          <stop offset="0%"   stopColor="white"   stopOpacity="0.95"/>
          <stop offset="40%"  stopColor="white"   stopOpacity="0.35"/>
          <stop offset="100%" stopColor="white"   stopOpacity="0"/>
        </radialGradient>
        {/* Limb darkening */}
        <radialGradient id={`ol-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="44%"  stopColor="black"   stopOpacity="0"/>
          <stop offset="100%" stopColor="black"   stopOpacity="0.72"/>
        </radialGradient>
        {/* Soft fill light lower-right */}
        <radialGradient id={`of-${id}`} cx="75%" cy="76%" r="40%">
          <stop offset="0%"   stopColor="#ff9030"  stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#ff9030"  stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* Body */}
      <circle cx={s/2} cy={s/2} r={s/2} fill={`url(#ob-${id})`}/>
      {/* Fill light */}
      <circle cx={s/2} cy={s/2} r={s/2} fill={`url(#of-${id})`}/>
      {/* Specular */}
      <circle cx={s/2} cy={s/2} r={s/2} fill={`url(#os-${id})`}/>
      {/* Limb */}
      <circle cx={s/2} cy={s/2} r={s/2} fill={`url(#ol-${id})`}/>
    </svg>
  );
}

/*
  SATURN SPLIT-DISK TECHNIQUE
  ────────────────────────────
  Problem: CSS can't depth-sort a ring that passes both behind AND in front of
  a sphere. Solution: render the ring disk TWICE.
    1. BACK  half (clip top 50%) → z-index BELOW planet
    2. Planet sphere              → z-index MIDDLE
    3. FRONT half (clip bot 50%) → z-index ABOVE planet
  Both disk copies share the same disk-spin animation so they stay in sync.
  Orbs also appear on both halves, clipped accordingly.
*/

/* Ring band definitions — diameter, stroke, glow colour, differential spin speed */
const RING_BANDS = [
  { d:360, stroke:"1.5px", color:"rgba(255,195,110,.16)", glow:"rgba(255,165,55,.10)", spd:200 },
  { d:420, stroke:"3.5px", color:"rgba(255,182,75,.34)",  glow:"rgba(255,148,38,.24)", spd:140 },
  { d:470, stroke:"1px",   color:"rgba(195,115,38,.09)",  glow:"rgba(195,100,18,.05)", spd:170 },
  { d:530, stroke:"4.5px", color:"rgba(255,198,85,.30)",  glow:"rgba(255,155,32,.22)", spd:115 },
  { d:590, stroke:"2px",   color:"rgba(255,158,55,.14)",  glow:"rgba(255,125,18,.09)", spd:160 },
  { d:660, stroke:"1.5px", color:"rgba(220,110,40,.10)",  glow:"rgba(200,90,15,.06)",  spd:210 },
  { d:740, stroke:"1px",   color:"rgba(190,90,28,.07)",   glow:"rgba(175,75,10,.04)",  spd:290 },
];

/* Orbs: { ringIdx, startDeg, size, speed (s for full orbit) } */
const ORB_DEFS = [
  { ri:1, startDeg:0,   size:11, spd:38 },
  { ri:1, startDeg:180, size: 9, spd:38 },
  { ri:3, startDeg:0,   size: 9, spd:52 },
  { ri:3, startDeg:120, size: 7, spd:52 },
  { ri:3, startDeg:240, size: 7, spd:52 },
  { ri:5, startDeg:60,  size: 6, spd:70 },
];

export default function HeroBackground() {

  /* ── Star field ── */
  const stars = useMemo<Star[]>(() => {
    const rng = seededRandom(7331);
    return Array.from({ length: 260 }, () => {
      const bright = rng() > 0.93;
      return {
        cx:     rng() * 100,
        cy:     rng() * 100,
        r:      bright ? 0.55 + rng() * 0.8 : 0.06 + rng() * 0.38,
        op:     bright ? 0.55 + rng() * 0.45 : 0.10 + rng() * 0.55,
        /* SLOW twinkle: 9–22 seconds */
        tw:     9 + rng() * 13,
        td:     rng() * 18,
        bright,
      };
    });
  }, []);

  /* ── Solar prominence arches ── */
  const prominences = useMemo<Prominence[]>(() => {
    const rng = seededRandom(1234);
    return Array.from({ length: 7 }, (_, i) => ({
      angle: (i / 7) * 360 + rng() * 20 - 10,
      len:   50 + rng() * 55,
      width: 5 + rng() * 9,
      delay: rng() * 9,
      dur:   6 + rng() * 7,
    }));
  }, []);

  /* ── Build per-orb keyframe names (one per orb, deterministic) ── */
  const orbKeyframes = useMemo(() => {
    return ORB_DEFS.map((o, i) => {
      const r = RING_BANDS[o.ri].d / 2;
      return `orb${i}s${o.startDeg}r${r}`;
    });
  }, []);

  /* ── Helper: renders all ring bands + orbs for a given clip half ── */
  const RingDisk = ({ clipHalf, diskAnim }: { clipHalf: "back" | "front"; diskAnim: string }) => {
    /*
      We use a large clipping wrapper to show only the relevant half.
      For "back"  (goes behind planet): clip the TOP half of the disk    → clipPath top 50%
      For "front" (goes in front):      clip the BOTTOM half of the disk → clipPath bottom 50%

      The disk itself is rotateX(72deg) so the "top" in 3D space maps to
      the upper part of the ellipse — exactly what we want.
    */
    const W = 800; // large enough to contain all rings
    const clip = clipHalf === "back"
      ? `polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%)`   // top half
      : `polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%)`; // bottom half

    return (
      <div style={{
        position:"absolute",
        width:W, height:W,
        left:-W/2, top:-W/2,
        clipPath: clip,
        overflow:"visible",
      }}>
        {/* The spinning disk, re-centred inside the clip wrapper */}
        <div style={{
          position:"absolute",
          left: W/2, top: W/2,
          width:0, height:0,
          animation: diskAnim,
        }}>
          {RING_BANDS.map((band, ri) => (
            <div key={ri} style={{
              position:"absolute",
              width:band.d, height:band.d,
              borderRadius:"50%",
              border:`${band.stroke} solid ${band.color}`,
              boxShadow:`0 0 18px 3px ${band.glow}, inset 0 0 10px 2px ${band.glow}`,
              transform:"translate(-50%,-50%)",
              /* differential rotation — alternating directions */
              animation: ri % 2 === 0
                ? `rdiff-fwd ${band.spd}s linear infinite`
                : `rdiff-rev ${band.spd}s linear infinite`,
            }}>
              {/* Orbs belonging to this ring */}
              {ORB_DEFS.filter(o => o.ri === ri).map((o, oi) => {
                const globalIdx = ORB_DEFS.findIndex(x => x === o);
                const kfName = orbKeyframes[globalIdx] ?? `orb${oi}`;
                return (
                  <SphereOrb
                    key={oi}
                    size={o.size}
                    delay={oi * 1.8}
                    duration={o.spd}
                    animName={kfName}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex:0, background:"#080808" }}
    >

      {/* ═══════════════  KEYFRAMES  ═══════════════ */}
      <style>{`
        @keyframes nebula-drift {
          0%,100% { transform:translate(-50%,-50%) scale(1)    rotate(0deg); opacity:.13; }
          50%      { transform:translate(-50%,-50%) scale(1.10) rotate(6deg); opacity:.08; }
        }
        @keyframes planet-breathe {
          0%,100% { transform:translate(-50%,-50%) scale(1);     }
          50%      { transform:translate(-50%,-50%) scale(1.045); }
        }
        @keyframes chroma-pulse {
          0%,100% { transform:translate(-50%,-50%) scale(1);    opacity:.75; }
          50%      { transform:translate(-50%,-50%) scale(1.08); opacity:.40; }
        }
        @keyframes corona-wave {
          0%   { transform:translate(-50%,-50%) scale(.88);  opacity:.24; }
          65%  { transform:translate(-50%,-50%) scale(1.30); opacity:.06; }
          100% { transform:translate(-50%,-50%) scale(1.52); opacity:0;   }
        }
        /* Main disk tilt+spin — the translate(-50%,-50%) is on the clip wrapper's inner div */
        @keyframes disk-tilt-spin {
          from { transform:translate(-50%,-50%) rotateX(72deg) rotateZ(0deg);   }
          to   { transform:translate(-50%,-50%) rotateX(72deg) rotateZ(360deg); }
        }
        /* Differential ring rotation inside the disk */
        @keyframes rdiff-fwd {
          from { transform:translate(-50%,-50%) rotateZ(0deg);   }
          to   { transform:translate(-50%,-50%) rotateZ(360deg); }
        }
        @keyframes rdiff-rev {
          from { transform:translate(-50%,-50%) rotateZ(0deg);    }
          to   { transform:translate(-50%,-50%) rotateZ(-360deg); }
        }
        /* Per-orb travel keyframes — one per ORB_DEFS entry */
        ${ORB_DEFS.map((o, i) => {
          const r = RING_BANDS[o.ri].d / 2;
          const kf = orbKeyframes[i];
          return `
            @keyframes ${kf} {
              from { transform:translate(-50%,-50%) rotate(${o.startDeg}deg) translateX(${r}px); }
              to   { transform:translate(-50%,-50%) rotate(${o.startDeg + 360}deg) translateX(${r}px); }
            }
          `;
        }).join("")}
        @keyframes band-drift {
          0%,100% { transform:translate(-50%,-50%) rotate(0deg); }
          50%      { transform:translate(-50%,-50%) rotate(5deg); }
        }
        @keyframes prominence-rise {
          0%   { opacity:0;   transform:scaleY(.08) scaleX(.2); }
          25%  { opacity:.65; }
          70%  { opacity:.45; }
          100% { opacity:0;   transform:scaleY(1) scaleX(1); }
        }
        @keyframes twinkle {
          0%,100% { opacity:1;    transform:scale(1);   }
          50%      { opacity:.07; transform:scale(.50); }
        }
        @keyframes spike-shimmer {
          0%,100% { opacity:.45; }
          50%      { opacity:.90; }
        }
      `}</style>

      {/* ══  L1 — deep-space warm wash  ══ */}
      <div className="absolute inset-0" style={{
        background:"radial-gradient(ellipse 140% 120% at 63% 50%, #1e0b01 0%, #0f0501 28%, #080808 65%)"
      }}/>
      <div style={{
        position:"absolute", width:720, height:520, left:"76%", top:"18%",
        transform:"translate(-50%,-50%)",
        background:"radial-gradient(ellipse 100% 100% at 50% 50%, rgba(90,35,0,.16) 0%, transparent 70%)",
        animation:"nebula-drift 28s ease-in-out infinite",
        filter:"blur(32px)", borderRadius:"50%",
      }}/>
      <div style={{
        position:"absolute", width:500, height:380, left:"18%", top:"72%",
        transform:"translate(-50%,-50%)",
        background:"radial-gradient(ellipse 100% 100% at 50% 50%, rgba(60,18,0,.10) 0%, transparent 70%)",
        animation:"nebula-drift 36s 8s ease-in-out infinite",
        filter:"blur(28px)", borderRadius:"50%",
      }}/>

      {/* ══  L2 — star field  ══ */}
      <svg className="absolute inset-0 w-full h-full" style={{pointerEvents:"none"}}>
        <defs>
          <radialGradient id="hb-sg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="1"/>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
          </radialGradient>
        </defs>
        {stars.map((s, i) => (
          <circle key={i} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r}
            fill={s.bright ? "url(#hb-sg)" : "white"}
            style={{ opacity:s.op, animation:`twinkle ${s.tw}s ${s.td}s ease-in-out infinite` } as React.CSSProperties}
          />
        ))}
        {stars.filter(s => s.bright).slice(0,16).map((s, i) => (
          <g key={`spk${i}`}>
            <line x1={`${s.cx}%`} y1={`${s.cy-.65}%`} x2={`${s.cx}%`} y2={`${s.cy+.65}%`}
              stroke="white" strokeWidth={0.28}
              style={{ opacity:s.op*.55, animation:`spike-shimmer ${s.tw}s ${s.td}s ease-in-out infinite` }}/>
            <line x1={`${s.cx-.38}%`} y1={`${s.cy}%`} x2={`${s.cx+.38}%`} y2={`${s.cy}%`}
              stroke="white" strokeWidth={0.28}
              style={{ opacity:s.op*.55, animation:`spike-shimmer ${s.tw}s ${s.td+.4}s ease-in-out infinite` }}/>
          </g>
        ))}
      </svg>

      {/* ══  L3 — PLANET + SPLIT SATURN RINGS ══
          The anchor div lives at 63%/50%.
          Z-order inside:  back-rings(1) → corona/chroma(2) → planet(3) → front-rings(4)
          perspective is set here so all 3D children share same vanishing point.
      */}
      <div className="absolute" style={{
        left:"63%", top:"50%",
        width:0, height:0,
        pointerEvents:"none",
        perspective:"1100px",
        perspectiveOrigin:"50% 50%",
      }}>

        {/* ─ Corona waves (behind everything, z=1) ─ */}
        {[0, 3.5, 7].map((d, i) => (
          <div key={i} style={{
            position:"absolute", zIndex:1,
            width:900, height:900, borderRadius:"50%",
            background:"radial-gradient(circle, rgba(200,85,0,.18) 0%, rgba(140,45,0,.08) 36%, transparent 66%)",
            transform:"translate(-50%,-50%)",
            animation:`corona-wave 11s ${d}s ease-out infinite`,
            filter:"blur(5px)",
          }}/>
        ))}

        {/* ─ RING BACK HALF (z=2, behind planet) ─ */}
        <div style={{ position:"absolute", zIndex:2, width:0, height:0 }}>
          <RingDisk clipHalf="back" diskAnim="disk-tilt-spin 140s linear infinite" />
        </div>

        {/* ─ Chromosphere (z=3, just behind planet face) ─ */}
        <div style={{
          position:"absolute", zIndex:3,
          width:360, height:360, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(255,150,25,.60) 0%, rgba(210,65,0,.30) 42%, transparent 70%)",
          transform:"translate(-50%,-50%)",
          animation:"chroma-pulse 5.5s ease-in-out infinite",
          filter:"blur(7px)",
        }}/>

        {/* ─ Surface shimmer (z=4) ─ */}
        <div style={{
          position:"absolute", zIndex:4,
          width:310, height:310, borderRadius:"50%",
          background:"conic-gradient(from 0deg, transparent 0%, rgba(255,215,100,.09) 16%, transparent 32%, rgba(255,145,35,.12) 50%, transparent 68%, rgba(255,200,90,.07) 84%, transparent 100%)",
          transform:"translate(-50%,-50%)",
          animation:"band-drift 24s ease-in-out infinite",
          filter:"blur(8px)",
        }}/>

        {/* ─ PLANET CORE (z=5) ─ */}
        <div style={{
          position:"absolute", zIndex:5,
          width:290, height:290, borderRadius:"50%",
          background:"radial-gradient(circle at 36% 33%, #fff6d8 0%, #ffb848 12%, #ff7318 30%, #c44a00 54%, #6c2100 78%, #2e0d00 100%)",
          boxShadow:[
            "0 0 50px rgba(255,125,30,.80)",
            "0 0 100px rgba(205,80,0,.56)",
            "0 0 200px rgba(185,60,0,.32)",
            "0 0 380px rgba(140,40,0,.16)",
            "0 0 650px rgba(110,28,0,.09)",
          ].join(", "),
          transform:"translate(-50%,-50%)",
          animation:"planet-breathe 7s ease-in-out infinite",
          overflow:"hidden",
        }}>
          <div style={{ position:"absolute", inset:0, borderRadius:"50%",
            background:"radial-gradient(ellipse 52% 26% at 33% 31%, rgba(255,250,215,.32) 0%, transparent 68%)" }}/>
          <div style={{ position:"absolute", inset:0, borderRadius:"50%",
            background:"radial-gradient(ellipse 30% 16% at 65% 58%, rgba(38,7,0,.45) 0%, transparent 70%)" }}/>
          <div style={{ position:"absolute", inset:0, borderRadius:"50%",
            background:"radial-gradient(ellipse 16% 11% at 44% 74%, rgba(28,5,0,.38) 0%, transparent 65%)" }}/>
          <div style={{ position:"absolute", inset:0, borderRadius:"50%",
            background:"radial-gradient(ellipse 80% 22% at 50% 52%, rgba(255,155,40,.07) 0%, transparent 100%)",
            animation:"band-drift 16s ease-in-out infinite reverse" }}/>
          <div style={{ position:"absolute", inset:0, borderRadius:"50%",
            background:"radial-gradient(circle at 50% 50%, transparent 42%, rgba(0,0,0,.65) 100%)" }}/>
        </div>

        {/* ─ Solar prominences (z=5, same level as planet edge) ─ */}
        {prominences.map((p, i) => {
          const rad = (p.angle * Math.PI) / 180;
          return (
            <div key={i} style={{
              position:"absolute", zIndex:5,
              width:p.width, height:p.len,
              left:`calc(50% + ${Math.cos(rad)*143}px)`,
              top:`calc(50% + ${Math.sin(rad)*143}px)`,
              transform:`translate(-50%,-50%) rotate(${p.angle+90}deg)`,
              transformOrigin:"50% 100%",
              background:"radial-gradient(ellipse 50% 100% at 50% 100%, rgba(255,145,35,.68) 0%, rgba(255,80,10,.26) 55%, transparent 100%)",
              borderRadius:"50% 50% 0 0 / 100% 100% 0 0",
              filter:"blur(3px)",
              animation:`prominence-rise ${p.dur}s ${p.delay}s ease-in-out infinite`,
              opacity:0,
            }}/>
          );
        })}

        {/* ─ RING FRONT HALF (z=6, in front of planet) ─ */}
        <div style={{ position:"absolute", zIndex:6, width:0, height:0 }}>
          <RingDisk clipHalf="front" diskAnim="disk-tilt-spin 140s linear infinite" />
        </div>

      </div>{/* /planet system */}

      {/* ══  L4 — compositing overlays  ══ */}
      <div className="absolute inset-0" style={{
        background:"radial-gradient(ellipse 90% 90% at 50% 50%, transparent 30%, rgba(8,8,8,.60) 100%)",
        pointerEvents:"none",
      }}/>
      <div className="absolute inset-0" style={{
        background:"linear-gradient(to right, rgba(8,8,8,.92) 0%, rgba(8,8,8,.52) 24%, rgba(8,8,8,.12) 44%, transparent 60%)",
        pointerEvents:"none",
      }}/>
      <div className="absolute inset-0" style={{
        background:"linear-gradient(to left, rgba(8,8,8,.78) 0%, transparent 42%)",
        pointerEvents:"none",
      }}/>
      <div className="absolute bottom-0 left-0 right-0 h-60" style={{
        background:"linear-gradient(to bottom, transparent 0%, rgba(8,8,8,1) 100%)",
        pointerEvents:"none",
      }}/>
      <div className="absolute top-0 left-0 right-0 h-36" style={{
        background:"linear-gradient(to top, transparent 0%, rgba(8,8,8,.65) 100%)",
        pointerEvents:"none",
      }}/>

    </div>
  );
}
