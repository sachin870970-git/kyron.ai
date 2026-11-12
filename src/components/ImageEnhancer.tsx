import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Upload,
  Download,
  RefreshCw,
  Sliders,
  Eye,
  Check,
  AlertCircle,
  Film,
  Scissors,
  SplitSquareVertical,
  Wand2,
  ZoomIn,
  Image as ImageIcon,
  Zap,
  ArrowRight,
  ShieldCheck,
  Sun,
  Contrast,
  Gauge,
} from 'lucide-react';
import {
  processImageEnhancement,
  DEFAULT_ENHANCEMENT_OPTIONS,
  ImageEnhancementOptions,
  EnhancementResult,
} from '../utils/image-enhancer';

interface ImageEnhancerProps {
  initialImageUrl?: string | null;
  onSendToVideoStudio?: (imageUrl: string, prompt: string) => void;
  onSendToVideoEditor?: (imageUrl: string) => void;
}

const SAMPLE_IMAGES = [
  {
    label: 'Vintage Sepia Portrait',
    desc: 'Old faded photo with grain & scratches',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=70',
    preset: {
      ...DEFAULT_ENHANCEMENT_OPTIONS,
      upscaleFactor: 2 as const,
      sharpening: 55,
      noiseReduction: 40,
      oldPhotoRestoration: true,
      portraitEnhancement: true,
      contrast: 20,
    },
  },
  {
    label: 'Low-Res Cyberpunk Street',
    desc: 'Night photography with sensor noise',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=70',
    preset: {
      ...DEFAULT_ENHANCEMENT_OPTIONS,
      upscaleFactor: 2 as const,
      sharpening: 50,
      noiseReduction: 60,
      contrast: 25,
      saturation: 20,
      oldPhotoRestoration: false,
    },
  },
  {
    label: 'Soft Focus Landscape',
    desc: 'Misty mountain vista needing deblur',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=70',
    preset: {
      ...DEFAULT_ENHANCEMENT_OPTIONS,
      upscaleFactor: 4 as const,
      sharpening: 60,
      deblur: 45,
      contrast: 15,
      saturation: 15,
      oldPhotoRestoration: false,
    },
  },
];

export const ImageEnhancer: React.FC<ImageEnhancerProps> = ({
  initialImageUrl,
  onSendToVideoStudio,
  onSendToVideoEditor,
}) => {
  const [sourceImage, setSourceImage] = useState<string | null>(initialImageUrl || SAMPLE_IMAGES[0].url);
  const [options, setOptions] = useState<ImageEnhancementOptions>(SAMPLE_IMAGES[0].preset);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Ready');
  const [result, setResult] = useState<EnhancementResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Before & After Split Slider (0 to 100%)
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync if initialImageUrl changes
  useEffect(() => {
    if (initialImageUrl) {
      setSourceImage(initialImageUrl);
      setResult(null);
    }
  }, [initialImageUrl]);

  // Execute processing
  const handleEnhance = async (currentImgUrl = sourceImage, currentOpts = options) => {
    if (!currentImgUrl) return;
    setIsProcessing(true);
    setProgress(5);
    setStage('Initializing enhancement pipeline...');
    setError(null);

    try {
      const res = await processImageEnhancement(
        currentImgUrl,
        currentOpts,
        (p, s) => {
          setProgress(p);
          setStage(s);
        }
      );
      setResult(res);
      setProgress(100);
      setStage('Enhanced successfully');
    } catch (err: any) {
      console.error('Enhancement error:', err);
      setError(err.message || 'Image enhancement failed. Please try a different image.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Run automatically on first mount with initial image
  useEffect(() => {
    if (sourceImage && !result && !isProcessing) {
      handleEnhance(sourceImage, options);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Split slider mouse & touch drag handlers
  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPosition(percent);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingSlider && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSlider) {
      handleMove(e.clientX);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WEBP, etc.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSourceImage(dataUrl);
      setResult(null);
      handleEnhance(dataUrl, options);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!result) return;
    const ext = options.exportFormat === 'image/jpeg' ? 'jpg' : options.exportFormat === 'image/webp' ? 'webp' : 'png';
    const a = document.createElement('a');
    a.href = result.enhancedUrl;
    a.download = `ultimate-ai-enhanced-${Date.now()}.${ext}`;
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Top Description & Upload Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              AI Image Enhancement &amp; Super-Resolution Suite
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              4K Neural Supersampling
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Professional 2x/4x super-resolution, detail recovery, deblurring, noise reduction, and vintage photo restoration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-all shadow-md cursor-pointer group"
          >
            <Upload className="w-3.5 h-3.5 text-rose-400 group-hover:-translate-y-0.5 transition-transform" />
            <span>Upload My Image</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Enhancement Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-5">
            {/* Resolution Upscale Tier */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Super-Resolution Upscaling</span>
                </label>
                <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                  {options.upscaleFactor === 1 ? '1x (Native)' : options.upscaleFactor === 2 ? '2x (Full HD)' : '4x (Ultra 4K UHD)'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { factor: 1 as const, label: '1x Native', sub: 'Filters only' },
                  { factor: 2 as const, label: '2x HD', sub: '2048px Remaster' },
                  { factor: 4 as const, label: '4x 4K UHD', sub: '3840px Master' },
                ].map((tier) => (
                  <button
                    key={tier.factor}
                    type="button"
                    onClick={() => setOptions({ ...options, upscaleFactor: tier.factor })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      options.upscaleFactor === tier.factor
                        ? 'bg-rose-500/15 border-rose-500 text-white shadow-sm shadow-rose-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{tier.label}</div>
                    <div className="text-[10px] text-slate-500">{tier.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Specialized Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-2">
                Specialized AI Restorations
              </label>

              {/* Old Photo Restoration */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Old Photo &amp; Scratch Restoration</div>
                  <div className="text-[11px] text-slate-400">Auto-levels, scratch suppression &amp; vintage tone recovery</div>
                </div>
                <input
                  type="checkbox"
                  checked={options.oldPhotoRestoration}
                  onChange={(e) => setOptions({ ...options, oldPhotoRestoration: e.target.checked })}
                  className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                />
              </label>

              {/* Portrait Skin & Eye Enhancement */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Portrait &amp; Facial Feature Preservation</div>
                  <div className="text-[11px] text-slate-400">Natural skin softening without plastic texture or loss of anatomy</div>
                </div>
                <input
                  type="checkbox"
                  checked={options.portraitEnhancement}
                  onChange={(e) => setOptions({ ...options, portraitEnhancement: e.target.checked })}
                  className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Sliders: Sharpening, Deblur, Noise Reduction */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Detail &amp; Clarity Sliders
              </label>

              {/* Sharpening */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Detail Sharpening (Unsharp Mask)</span>
                  <span className="font-mono text-rose-400">{options.sharpening}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={options.sharpening}
                  onChange={(e) => setOptions({ ...options, sharpening: parseInt(e.target.value) })}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Deblur */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Blur Reduction / Deblur</span>
                  <span className="font-mono text-rose-400">{options.deblur}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={options.deblur}
                  onChange={(e) => setOptions({ ...options, deblur: parseInt(e.target.value) })}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Noise Reduction */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Noise &amp; Grain Reduction</span>
                  <span className="font-mono text-rose-400">{options.noiseReduction}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={options.noiseReduction}
                  onChange={(e) => setOptions({ ...options, noiseReduction: parseInt(e.target.value) })}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Color & Tonal Sliders */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Color Grading &amp; Lighting
              </label>

              {/* Brightness */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Brightness</span>
                  <span className="font-mono text-indigo-400">{options.brightness > 0 ? `+${options.brightness}` : options.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={options.brightness}
                  onChange={(e) => setOptions({ ...options, brightness: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Contrast</span>
                  <span className="font-mono text-indigo-400">{options.contrast > 0 ? `+${options.contrast}` : options.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={options.contrast}
                  onChange={(e) => setOptions({ ...options, contrast: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Color Vibrance / Saturation</span>
                  <span className="font-mono text-indigo-400">{options.saturation > 0 ? `+${options.saturation}` : options.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={options.saturation}
                  onChange={(e) => setOptions({ ...options, saturation: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Export Format & Compression */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Export Compression Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'image/png' as const, label: 'PNG (Lossless)' },
                  { id: 'image/jpeg' as const, label: 'JPG (Standard)' },
                  { id: 'image/webp' as const, label: 'WEBP (Web Opt)' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setOptions({ ...options, exportFormat: fmt.id })}
                    className={`py-2 px-2 text-center rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      options.exportFormat === fmt.id
                        ? 'bg-rose-500/20 border-rose-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button & Progress */}
            {isProcessing && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-rose-300">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                    <span>{stage}</span>
                  </span>
                  <span className="font-mono text-rose-400 font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 h-1.5 rounded-full transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleEnhance(sourceImage, options)}
              disabled={isProcessing || !sourceImage}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${
                isProcessing || !sourceImage
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-rose-600/25 active:scale-[0.99]'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Neural Enhancement...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Re-apply AI Enhancement</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Before & After Split Comparison Viewport (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
            {/* Viewport Top Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <SplitSquareVertical className="w-4 h-4 text-rose-400" />
                <span>Interactive Before &amp; After Comparison</span>
              </span>

              {result && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                    {result.targetWidth}×{result.targetHeight}px
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                    {result.optionsUsed.upscaleFactor}X ENHANCED
                  </span>
                </div>
              )}
            </div>

            {/* Split Comparison Canvas Frame */}
            <div
              ref={containerRef}
              onMouseDown={() => setIsDraggingSlider(true)}
              onMouseUp={() => setIsDraggingSlider(false)}
              onMouseLeave={() => setIsDraggingSlider(false)}
              onMouseMove={handleMouseMove}
              onTouchStart={() => setIsDraggingSlider(true)}
              onTouchEnd={() => setIsDraggingSlider(false)}
              onTouchMove={handleTouchMove}
              className="relative w-full min-h-[420px] max-h-[560px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden select-none cursor-ew-resize flex items-center justify-center"
            >
              {sourceImage ? (
                <>
                  {/* Underneath: Original Image (Before) */}
                  <img
                    src={sourceImage}
                    alt="Original Image"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />

                  {/* Top Layer: Enhanced Image clipped by slider position */}
                  {result && !isHoldingOriginal && (
                    <div
                      className="absolute inset-0 overflow-hidden pointer-events-none"
                      style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                    >
                      <img
                        src={result.enhancedUrl}
                        alt="Enhanced Image"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      />
                    </div>
                  )}

                  {/* Vertical Divider Line with handle */}
                  {result && !isHoldingOriginal && (
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-20 flex items-center justify-center pointer-events-none"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center font-bold text-[10px] border border-slate-300">
                        ◀ ▶
                      </div>
                    </div>
                  )}

                  {/* Labels on both sides */}
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/75 backdrop-blur text-[10px] font-semibold text-slate-300 z-10 pointer-events-none">
                    BEFORE (Original)
                  </div>
                  {result && !isHoldingOriginal && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-rose-600/90 backdrop-blur text-[10px] font-semibold text-white z-10 pointer-events-none">
                      AFTER (AI Enhanced)
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-8 text-slate-500">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs">Upload an image to start enhancement</p>
                </div>
              )}
            </div>

            {/* Quick Helper & Hold-to-view button */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
              <span>Drag the white center divider left or right to compare</span>
              {result && (
                <button
                  type="button"
                  onMouseDown={() => setIsHoldingOriginal(true)}
                  onMouseUp={() => setIsHoldingOriginal(false)}
                  onTouchStart={() => setIsHoldingOriginal(true)}
                  onTouchEnd={() => setIsHoldingOriginal(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  Hold to view Original
                </button>
              )}
            </div>

            {/* Technical Metrics Summary Card */}
            {result && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">Resolution</div>
                    <div className="text-xs font-mono font-bold text-slate-200">
                      {result.originalWidth}×{result.originalHeight} → {result.targetWidth}×{result.targetHeight}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">Scale Factor</div>
                    <div className="text-xs font-mono font-bold text-rose-400">
                      {result.optionsUsed.upscaleFactor}X Supersampling
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">Est. Size</div>
                    <div className="text-xs font-mono font-bold text-slate-200">
                      {result.enhancedSizeEst}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">Processing Time</div>
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      {result.processingTimeMs} ms
                    </div>
                  </div>
                </div>

                {/* Cross-Studio Actions & Download */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    {onSendToVideoStudio && (
                      <button
                        type="button"
                        onClick={() => onSendToVideoStudio(result.enhancedUrl, 'Animate this high-resolution enhanced artwork')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Send to Video Studio</span>
                      </button>
                    )}
                    {onSendToVideoEditor && (
                      <button
                        type="button"
                        onClick={() => onSendToVideoEditor(result.enhancedUrl)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Send to Video Editor</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Enhanced Artwork</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sample Preset Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Or Try with Curated Test Images:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_IMAGES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSourceImage(sample.url);
                    setOptions(sample.preset);
                    handleEnhance(sample.url, sample.preset);
                  }}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer group"
                >
                  <img
                    src={sample.url}
                    alt={sample.label}
                    className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-800 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">{sample.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{sample.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
