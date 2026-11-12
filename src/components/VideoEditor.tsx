import React, { useState, useRef, useEffect } from 'react';
import {
  Scissors,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  Sparkles,
  Download,
  Upload,
  Type,
  Subtitles,
  Sliders,
  Wand2,
  Check,
  RefreshCw,
  AlertCircle,
  FileVideo,
  Layers,
  Crop,
  Palette,
} from 'lucide-react';
import { SubtitleCue, TextOverlay, VideoEditorState } from '../types';

interface VideoEditorProps {
  initialVideoUrl?: string | null;
  initialTitle?: string;
  userPlan?: string;
}

const FILTER_PRESETS: { id: VideoEditorState['filter']; label: string; cssFilter: string }[] = [
  { id: 'none', label: 'Original', cssFilter: 'none' },
  { id: 'cinematic', label: 'Cinematic Movie', cssFilter: 'contrast(1.2) saturate(1.25) brightness(0.95)' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', cssFilter: 'hue-rotate(290deg) contrast(1.3) saturate(1.4)' },
  { id: 'noir', label: 'Film Noir', cssFilter: 'grayscale(1) contrast(1.4) brightness(0.9)' },
  { id: 'vhs', label: 'VHS Glitch', cssFilter: 'contrast(1.2) sepia(0.2) saturate(1.3)' },
  { id: 'vintage', label: 'Warm Vintage', cssFilter: 'sepia(0.4) contrast(1.1) brightness(1.05)' },
  { id: 'matrix', label: 'Matrix Code', cssFilter: 'hue-rotate(90deg) saturate(1.8) contrast(1.2)' },
  { id: 'warm', label: 'Golden Hour', cssFilter: 'sepia(0.25) saturate(1.4) brightness(1.02)' },
];

const ASPECT_RATIO_OPTIONS: { id: VideoEditorState['aspectRatio']; label: string; desc: string }[] = [
  { id: '16:9', label: '16:9 Landscape', desc: 'YouTube & TV' },
  { id: '9:16', label: '9:16 Vertical', desc: 'Reels, TikTok & Shorts' },
  { id: '1:1', label: '1:1 Square', desc: 'Instagram Feed' },
  { id: '4:5', label: '4:5 Portrait', desc: 'Social Carousel' },
];

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export const VideoEditor: React.FC<VideoEditorProps> = ({
  initialVideoUrl,
  initialTitle,
  userPlan = 'free',
}) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(initialVideoUrl || null);
  const [videoTitle, setVideoTitle] = useState<string>(initialTitle || 'Untitled Video Project');
  const [duration, setDuration] = useState<number>(10);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Editor State
  const [editorState, setEditorState] = useState<VideoEditorState>({
    trimStart: 0,
    trimEnd: 10,
    filter: 'none',
    aspectRatio: '16:9',
    playbackSpeed: 1.0,
    volume: 1.0,
    isMuted: false,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    vignette: 0,
    subtitles: [
      { id: 'sub-1', start: 0, end: 3, text: 'Welcome to the Next-Generation AI Studio' },
      { id: 'sub-2', start: 3, end: 7, text: 'Powered by High-Speed Neural Video Models' },
      { id: 'sub-3', start: 7, end: 10, text: 'Create, Edit and Direct in Ultra HD' },
    ],
    textOverlays: [
      {
        id: 'txt-1',
        text: 'AI MASTERCLASS 2026',
        position: 'top',
        color: '#ffffff',
        fontSize: 22,
        start: 0,
        end: 6,
      },
    ],
    tracks: [
      { id: 'tr-v1', type: 'video', title: 'Main Video Track', start: 0, duration: 10, color: '#6366f1' },
      { id: 'tr-a1', type: 'audio', title: 'Cinematic BGM Track', start: 0, duration: 10, volume: 0.8, color: '#10b981' },
      { id: 'tr-s1', type: 'text', title: 'AI Subtitle Track', start: 0, duration: 10, color: '#f59e0b' },
      { id: 'tr-t1', type: 'text', title: 'Title Overlay Track', start: 0, duration: 6, color: '#ec4899' },
    ],
  });

  const [activeEditorTab, setActiveEditorTab] = useState<'timeline' | 'color' | 'audio' | 'captions' | 'ai'>('timeline');
  const [exportQuality, setExportQuality] = useState<'720p' | '1080p' | '4k'>('1080p');

  // AI Assistant input
  const [aiCommand, setAiCommand] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active dynamic filter CSS string with color grading
  const baseFilter = FILTER_PRESETS.find((f) => f.id === editorState.filter)?.cssFilter || 'none';
  const currentCssFilter = `${baseFilter === 'none' ? '' : baseFilter} brightness(${editorState.brightness}%) contrast(${editorState.contrast}%) saturate(${editorState.saturation}%)`.trim();

  // Update video duration once loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 10;
      setDuration(dur);
      setEditorState((prev) => ({
        ...prev,
        trimEnd: prev.trimEnd === 10 || prev.trimEnd > dur ? dur : prev.trimEnd,
      }));
    }
  };

  // Sync playback speed & volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = editorState.playbackSpeed;
      videoRef.current.volume = editorState.isMuted ? 0 : editorState.volume;
    }
  }, [editorState.playbackSpeed, editorState.volume, editorState.isMuted]);

  // Keep playback within trim bounds
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    if (time >= editorState.trimEnd) {
      videoRef.current.currentTime = editorState.trimStart;
      videoRef.current.play();
    }
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      if (videoRef.current.currentTime < editorState.trimStart || videoRef.current.currentTime >= editorState.trimEnd) {
        videoRef.current.currentTime = editorState.trimStart;
      }
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(editorState.trimStart, Math.min(time, editorState.trimEnd));
    setCurrentTime(time);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
    setEditorState((prev) => ({ ...prev, trimStart: 0, trimEnd: 10 }));
  };

  // Execute Natural Language AI Video Edit Command
  const handleRunAiCommand = async (commandToRun?: string) => {
    const cmd = commandToRun || aiCommand;
    if (!cmd.trim()) return;

    setIsAiProcessing(true);
    setAiFeedback(null);

    try {
      const res = await fetch('/api/ai-video-edit-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: cmd.trim(),
          currentVideo: {
            duration,
            aspectRatio: editorState.aspectRatio,
            filter: editorState.filter,
            trimStart: editorState.trimStart,
            trimEnd: editorState.trimEnd,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('AI Assistant request failed');
      }

      const plan = await res.json();

      setEditorState((prev) => {
        const next = { ...prev };
        if (typeof plan.trimStart === 'number') next.trimStart = Math.max(0, plan.trimStart);
        if (typeof plan.trimEnd === 'number') next.trimEnd = Math.min(duration, plan.trimEnd);
        if (plan.filter && FILTER_PRESETS.some((f) => f.id === plan.filter)) next.filter = plan.filter;
        if (plan.aspectRatio && ASPECT_RATIO_OPTIONS.some((a) => a.id === plan.aspectRatio))
          next.aspectRatio = plan.aspectRatio;
        if (typeof plan.playbackSpeed === 'number') next.playbackSpeed = plan.playbackSpeed;

        if (Array.isArray(plan.generatedSubtitles) && plan.generatedSubtitles.length > 0) {
          next.subtitles = plan.generatedSubtitles.map((sub: any, idx: number) => ({
            id: `ai-sub-${Date.now()}-${idx}`,
            start: sub.start ?? idx * 2.5,
            end: sub.end ?? (idx + 1) * 2.5,
            text: sub.text || '',
          }));
        }

        if (plan.textOverlay) {
          next.textOverlays = [
            {
              id: `ai-txt-${Date.now()}`,
              text: plan.textOverlay.text || 'AI Title',
              position: plan.textOverlay.position || 'center',
              color: plan.textOverlay.color || '#ffffff',
              fontSize: 24,
              start: 0,
              end: Math.min(5, duration),
            },
          ];
        }

        return next;
      });

      setAiFeedback(plan.explanation || `Applied: "${cmd}"`);
      setAiCommand('');
    } catch (err: any) {
      console.error('AI Edit Assistant error:', err);
      setAiFeedback(`Error: ${err.message || 'Could not process editing command'}`);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Export Edited Video via HTML5 Canvas + MediaRecorder
  const handleExport = async () => {
    if (!videoRef.current) return;
    setIsExporting(true);
    setExportProgress(0);

    try {
      const v = videoRef.current;
      const exportWidth = editorState.aspectRatio === '9:16' ? 720 : editorState.aspectRatio === '1:1' ? 720 : 1280;
      const exportHeight = editorState.aspectRatio === '9:16' ? 1280 : editorState.aspectRatio === '1:1' ? 720 : 720;

      const canvas = document.createElement('canvas');
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      const stream = canvas.captureStream(30);
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const finishPromise = new Promise<string>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
          resolve(URL.createObjectURL(blob));
        };
      });

      recorder.start(100);

      // Play through the trimmed section while rendering onto canvas
      v.pause();
      v.currentTime = editorState.trimStart;

      const exportDuration = editorState.trimEnd - editorState.trimStart;
      const frameRate = 30;
      const totalFrames = Math.max(1, Math.round(exportDuration * frameRate));

      for (let frame = 0; frame < totalFrames; frame++) {
        const frameTime = editorState.trimStart + (frame / totalFrames) * exportDuration;
        v.currentTime = frameTime;
        await new Promise((r) => setTimeout(r, 20));

        setExportProgress(Math.round((frame / totalFrames) * 100));

        // Draw video frame with active filter
        ctx.filter = currentCssFilter;
        ctx.drawImage(v, 0, 0, exportWidth, exportHeight);
        ctx.filter = 'none';

        // Draw subtitles matching current timestamp
        const activeSub = editorState.subtitles.find(
          (s) => frameTime >= s.start && frameTime <= s.end
        );
        if (activeSub) {
          ctx.font = 'bold 24px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          const textMetrics = ctx.measureText(activeSub.text);
          ctx.fillRect(
            exportWidth / 2 - textMetrics.width / 2 - 14,
            exportHeight * 0.88 - 28,
            textMetrics.width + 28,
            38
          );
          ctx.fillStyle = '#facc15';
          ctx.fillText(activeSub.text, exportWidth / 2, exportHeight * 0.88);
        }

        // Draw text overlays
        for (const ov of editorState.textOverlays) {
          if (frameTime >= ov.start && frameTime <= ov.end) {
            ctx.font = `bold ${ov.fontSize}px system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = ov.color;
            const yPos =
              ov.position === 'top'
                ? exportHeight * 0.15
                : ov.position === 'center'
                ? exportHeight * 0.5
                : exportHeight * 0.8;
            ctx.fillText(ov.text, exportWidth / 2, yPos);
          }
        }
      }

      recorder.stop();
      const finalUrl = await finishPromise;

      const a = document.createElement('a');
      a.href = finalUrl;
      a.download = `${videoTitle.toLowerCase().replace(/\s+/g, '-')}-edited.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setExportProgress(100);
    } catch (err: any) {
      console.error('Export error:', err);
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Find active subtitle and text overlays for current preview frame
  const currentSub = editorState.subtitles.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  );

  const activeOverlays = editorState.textOverlays.filter(
    (ov) => currentTime >= ov.start && currentTime <= ov.end
  );

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 via-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">AI Video Editor Studio</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                Timeline & Multi-Track
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cut, trim, crop, apply cinematic filters, generate Hindi/English subtitles & execute natural language AI edits
            </p>
          </div>
        </div>

        {/* Upload & Export Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Video</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all hover:scale-[1.01]"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting ({exportProgress}%)...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Video Player & Timeline (lg: 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Main Video Viewport */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col">
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[380px] max-h-[500px]">
              {videoSrc ? (
                <div
                  className="relative flex items-center justify-center w-full h-full"
                  style={{
                    aspectRatio:
                      editorState.aspectRatio === '9:16'
                        ? '9/16'
                        : editorState.aspectRatio === '1:1'
                        ? '1/1'
                        : editorState.aspectRatio === '4:5'
                        ? '4/5'
                        : '16/9',
                  }}
                >
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="w-full h-full object-contain rounded-lg transition-all"
                    style={{ filter: currentCssFilter }}
                  />

                  {/* On-screen live subtitles preview */}
                  {currentSub && (
                    <div className="absolute bottom-6 inset-x-4 flex justify-center pointer-events-none">
                      <span className="bg-black/75 backdrop-blur-sm text-yellow-300 px-3.5 py-1 rounded-lg text-sm font-semibold tracking-wide shadow-lg border border-yellow-400/30">
                        {currentSub.text}
                      </span>
                    </div>
                  )}

                  {/* On-screen text overlays */}
                  {activeOverlays.map((ov) => (
                    <div
                      key={ov.id}
                      className={`absolute inset-x-4 flex justify-center pointer-events-none ${
                        ov.position === 'top'
                          ? 'top-6'
                          : ov.position === 'bottom'
                          ? 'bottom-14'
                          : 'top-1/2 -translate-y-1/2'
                      }`}
                    >
                      <span
                        className="font-extrabold tracking-wider px-3 py-1 rounded drop-shadow-md"
                        style={{ color: ov.color, fontSize: `${ov.fontSize}px` }}
                      >
                        {ov.text}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 gap-3 p-8 text-center">
                  <FileVideo className="w-12 h-12 text-slate-600" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300">No Video Loaded</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Upload an MP4/WebM video file above, or click below to load a sample demo clip.
                    </p>
                    <button
                      onClick={() => {
                        setVideoSrc('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
                        setVideoTitle('Cinematic Forest Demo');
                      }}
                      className="mt-3 px-3.5 py-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium hover:bg-indigo-600/50"
                    >
                      Load Sample Demo Clip
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Transport & Timeline Scrubber */}
            <div className="mt-4 flex flex-col gap-3">
              {/* Timeline Track with Trim Markers */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Current: {currentTime.toFixed(2)}s</span>
                  <span className="text-indigo-400 font-semibold">
                    Trimmed: [{editorState.trimStart.toFixed(1)}s - {editorState.trimEnd.toFixed(1)}s]
                  </span>
                  <span>Total: {duration.toFixed(2)}s</span>
                </div>

                <div className="relative w-full h-8 bg-slate-950 rounded-lg border border-slate-800 flex items-center px-2 select-none">
                  {/* Trim active region highlight */}
                  <div
                    className="absolute top-1 bottom-1 bg-indigo-600/25 border-x-2 border-indigo-400 rounded pointer-events-none"
                    style={{
                      left: `${(editorState.trimStart / (duration || 1)) * 100}%`,
                      width: `${((editorState.trimEnd - editorState.trimStart) / (duration || 1)) * 100}%`,
                    }}
                  />

                  {/* Scrubber slider */}
                  <input
                    type="range"
                    min={0}
                    max={duration || 10}
                    step={0.05}
                    value={currentTime}
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer z-10"
                  />
                </div>
              </div>

              {/* Transport Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePlay}
                    className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  <button
                    onClick={() => handleSeek(editorState.trimStart)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                    title="Rewind to start of trim"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Audio Volume */}
                  <button
                    onClick={() => setEditorState((prev) => ({ ...prev, isMuted: !prev.isMuted }))}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    {editorState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  {/* Speed Selector */}
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                    {SPEED_OPTIONS.map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setEditorState((prev) => ({ ...prev, playbackSpeed: spd }))}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                          editorState.playbackSpeed === spd
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trim Start & Trim End Quick Setters */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditorState((prev) => ({ ...prev, trimStart: currentTime }))}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    Set In ({currentTime.toFixed(1)}s)
                  </button>
                  <button
                    onClick={() => setEditorState((prev) => ({ ...prev, trimEnd: currentTime }))}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    Set Out ({currentTime.toFixed(1)}s)
                  </button>
                  <button
                    onClick={() => setEditorState((prev) => ({ ...prev, trimStart: 0, trimEnd: duration }))}
                    className="px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-400 text-xs"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Editing Toolkit & AI Assistant (lg: 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* AI Editing Assistant Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Director & Editor Assistant</h3>
            </div>

            <p className="text-xs text-slate-400">
              Type natural instructions to cut, filter, caption, or reframe your video automatically.
            </p>

            <div className="space-y-2">
              <div className="relative">
                <textarea
                  value={aiCommand}
                  onChange={(e) => setAiCommand(e.target.value)}
                  placeholder="e.g. 'Cut first 3 seconds and add cinematic filter', 'Generate Hindi subtitles', or 'Reframe for TikTok reels 9:16'..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60 resize-none transition-all"
                />
              </div>

              {/* Quick AI Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Remove first 2 seconds',
                  'Reframe for Instagram Reels (9:16)',
                  'Add cinematic movie filter',
                  'Generate Hindi captions',
                  'Speed up to 1.5x',
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleRunAiCommand(sug)}
                    className="px-2 py-1 rounded-md bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {aiFeedback && (
                <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-800/60 text-xs text-purple-300 flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                  <span>{aiFeedback}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleRunAiCommand()}
                disabled={isAiProcessing || !aiCommand.trim()}
                className={`w-full py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                  isAiProcessing || !aiCommand.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/25'
                }`}
              >
                {isAiProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing & applying edits...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Execute AI Command</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Video Reframing & Aspect Ratio */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Crop className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Smart Reframing</h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ASPECT_RATIO_OPTIONS.map((ar) => {
                const isSelected = editorState.aspectRatio === ar.id;
                return (
                  <button
                    key={ar.id}
                    onClick={() => setEditorState((prev) => ({ ...prev, aspectRatio: ar.id }))}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 text-white ring-1 ring-indigo-500/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-semibold">{ar.label}</div>
                    <div className="text-[10px] text-slate-500">{ar.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Correction & Post-Processing Sliders */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Color Correction</h3>
              </div>
              <button
                onClick={() => setEditorState((prev) => ({ ...prev, brightness: 100, contrast: 100, saturation: 100 }))}
                className="text-[10px] text-slate-400 hover:text-white"
              >
                Reset
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Brightness</span>
                  <span className="font-mono text-white">{editorState.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={editorState.brightness}
                  onChange={(e) => setEditorState((prev) => ({ ...prev, brightness: Number(e.target.value) }))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Contrast</span>
                  <span className="font-mono text-white">{editorState.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={editorState.contrast}
                  onChange={(e) => setEditorState((prev) => ({ ...prev, contrast: Number(e.target.value) }))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Saturation</span>
                  <span className="font-mono text-white">{editorState.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={editorState.saturation}
                  onChange={(e) => setEditorState((prev) => ({ ...prev, saturation: Number(e.target.value) }))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Visual Color Grading Filters */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visual Filters & LUTs</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {FILTER_PRESETS.map((fp) => {
                const isSelected = editorState.filter === fp.id;
                return (
                  <button
                    key={fp.id}
                    onClick={() => setEditorState((prev) => ({ ...prev, filter: fp.id }))}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-500 text-white ring-1 ring-rose-500/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-semibold">{fp.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto Subtitles & Captions Track */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Subtitles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Subtitles ({editorState.subtitles.length})</h3>
              </div>
              <button
                onClick={() =>
                  setEditorState((prev) => ({
                    ...prev,
                    subtitles: [
                      ...prev.subtitles,
                      {
                        id: `sub-${Date.now()}`,
                        start: currentTime,
                        end: Math.min(duration, currentTime + 3),
                        text: 'New Subtitle Cue',
                      },
                    ],
                  }))
                }
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                + Add Cue
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {editorState.subtitles.map((sub, idx) => (
                <div key={sub.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 w-14 shrink-0">
                    {sub.start.toFixed(1)}s - {sub.end.toFixed(1)}s
                  </span>
                  <input
                    type="text"
                    value={sub.text}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditorState((prev) => ({
                        ...prev,
                        subtitles: prev.subtitles.map((s) => (s.id === sub.id ? { ...s, text: val } : s)),
                      }));
                    }}
                    className="flex-1 bg-transparent border-0 text-xs text-slate-200 focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      setEditorState((prev) => ({
                        ...prev,
                        subtitles: prev.subtitles.filter((s) => s.id !== sub.id),
                      }))
                    }
                    className="text-slate-500 hover:text-red-400 text-xs px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
