import React, { useEffect, useRef, useState } from 'react';
import { KyronLogo } from './KyronLogo';
import { Sparkles, ArrowRight, Zap, Shield, Compass } from 'lucide-react';

interface CosmicCometBackgroundProps {
  showIntroSplash?: boolean;
  onEnterApp?: () => void;
  className?: string;
  children?: React.ReactNode;
}

interface Comet {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  size: number;
  opacity: number;
  color: string;
  trail: { x: number; y: number; opacity: number }[];
}

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  twinkleDirection: number;
}

export const CosmicCometBackground: React.FC<CosmicCometBackgroundProps> = ({
  showIntroSplash = false,
  onEnterApp,
  className = '',
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isIntroDismissed, setIsIntroDismissed] = useState(!showIntroSplash);
  const [introProgress, setIntroProgress] = useState(0);

  // Auto-progress intro splash
  useEffect(() => {
    if (!showIntroSplash || isIntroDismissed) return;

    const interval = setInterval(() => {
      setIntroProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsIntroDismissed(true);
            onEnterApp?.();
          }, 350);
          return 100;
        }
        return prev + 4;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [showIntroSplash, isIntroDismissed, onEnterApp]);

  // Real-time Cosmic Comet Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener('resize', handleResize);

    // Initialize Stars
    let stars: Star[] = [];
    const initStars = () => {
      stars = [];
      const count = Math.floor((width * height) / 3800);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.4 + 0.3,
          alpha: Math.random() * 0.8 + 0.2,
          twinkleSpeed: Math.random() * 0.015 + 0.005,
          twinkleDirection: Math.random() > 0.5 ? 1 : -1,
        });
      }
    };
    initStars();

    // Comets Pool
    const cometColors = [
      'rgba(34, 211, 238,', // Cyan
      'rgba(56, 189, 248,', // Sky Blue
      'rgba(168, 85, 247,', // Purple
      'rgba(244, 114, 182,', // Pink
      'rgba(99, 102, 241,', // Indigo
    ];

    const comets: Comet[] = [];
    const spawnComet = () => {
      // Spawn comets travelling diagonally from top/left towards bottom/right
      const startFromTop = Math.random() > 0.4;
      const x = startFromTop ? Math.random() * width * 0.85 : 0;
      const y = startFromTop ? 0 : Math.random() * height * 0.7;
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.25; // ~45 deg
      const speed = Math.random() * 7 + 9; // High velocity
      const length = Math.random() * 140 + 110;
      const size = Math.random() * 2.2 + 1.2;
      const color = cometColors[Math.floor(Math.random() * cometColors.length)];

      comets.push({
        x,
        y,
        length,
        speed,
        angle,
        size,
        opacity: Math.random() * 0.4 + 0.6,
        color,
        trail: [],
      });
    };

    // Pre-populate 1 initial comet
    spawnComet();

    let lastSpawnTime = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep space atmospheric base with glowing interstellar nebulae
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.4,
        width * 0.05,
        width * 0.5,
        height * 0.5,
        width * 0.9
      );
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
      gradient.addColorStop(0.5, 'rgba(8, 12, 28, 0.7)');
      gradient.addColorStop(1, 'rgba(2, 6, 23, 0.98)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render Twinkling Stars
      for (const star of stars) {
        star.alpha += star.twinkleSpeed * star.twinkleDirection;
        if (star.alpha >= 0.95) {
          star.alpha = 0.95;
          star.twinkleDirection = -1;
        } else if (star.alpha <= 0.15) {
          star.alpha = 0.15;
          star.twinkleDirection = 1;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.shadowColor = 'rgba(147, 197, 253, 0.8)';
        ctx.shadowBlur = star.radius > 1 ? 4 : 0;
        ctx.fill();
      }
      ctx.shadowBlur = 0; // reset shadow

      // Spawn new comets periodically
      const now = Date.now();
      if (now - lastSpawnTime > Math.random() * 1800 + 1200 && comets.length < 5) {
        spawnComet();
        lastSpawnTime = now;
      }

      // Render Comets
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        // Move comet along vector
        const vx = Math.cos(c.angle) * c.speed;
        const vy = Math.sin(c.angle) * c.speed;

        c.x += vx;
        c.y += vy;

        // Record trail history
        c.trail.push({ x: c.x, y: c.y, opacity: c.opacity });
        if (c.trail.length > 25) {
          c.trail.shift();
        }

        // Draw Comet Glowing Trail
        ctx.save();
        const tailX = c.x - Math.cos(c.angle) * c.length;
        const tailY = c.y - Math.sin(c.angle) * c.length;

        const cometGrad = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
        cometGrad.addColorStop(0, '#FFFFFF'); // Nucleus pure white
        cometGrad.addColorStop(0.15, `${c.color} 0.95)`);
        cometGrad.addColorStop(0.6, `${c.color} 0.4)`);
        cometGrad.addColorStop(1, `${c.color} 0)`);

        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = cometGrad;
        ctx.lineWidth = c.size * 2.2;
        ctx.lineCap = 'round';
        ctx.shadowColor = `${c.color} 0.8)`;
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Draw Blazing Comet Nucleus (Head)
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 18;
        ctx.fill();

        ctx.restore();

        // Discard out-of-screen comets
        if (c.x > width + 200 || c.y > height + 200) {
          comets.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`relative min-h-screen w-full overflow-hidden bg-slate-950 ${className}`}>
      {/* Background Animated Comet Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      />

      {/* Ambient Celestial Nebula Glow Layers */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-[130px] animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full bg-indigo-600/15 blur-[150px]" />
        <div className="absolute -bottom-32 left-1/4 w-[34rem] h-[34rem] rounded-full bg-fuchsia-600/10 blur-[160px]" />
      </div>

      {/* Cinematic Celestial Splash / Intro Look (Shows before user enters) */}
      {!isIntroDismissed && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl transition-opacity duration-500">
          <div className="max-w-md w-full flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-700">
            {/* Pulsing Comet Core Logo */}
            <div className="relative mb-6">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 blur-xl opacity-60 animate-pulse" />
              <div className="relative p-3 rounded-3xl bg-slate-900/90 border border-cyan-500/40 shadow-2xl shadow-cyan-500/30">
                <KyronLogo size="xl" animated={true} />
              </div>
            </div>

            {/* Brand Title with Cosmic Glow */}
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2 flex items-center gap-2">
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                KYRON AI
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-cyan-200/80 font-mono tracking-widest uppercase mb-6 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next-Gen Celestial Autonomous Intelligence</span>
            </p>

            {/* Feature Highlights Pills */}
            <div className="grid grid-cols-3 gap-2.5 w-full mb-8 text-[11px] font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 flex flex-col items-center gap-1">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Hyper-Speed</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 flex flex-col items-center gap-1">
                <Compass className="w-4 h-4 text-purple-400" />
                <span>7 Studios</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 flex flex-col items-center gap-1">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Zero-Retention</span>
              </div>
            </div>

            {/* Loading & Enter Action */}
            <div className="w-full space-y-3">
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500 transition-all duration-100 ease-out"
                  style={{ width: `${introProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                <span>Initializing Celestial Engine...</span>
                <span className="text-cyan-400 font-bold">{introProgress}%</span>
              </div>

              <button
                onClick={() => {
                  setIsIntroDismissed(true);
                  onEnterApp?.();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] mt-2"
              >
                <span>Enter KYRON AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Rendered Above Cosmic Background */}
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
};
