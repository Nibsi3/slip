"use client";


export default function HeroGradient() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0" style={{ overflow: "hidden" }}>
        {/* Animated gradient blobs */}
        <div className="absolute inset-0" style={{ background: "#030306" }}>
          {/* Primary blue-purple blob */}
          <div
            className="absolute"
            style={{
              width: "60%",
              height: "60%",
              top: "10%",
              left: "20%",
              background:
                "radial-gradient(circle, rgba(20,167,249,0.45) 0%, rgba(20,167,249,0.22) 40%, transparent 70%)",
              filter: "blur(60px)",
              animation: "blob1 8s ease-in-out infinite",
              willChange: "transform",
            }}
          />

          {/* Pink-magenta blob */}
          <div
            className="absolute"
            style={{
              width: "50%",
              height: "50%",
              top: "20%",
              right: "10%",
              background: "radial-gradient(circle, rgba(219,39,119,0.4) 0%, rgba(236,72,153,0.2) 40%, transparent 70%)",
              filter: "blur(60px)",
              animation: "blob2 10s ease-in-out infinite",
              willChange: "transform",
            }}
          />

          {/* Deep blue blob */}
          <div
            className="absolute"
            style={{
              width: "55%",
              height: "55%",
              bottom: "5%",
              left: "10%",
              background:
                "radial-gradient(circle, rgba(59,130,246,0.32) 0%, rgba(20,167,249,0.18) 40%, transparent 70%)",
              filter: "blur(60px)",
              animation: "blob3 12s ease-in-out infinite",
              willChange: "transform",
            }}
          />

          {/* Teal accent blob */}
          <div
            className="absolute"
            style={{
              width: "40%",
              height: "40%",
              top: "40%",
              left: "35%",
              background:
                "radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(20,167,249,0.1) 40%, transparent 70%)",
              filter: "blur(80px)",
              animation: "blob4 9s ease-in-out infinite",
              willChange: "transform",
            }}
          />

          {/* Small bright accent */}
          <div
            className="absolute"
            style={{
              width: "30%",
              height: "30%",
              top: "15%",
              left: "40%",
              background: "radial-gradient(circle, rgba(20,167,249,0.22) 0%, transparent 60%)",
              filter: "blur(40px)",
              animation: "blob5 7s ease-in-out infinite",
              willChange: "transform",
            }}
          />
        </div>

        {/* Noise/grain overlay for texture */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
          }}
        />
      </div>

      {/* Edge vignette that stays fixed */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 80% at 50% 40%, transparent 40%, #030306 100%)",
        }}
      />

      {/* Keyframe animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blob1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(5%, -8%) scale(1.1); }
          66% { transform: translate(-3%, 5%) scale(0.95); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-8%, 5%) scale(1.05); }
          66% { transform: translate(4%, -6%) scale(1.1); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(6%, -4%) scale(1.08); }
          66% { transform: translate(-5%, 7%) scale(0.92); }
        }
        @keyframes blob4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-4%, -6%) scale(1.15); }
        }
        @keyframes blob5 {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          50% { transform: translate(8%, 4%) scale(1.2) rotate(10deg); }
        }
      ` }} />
    </div>
  );
}
