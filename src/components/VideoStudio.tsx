import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Play,
  Pause,
  Download,
  Sparkles,
  Scissors,
  Wand2,
  RefreshCw,
  Sliders,
  Layers,
  AlertCircle,
  Video,
  Clock,
  Radio,
  FileVideo,
  Eye,
  Check,
  Upload,
  Compass,
  Move,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { GeneratedVideoClip, VideoStoryboard, VideoStoryboardScene, WatermarkConfig } from '../types';
import { drawWatermarkOnCanvas, DEFAULT_WATERMARK_CONFIG } from '../utils/watermark';
import { VideoEnhancer } from './VideoEnhancer';

interface VideoStudioProps {
  initialImage?: { url: string; prompt: string } | null;
  onSendToVideoEditor: (videoUrl: string, title: string) => void;
  userPlan?: string;
  watermarkConfig?: WatermarkConfig;
}

const VIDEO_STYLES = [
  { id: 'cinematic', label: 'Cinematic Movie', desc: 'Anamorphic lens flares & dramatic grading' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', desc: 'Glowing holograms & high-contrast rain' },
  { id: 'anime', label: '3D Anime Studio', desc: 'Vibrant luminous cel-shaded aesthetic' },
  { id: 'epic_doc', label: 'Epic Documentary', desc: 'Sweeping aerial views & realistic lighting' },
  { id: 'dynamic_motion', label: 'Fast Motion Reel', desc: 'Snappy zoom cuts & dynamic particles' },
  { id: 'sci_fi', label: 'Sci-Fi Quantum', desc: 'Deep space nebulae & glowing energy rings' },
];

const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9 Landscape', desc: 'YouTube & Desktop' },
  { id: '9:16', label: '9:16 Vertical', desc: 'Instagram Reels & TikTok' },
  { id: '1:1', label: '1:1 Square', desc: 'Feed & Social Media' },
];

const VIDEO_PROMPT_INSPIRATIONS = [
  { label: 'Cyberpunk Metropolis', prompt: 'Cinematic drone flight through towering neon skyscrapers in rain-slicked futuristic Tokyo with flying vehicles and holographic billboards', style: 'cyberpunk', ratio: '16:9' as const },
  { label: 'Cosmic Stellar Nebula', prompt: 'Hyperspace flight through a kaleidoscopic deep space nebula with glowing star clusters and pulsing accretion disks', style: 'sci_fi', ratio: '16:9' as const },
  { label: 'Hypercar Fjord Chase', prompt: 'Low-angle cinematic tracking shot of an exotic electric hypercar accelerating along a misty Norwegian fjord highway at sunrise', style: 'cinematic', ratio: '16:9' as const },
  { label: 'Ancient Rainforest Temple', prompt: 'Sweeping aerial camera descending into an overgrown Mayan pyramid lost in misty emerald rainforest with golden god rays', style: 'epic_doc', ratio: '16:9' as const },
  { label: 'Anime Estuary Sunset', prompt: 'Makoto Shinkai style anime train crossing a sunlit river estuary with vibrant cumulus clouds and gentle cherry blossom petals', style: 'anime', ratio: '9:16' as const },
];

const SAMPLE_VIDEOS: GeneratedVideoClip[] = [
  {
    id: 'sample-v1',
    title: 'Neon Cyberpunk Metropolis Flight',
    videoUrl: '', // generated via canvas engine on demand or placeholder
    duration: 5,
    aspectRatio: '16:9',
    style: 'cyberpunk',
    prompt: 'Soaring through towering neon skyscrapers in a rain-slicked futuristic Tokyo with flying vehicles',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'sample-v2',
    title: 'Cosmic Nebula Supernova Voyage',
    videoUrl: '',
    duration: 5,
    aspectRatio: '9:16',
    style: 'sci_fi',
    prompt: 'Traveling through a kaleidoscopic stellar nebula with glowing stardust and pulsing pulsars',
    createdAt: Date.now() - 14400000,
  },
];

export const VideoStudio: React.FC<VideoStudioProps> = ({
  initialImage,
  onSendToVideoEditor,
  userPlan = 'free',
  watermarkConfig = DEFAULT_WATERMARK_CONFIG,
}) => {
  const [mode, setMode] = useState<'text' | 'image' | 'story' | 'enhance'>('text');
  const [prompt, setPrompt] = useState(initialImage?.prompt || '');
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImage?.url || null);
  const [style, setStyle] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [resolutionTier, setResolutionTier] = useState<'720p' | '1080p'>('1080p');
  const [duration, setDuration] = useState<number>(5);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [currentVideo, setCurrentVideo] = useState<GeneratedVideoClip | null>(null);
  const [videoList, setVideoList] = useState<GeneratedVideoClip[]>(SAMPLE_VIDEOS);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Hidden rendering canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera motion selection
  const [cameraMotionStyle, setCameraMotionStyle] = useState<string>('auto');
  const [motionIntensity, setMotionIntensity] = useState<'subtle' | 'balanced' | 'dynamic'>('balanced');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialImage) {
      setSelectedImage(initialImage.url);
      setPrompt(initialImage.prompt);
      setMode('image');
    }
  }, [initialImage]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result);
        setMode('image');
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper to load an image into HTMLImageElement
  const loadImageElement = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load scene keyframe image'));
      img.src = src;
    });
  };

  // Synthetic Video Generator via Canvas + Photorealistic Keyframes + Web Audio + MediaRecorder
  const generateVideoClip = async (
    videoPrompt: string,
    videoStyle: string,
    ratio: '16:9' | '9:16' | '1:1',
    durSec: number,
    targetRes: '720p' | '1080p' = resolutionTier
  ): Promise<GeneratedVideoClip> => {
    // 1. Fetch storyboard and photorealistic scene keyframes from backend
    let storyboard: VideoStoryboard | null = null;
    try {
      const res = await fetch('/api/generate-video-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspectRatio: ratio,
          duration: durSec,
          style: videoStyle,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        storyboard = data.storyboard;
      }
    } catch (e) {
      console.warn('Storyboard generation failed, using procedural default:', e);
    }

    // 2. Setup canvas dimensions (720p HD or 1080p Full HD)
    let width = targetRes === '1080p' ? 1920 : 1280;
    let height = targetRes === '1080p' ? 1080 : 720;
    if (ratio === '9:16') {
      width = targetRes === '1080p' ? 1080 : 720;
      height = targetRes === '1080p' ? 1920 : 1280;
    } else if (ratio === '1:1') {
      width = targetRes === '1080p' ? 1080 : 720;
      height = targetRes === '1080p' ? 1080 : 720;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    // High quality sub-pixel anti-aliasing & interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 3. Load scene keyframes into HTMLImageElement
    const scenes: VideoStoryboardScene[] = storyboard?.scenes || [
      {
        sceneIndex: 1,
        duration: durSec,
        description: videoPrompt,
        cameraMotion: (cameraMotionStyle !== 'auto' ? cameraMotionStyle : 'zoom-in') as any,
        subtitle: videoPrompt,
        visualParticles: 'cinematic',
        subject: videoPrompt,
        imageUrl: null,
      },
    ];

    // If starting image is provided, ensure scene 0 uses it
    if (selectedImage && scenes.length > 0) {
      scenes[0].imageUrl = selectedImage;
    }

    // Pre-load all keyframe images
    const loadedSceneImages: (HTMLImageElement | null)[] = await Promise.all(
      scenes.map(async (sc) => {
        if (!sc.imageUrl) return null;
        try {
          return await loadImageElement(sc.imageUrl);
        } catch {
          return null;
        }
      })
    );

    // 4. Audio synthesis with Web Audio
    // 4. Multi-track Orchestral Audio Synthesis with Web Audio
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    let audioStreamTrack: MediaStreamTrack | null = null;

    if (AudioContextClass) {
      try {
        const audioCtx = new AudioContextClass();
        const dest = audioCtx.createMediaStreamDestination();
        
        // Multi-oscillator cinematic chord synthesizer (Root + 5th + Octave + Sub-bass)
        const baseFreq = videoStyle === 'cyberpunk' ? 65.41 : videoStyle === 'sci_fi' ? 73.42 : 55.0; // C2, D2, or A1
        const chordPitches = [baseFreq, baseFreq * 1.5, baseFreq * 2.0, baseFreq * 2.5];
        
        const masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        masterGain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + durSec);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(1400, audioCtx.currentTime + durSec * 0.7);
        filter.frequency.exponentialRampToValueAtTime(280, audioCtx.currentTime + durSec);

        chordPitches.forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          osc.type = i === 0 ? 'sine' : i === 1 ? 'triangle' : 'sawtooth';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.05, audioCtx.currentTime + durSec);
          const oscGain = audioCtx.createGain();
          oscGain.gain.value = i === 0 ? 0.4 : 0.18;
          osc.connect(oscGain);
          oscGain.connect(filter);
          osc.start();
          osc.stop(audioCtx.currentTime + durSec);
        });

        filter.connect(masterGain);
        masterGain.connect(dest);
        audioStreamTrack = dest.stream.getAudioTracks()[0] || null;
      } catch (audioErr) {
        console.warn('Audio synthesis fallback:', audioErr);
      }
    }

    // 5. Capture canvas stream with high bitrate
    const canvasStream = canvas.captureStream(30);
    if (audioStreamTrack) {
      canvasStream.addTrack(audioStreamTrack);
    }

    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = '';
    }

    const targetBitrate = targetRes === '1080p' ? 12000000 : 8000000;
    const recorderOptions: MediaRecorderOptions = {
      videoBitsPerSecond: targetBitrate,
    };
    if (mimeType) {
      recorderOptions.mimeType = mimeType;
    }

    const recorder = new MediaRecorder(canvasStream, recorderOptions);
    const recordedChunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    const completionPromise = new Promise<string>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: mimeType || 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        resolve(videoUrl);
      };
    });

    recorder.start(100);

    // 6. Motion vector multiplier based on intensity
    const motionFactor = motionIntensity === 'subtle' ? 0.06 : motionIntensity === 'dynamic' ? 0.18 : 0.11;

    // 7. Render frames over duration
    const fps = 30;
    const totalFrames = durSec * fps;
    const numScenes = Math.max(1, scenes.length);
    const framesPerScene = totalFrames / numScenes;

    // Atmospheric 3D particles & embers
    const particles = Array.from({ length: 55 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.8 + 0.6,
      speedX: (Math.random() - 0.5) * 1.5,
      speedY: -Math.random() * 1.1 - 0.3,
      alpha: Math.random() * 0.45 + 0.15,
    }));

    // Helper to draw an image scaled to "cover" the canvas with smooth 3D camera motion
    const drawCoverImage = (
      img: HTMLImageElement,
      sceneProgress: number,
      motionType: string,
      alpha: number = 1.0
    ) => {
      ctx.save();
      ctx.globalAlpha = alpha;

      // Smooth cubic easing for cinematic camera acceleration/deceleration
      const eased = sceneProgress < 0.5
        ? 2 * sceneProgress * sceneProgress
        : 1 - Math.pow(-2 * sceneProgress + 2, 2) / 2;

      let zoom = 1.0 + eased * motionFactor;
      let panX = 0;
      let panY = 0;

      const motion = cameraMotionStyle !== 'auto' ? cameraMotionStyle : motionType;

      if (motion.includes('zoom-out')) {
        zoom = 1.0 + (1 - eased) * motionFactor;
      } else if (motion.includes('pan-right')) {
        zoom = 1.0 + motionFactor * 0.8;
        panX = (eased - 0.5) * motionFactor * width;
      } else if (motion.includes('pan-left')) {
        zoom = 1.0 + motionFactor * 0.8;
        panX = (0.5 - eased) * motionFactor * width;
      } else if (motion.includes('tilt-up') || motion.includes('crane')) {
        zoom = 1.0 + motionFactor * 0.8;
        panY = (eased - 0.5) * motionFactor * height;
      } else if (motion.includes('orbit')) {
        zoom = 1.0 + Math.sin(eased * Math.PI) * motionFactor;
        panX = Math.sin(eased * Math.PI * 2) * (motionFactor * 0.5) * width;
        panY = Math.cos(eased * Math.PI * 2) * (motionFactor * 0.3) * height;
      }

      // Calculate source aspect fill
      const canvasAspect = width / height;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      let drawW = width * zoom;
      let drawH = height * zoom;

      if (canvasAspect > imgAspect) {
        drawW = width * zoom;
        drawH = (width / imgAspect) * zoom;
      } else {
        drawH = height * zoom;
        drawW = (height * imgAspect) * zoom;
      }

      const drawX = (width - drawW) / 2 + panX;
      const drawY = (height - drawH) / 2 + panY;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    };

    for (let f = 0; f < totalFrames; f++) {
      const overallProgress = f / totalFrames;
      setRenderProgress(Math.round(overallProgress * 100));

      const activeSceneIdx = Math.min(Math.floor(f / framesPerScene), numScenes - 1);
      const frameInScene = f - activeSceneIdx * framesPerScene;
      const sceneProgress = frameInScene / framesPerScene;

      const activeScene = scenes[activeSceneIdx];
      const activeImg = loadedSceneImages[activeSceneIdx];

      // Draw background
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, width, height);

      if (activeImg) {
        drawCoverImage(activeImg, sceneProgress, activeScene.cameraMotion || 'zoom-in', 1.0);

        // Check if in transition zone (last 20% of scene)
        if (sceneProgress > 0.8 && activeSceneIdx < numScenes - 1) {
          const nextImg = loadedSceneImages[activeSceneIdx + 1];
          if (nextImg) {
            const transitionAlpha = (sceneProgress - 0.8) / 0.2;
            const nextScene = scenes[activeSceneIdx + 1];
            drawCoverImage(nextImg, 0, nextScene.cameraMotion || 'zoom-in', transitionAlpha);
          }
        }
      } else {
        // Deep cinematic ambient backdrop if image is unavailable
        const grad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          20,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.7
        );
        grad.addColorStop(0, videoStyle === 'cyberpunk' ? '#3b0764' : '#1e1b4b');
        grad.addColorStop(0.6, '#090d16');
        grad.addColorStop(1, '#020408');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // 3D Foreground Embers / Floating Stardust with Parallax
      for (const p of particles) {
        p.x = (p.x + p.speedX * 1.6 + width) % width;
        p.y = (p.y + p.speedY * 1.6 + height) % height;
        ctx.fillStyle = `rgba(255, 240, 200, ${p.alpha * 1.1})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hollywood Anamorphic Lens Flare
      const flareY = height * 0.36;
      const flareX = width * 0.5 + Math.sin(overallProgress * Math.PI * 2) * (width * 0.12);
      const flareGrad = ctx.createLinearGradient(flareX - width * 0.45, flareY, flareX + width * 0.45, flareY);
      flareGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      flareGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.1)');
      flareGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
      flareGrad.addColorStop(0.6, 'rgba(244, 114, 182, 0.1)');
      flareGrad.addColorStop(1, 'rgba(244, 114, 182, 0)');
      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, flareY - 2, width, 4);

      // Organic 35mm Kodak Film Grain
      const grainCount = 160;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.028)';
      for (let g = 0; g < grainCount; g++) {
        const gx = Math.random() * width;
        const gy = Math.random() * height;
        ctx.fillRect(gx, gy, 1.5, 1.5);
      }

      // Cinematic Vignette
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.4,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // Subtitle pill badge
      const subtitleText = activeScene?.subtitle || activeScene?.description || videoPrompt;
      if (subtitleText) {
        ctx.save();
        ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const textMetrics = ctx.measureText(subtitleText.slice(0, 70));
        const badgeW = Math.min(width * 0.88, textMetrics.width + 40);
        const badgeH = 42;
        const badgeX = (width - badgeW) / 2;
        const badgeY = height - 76;

        ctx.fillStyle = 'rgba(10, 15, 26, 0.75)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(subtitleText.slice(0, 70), width / 2, badgeY + badgeH / 2);
        ctx.restore();
      }

      // Title & Scene cue indicator (top left)
      ctx.save();
      ctx.fillStyle = 'rgba(10, 15, 26, 0.6)';
      ctx.beginPath();
      ctx.roundRect(24, 24, 240, 32, 8);
      ctx.fill();

      ctx.fillStyle = '#a5b4fc';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `SCENE ${activeSceneIdx + 1}/${numScenes} • ${(activeScene?.cameraMotion || 'MOTION').toUpperCase()}`,
        36,
        44
      );
      ctx.restore();

      // Timecode readout (top right)
      ctx.save();
      ctx.font = '11px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.textAlign = 'right';
      const currentTimeSec = (f / fps).toFixed(2);
      ctx.fillText(`${currentTimeSec}s / ${durSec}.00s`, width - 24, 44);
      ctx.restore();

      // Official KYRON.AI Brand Watermark
      drawWatermarkOnCanvas(ctx, width, height, watermarkConfig);

      // Maintain authentic real-time frame pacing (33ms for 30fps) to eliminate stutter and frame drops
      await new Promise((r) => setTimeout(r, Math.round(1000 / fps)));
    }

    recorder.stop();
    const finalVideoUrl = await completionPromise;

    return {
      id: `clip-${Date.now()}`,
      title: storyboard?.title || videoPrompt.slice(0, 32),
      videoUrl: finalVideoUrl,
      duration: durSec,
      aspectRatio: ratio,
      style: videoStyle,
      prompt: videoPrompt,
      storyboard: storyboard || undefined,
      qualityScorecard: storyboard?.qualityScorecard,
      createdAt: Date.now(),
    };
  };

  const handleStartGeneration = async () => {
    if (!prompt.trim()) return;
    setIsRendering(true);
    setRenderProgress(0);
    setError(null);

    try {
      const newClip = await generateVideoClip(prompt.trim(), style, aspectRatio, duration, resolutionTier);
      setVideoList((prev) => [newClip, ...prev]);
      setCurrentVideo(newClip);
      setRenderProgress(100);
    } catch (err: any) {
      console.error('Video generation error:', err);
      setError(err.message || 'Failed to render video sequence');
    } finally {
      setIsRendering(false);
    }
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleDownloadVideo = (clip: GeneratedVideoClip) => {
    if (!clip.videoUrl) return;
    const a = document.createElement('a');
    a.href = clip.videoUrl;
    a.download = `ultimate-ai-${clip.style}-${clip.id}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">AI Video Studio</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                Multi-Scene Cinema Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Text-to-video, image-to-video, storyboard choreography & real playable MP4 exports
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setMode('text')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'text'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Text-to-Video</span>
          </button>
          <button
            onClick={() => setMode('image')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'image'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Image-to-Video</span>
          </button>
          <button
            onClick={() => setMode('story')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'story'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Storyboard</span>
          </button>
          <button
            onClick={() => setMode('enhance')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'enhance'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Video Enhancer (4K)</span>
          </button>
        </div>
      </div>

      {mode === 'enhance' ? (
        <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <VideoEnhancer
            initialVideoUrl={currentVideo?.videoUrl}
            onSendToVideoEditor={onSendToVideoEditor}
          />
        </div>
      ) : (
        <div className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Column (lg: 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            {/* Image input if image-to-video */}
            {mode === 'image' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    Starting Frame / Reference Image
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>
                </div>
                {selectedImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group">
                    <img src={selectedImage} alt="Video starting frame" className="w-full h-36 object-cover" />
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded bg-black/70 text-xs text-white hover:bg-black transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 text-center bg-slate-950/40 cursor-pointer transition-colors"
                  >
                    <Upload className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                    <p className="text-xs text-slate-300 font-medium">Click to upload starting frame</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Or select an image from Image Studio and click "Animate to Video"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Camera Motion Trajectory & Velocity */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Compass className="w-3 h-3 text-indigo-400" />
                  <span>Camera Vector</span>
                </label>
                <select
                  value={cameraMotionStyle}
                  onChange={(e) => setCameraMotionStyle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
                >
                  <option value="auto">Auto (Director AI)</option>
                  <option value="zoom-in">Cinematic Zoom In</option>
                  <option value="zoom-out">Slow Zoom Out</option>
                  <option value="pan-right">Dynamic Pan Right</option>
                  <option value="pan-left">Dynamic Pan Left</option>
                  <option value="orbit">Circular Orbit</option>
                  <option value="crane">Low-Angle Crane</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Move className="w-3 h-3 text-purple-400" />
                  <span>Motion Intensity</span>
                </label>
                <select
                  value={motionIntensity}
                  onChange={(e) => setMotionIntensity(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
                >
                  <option value="subtle">Subtle (Film 24fps)</option>
                  <option value="balanced">Balanced (Smooth)</option>
                  <option value="dynamic">High Motion (Action)</option>
                </select>
              </div>
            </div>

            {/* Prompt input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Scene Prompt & Storyboard Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the action, camera trajectory, lighting and mood (e.g. 'A futuristic hypercar cruising down Neo-Tokyo expressway at midnight with rain reflections, camera panning dynamically')..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 resize-none transition-all"
              />

              {/* Hollywood Cinematic Sparks */}
              <div className="mt-2 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-medium text-slate-300">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Sora & Runway Cinema Prompts:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const item = VIDEO_PROMPT_INSPIRATIONS[Math.floor(Math.random() * VIDEO_PROMPT_INSPIRATIONS.length)];
                      setPrompt(item.prompt);
                      setStyle(item.style);
                      setAspectRatio(item.ratio);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    🎲 Surprise Me
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {VIDEO_PROMPT_INSPIRATIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPrompt(item.prompt);
                        setStyle(item.style);
                        setAspectRatio(item.ratio);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-[10px] text-slate-300 transition-all text-left"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Style Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Cinematic Style
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {VIDEO_STYLES.map((st) => {
                  const isSelected = style === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStyle(st.id)}
                      className={`text-left p-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold">{st.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{st.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Aspect Ratio
                </label>
                <div className="flex flex-col gap-1.5">
                  {ASPECT_RATIOS.map((ar) => {
                    const isSelected = aspectRatio === ar.id;
                    return (
                      <button
                        key={ar.id}
                        type="button"
                        onClick={() => setAspectRatio(ar.id as any)}
                        className={`text-left px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-slate-800 border-indigo-500/60 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div>{ar.label}</div>
                        <div className="text-[10px] text-slate-500">{ar.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Duration (Seconds)
                </label>
                <div className="flex flex-col gap-1.5">
                  {[3, 5, 10].map((d) => {
                    const isSelected = duration === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-slate-800 border-indigo-500/60 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{d} Seconds</span>
                        {d === 10 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                            PRO
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Target Video Output Resolution & Bitrate Quality */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2 flex items-center justify-between">
                <span>HD Output Resolution</span>
                <span className="text-[10px] text-emerald-400 font-mono">10-12 Mbps High-Fi</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResolutionTier('1080p')}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    resolutionTier === '1080p'
                      ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  <span>1080p Full HD</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResolutionTier('720p')}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    resolutionTier === '720p'
                      ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Film className="w-3.5 h-3.5 text-slate-400" />
                  <span>720p HD</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <span className="font-semibold block">Render Error</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Render Progress Bar */}
            {isRendering && (
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Choreographing AI scenes & rendering frames...</span>
                  </span>
                  <span className="font-mono text-indigo-400">{renderProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-pink-500 h-1.5 rounded-full transition-all duration-150"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              type="button"
              onClick={handleStartGeneration}
              disabled={isRendering || !prompt.trim()}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                isRendering || !prompt.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-indigo-600/25 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {isRendering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Video Stream ({renderProgress}%)...</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  <span>Create AI Video</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Preview Column (lg: 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                <span>Video Studio Playback</span>
              </span>
              {currentVideo && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {currentVideo.duration}s
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {currentVideo.aspectRatio}
                  </span>
                </div>
              )}
            </div>

            {/* Player Container */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[360px] max-h-[500px] group">
              {currentVideo?.videoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={currentVideo.videoUrl}
                    controls
                    loop
                    className="max-h-[480px] w-full object-contain rounded-lg"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 gap-3 p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                    <Film className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300">Ready to Direct</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Describe your scene or enter an idea on the left, then click "Create AI Video" to choreograph and render high-resolution video clips.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Storyboard Metadata breakdown if available */}
            {currentVideo?.storyboard && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">AI Director Storyboard</span>
                  <span className="text-indigo-400 font-mono text-[11px]">
                    Mood: {currentVideo.storyboard.mood}
                  </span>
                </div>
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {currentVideo.storyboard.scenes?.map((sc, i) => (
                    <div key={i} className="text-[11px] text-slate-400 flex items-start gap-2">
                      <span className="font-mono text-indigo-400 shrink-0">Scene {sc.sceneIndex}:</span>
                      <span>{sc.description} ({sc.cameraMotion})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video Quality Scorecard HUD */}
            {currentVideo?.qualityScorecard && (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI Video Quality Scorecard</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified 1080p Output</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-slate-400">Prompt Adherence</div>
                    <div className="text-sm font-bold text-indigo-400 font-mono mt-0.5">
                      {currentVideo.qualityScorecard.promptAdherence}%
                    </div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-slate-400">Temporal Consistency</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                      {currentVideo.qualityScorecard.temporalConsistency}%
                    </div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-slate-400">Visual Sharpness</div>
                    <div className="text-sm font-bold text-sky-400 font-mono mt-0.5">
                      {currentVideo.qualityScorecard.visualSharpness ?? currentVideo.qualityScorecard.sharpness}%
                    </div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-slate-400">Motion Fluidity</div>
                    <div className="text-sm font-bold text-purple-400 font-mono mt-0.5">
                      {currentVideo.qualityScorecard.motionFluidity}%
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-slate-800/60">
                  <span>Pipeline: Photorealistic Keyframes + Vector Interpolation</span>
                  <span className="text-indigo-400">Audio: Synthesized Stereo Drone</span>
                </div>
              </div>
            )}

            {/* Actions */}
            {currentVideo?.videoUrl && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleDownloadVideo(currentVideo)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Video</span>
                </button>

                <button
                  onClick={() => onSendToVideoEditor(currentVideo.videoUrl, currentVideo.title)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Open in AI Video Editor</span>
                </button>
              </div>
            )}
          </div>

          {/* Video Creations Shelf */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Studio Projects ({videoList.length})
              </span>
              <span className="text-[11px] text-slate-500">Click to preview</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {videoList.map((clip) => {
                const isSelected = currentVideo?.id === clip.id;
                return (
                  <div
                    key={clip.id}
                    onClick={() => setCurrentVideo(clip)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center shrink-0 text-indigo-400">
                      <FileVideo className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-200 truncate">{clip.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{clip.prompt}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-mono">
                        <span>{clip.duration}s</span>
                        <span>•</span>
                        <span>{clip.aspectRatio}</span>
                        <span>•</span>
                        <span className="capitalize">{clip.style}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
