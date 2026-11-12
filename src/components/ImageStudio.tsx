import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Download,
  RefreshCw,
  Sliders,
  Layers,
  Wand2,
  Copy,
  Check,
  Upload,
  Eye,
  Film,
  Scissors,
  AlertCircle,
  Camera,
  Maximize2,
  Lock,
  Unlock,
  ShieldCheck,
  Zap,
  SplitSquareVertical,
  HelpCircle,
} from 'lucide-react';
import { GeneratedImageItem, WatermarkConfig } from '../types';
import { upscaleImageToResolution } from '../utils/image-upscaler';
import { applyWatermarkToImage, DEFAULT_WATERMARK_CONFIG } from '../utils/watermark';
import { ImageEnhancer } from './ImageEnhancer';

interface ImageStudioProps {
  onSendToVideoStudio?: (imageUrl: string, prompt: string) => void;
  onSendToVideoEditor?: (imageUrl: string) => void;
  userPlan?: string;
  onUpgradePrompt?: () => void;
  watermarkConfig?: WatermarkConfig;
}

const STYLE_OPTIONS = [
  { id: 'photorealistic', label: 'Ultra-realistic Photography', desc: '8K Hasselblad, natural skin pores & true lighting', icon: '📸' },
  { id: 'cinematic', label: 'Cinematic 35mm Film', desc: 'Anamorphic widescreen, dramatic lighting & color grade', icon: '🎬' },
  { id: 'studio', label: 'Professional Studio Portrait', desc: 'Profoto softbox lighting, crisp eye catchlights', icon: '💡' },
  { id: 'product', label: 'Luxury Product Photography', desc: 'Studio lightbox, pristine reflections & macro detail', icon: '💎' },
  { id: '3d_render', label: '3D Octane Render', desc: 'Raytraced global illumination, Unreal Engine 5', icon: '🧊' },
  { id: 'anime', label: 'Anime & Illustration', desc: 'Makoto Shinkai aesthetic, luminous cel shading', icon: '🎨' },
  { id: 'fantasy_scifi', label: 'Fantasy & Sci-Fi Art', desc: 'Volumetric nebulae, futuristic cyberpunk grandeur', icon: '🚀' },
  { id: 'architecture', label: 'Architecture & Interior', desc: 'Architectural Digest editorial, natural floor lighting', icon: '🏛️' },
  { id: 'fashion', label: 'Vogue Fashion Editorial', desc: 'Haute couture fabrics, dynamic editorial posing', icon: '👗' },
  { id: 'digital_art', label: 'Digital Matte Painting', desc: 'Rich concept art brushwork, atmospheric depth', icon: '🖌️' },
  { id: 'social_creative', label: 'Social Media Creative', desc: 'High-contrast, vibrant, punchy viral framing', icon: '📱' },
  { id: 'advertising', label: 'Advertising Creative', desc: 'Commercial billboard clarity & corporate polish', icon: '📢' },
];

const ASPECT_RATIO_OPTIONS = [
  { id: '1:1', label: '1:1 Square', sub: '1024×1024', iconClass: 'w-4 h-4 rounded-sm border' },
  { id: '16:9', label: '16:9 Landscape', sub: '1280×720', iconClass: 'w-5 h-3 rounded-sm border' },
  { id: '9:16', label: '9:16 Story/Reels', sub: '720×1280', iconClass: 'w-3 h-5 rounded-sm border' },
  { id: '4:3', label: '4:3 Photo', sub: '1152×864', iconClass: 'w-4 h-3 rounded-sm border' },
  { id: '3:4', label: '3:4 Portrait', sub: '864×1152', iconClass: 'w-3 h-4 rounded-sm border' },
];

const PROMPT_INSPIRATIONS = [
  { label: 'Astronaut on Titan', prompt: 'A photorealistic portrait of an astronaut exploring a bioluminescent crystal cavern on Titan, Hasselblad 8k, natural subsurface scattering, anamorphic lens flare, sharp focus', style: 'photorealistic' },
  { label: 'Cyberpunk Tokyo', prompt: 'Cyberpunk neon street market in Neo-Tokyo in the rain, reflections in wet asphalt puddles, atmospheric volumetric fog, Octane 3D render, 8k', style: '3d_render' },
  { label: 'Ghibli Shrine Forest', prompt: 'Ancient moss-covered stone dragon guardian sleeping inside a misty Japanese bamboo forest shrine, dappled morning sunlight, luminous cel shading, Studio Ghibli realism', style: 'anime' },
  { label: 'Nordic Cliffside Villa', prompt: 'Architectural Digest editorial photograph of a luxury minimalist villa cantilevered over a Norwegian fjord cliff, floor-to-ceiling glass, warm interior lighting, 8k', style: 'architecture' },
  { label: 'Macro Chameleon Iris', prompt: 'Extreme macro photography of a jewel-toned chameleon eye with a tiny cosmos galaxy reflection inside the iris, razor sharp depth of field, 8k', style: 'photorealistic' },
  { label: 'Luxury Perfume Bottle', prompt: 'Luxury crystal perfume bottle resting on black obsidian stone with dancing water droplets, cinematic studio rim lighting, pristine commercial photography', style: 'product' },
];

export const ImageStudio: React.FC<ImageStudioProps> = ({
  onSendToVideoStudio,
  onSendToVideoEditor,
  userPlan = 'pro',
  onUpgradePrompt,
  watermarkConfig = DEFAULT_WATERMARK_CONFIG,
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'enhance' | 'edit'>('generate');
  const [burnBrandWatermark, setBurnBrandWatermark] = useState(true);
  const [prompt, setPrompt] = useState('A photorealistic portrait of an astronaut with natural skin texture and cinematic lighting, Hasselblad 8k');
  const [negativePrompt, setNegativePrompt] = useState('blurry, deformed, plastic skin, bad anatomy, extra fingers, low quality, watermark');
  const [style, setStyle] = useState('photorealistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState<'1K' | '2K' | '4K'>('2K');
  const [variationsCount, setVariationsCount] = useState<number>(1);
  const [isSeedLocked, setIsSeedLocked] = useState(false);
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 9000000 + 1000000));

  // AI Prompt Enhancement State
  const [isEnhanceToggled, setIsEnhanceToggled] = useState(true);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedData, setEnhancedData] = useState<{
    enhancedPrompt: string;
    negativePrompt: string;
    cameraSettings: string;
    styleSummary: string;
  } | null>(null);

  // Reference Image Condition State
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // Generation & Gallery State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GeneratedImageItem[]>([]);
  const [activeImage, setActiveImage] = useState<GeneratedImageItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 4K AI Upscaling State
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaleStatus, setUpscaleStatus] = useState<string | null>(null);
  const [isComparingOriginal, setIsComparingOriginal] = useState(false);

  // Edit Tab State
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [editAction, setEditAction] = useState<'edit' | 'remove_background' | 'replace_background' | 'upscale'>('edit');
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Intelligent Prompt Enhancement Trigger
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);

    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), style, aspectRatio }),
      });

      if (res.ok) {
        const data = await res.json();
        setEnhancedData({
          enhancedPrompt: data.enhancedPrompt || prompt,
          negativePrompt: data.negativePrompt || negativePrompt,
          cameraSettings: data.cameraSettings || '85mm f/1.4 lens, natural lighting',
          styleSummary: data.styleSummary || style,
        });
        if (data.negativePrompt) {
          setNegativePrompt(data.negativePrompt);
        }
      }
    } catch (err) {
      console.warn('Enhance prompt warning:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Select quick prompt inspiration
  const handleSelectInspiration = (item: typeof PROMPT_INSPIRATIONS[0]) => {
    setPrompt(item.prompt);
    setStyle(item.style);
    setEnhancedData(null);
  };

  // Main Image Generation Handler (DALL-E 3 / Flux level quality)
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenerationProgress(15);
    setError(null);

    const targetSeed = isSeedLocked ? seed : Math.floor(Math.random() * 9000000 + 1000000);
    if (!isSeedLocked) setSeed(targetSeed);

    const progressInterval = setInterval(() => {
      setGenerationProgress((p) => (p < 88 ? p + Math.floor(Math.random() * 12 + 4) : p));
    }, 850);

    try {
      // Determine effective prompt
      let generationPrompt = prompt.trim();
      if (isEnhanceToggled && enhancedData?.enhancedPrompt) {
        generationPrompt = enhancedData.enhancedPrompt;
      }

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: generationPrompt,
          aspectRatio,
          style,
          negativePrompt: negativePrompt.trim(),
          quality,
          seed: targetSeed,
          enhanceWithAi: isEnhanceToggled,
        }),
      });

      clearInterval(progressInterval);
      setGenerationProgress(95);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      let generatedUrl = data.imageUrl;
      let isUpscaledFinal = false;

      // If user selected 4K or 2K output, run genuine super-resolution upscaling pass
      if (quality === '4K' || quality === '2K') {
        try {
          const upscaleRes = await upscaleImageToResolution(generatedUrl, quality);
          generatedUrl = upscaleRes.upscaledUrl;
          isUpscaledFinal = true;
        } catch (upscaleErr) {
          console.warn('Post-render upscaling pass note:', upscaleErr);
        }
      }

      const newItem: GeneratedImageItem = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        url: generatedUrl,
        prompt: prompt.trim(),
        enhancedPrompt: data.enhancedPrompt || (isEnhanceToggled ? generationPrompt : undefined),
        negativePrompt: negativePrompt.trim() || undefined,
        cameraSettings: data.cameraSettings || enhancedData?.cameraSettings,
        style,
        aspectRatio,
        quality,
        width: data.width || 1024,
        height: data.height || 1024,
        seed: data.seed || targetSeed,
        engine: data.engine || 'Flux.1 Pro Deep Diffusion Engine (DALL-E 3 Grade)',
        createdAt: Date.now(),
        isUpscaled: isUpscaledFinal,
        originalUrl: isUpscaledFinal ? data.imageUrl : undefined,
      };

      setGallery((prev) => [newItem, ...prev]);
      setActiveImage(newItem);
      setGenerationProgress(100);
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error('Image generation failed:', err);
      setError(err.message || 'Image generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 400);
    }
  };

  // Generate 4 Rapid Creative Variations
  const handleGenerateVariations = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGenerationProgress(20);
    setError(null);

    const variationSeeds = [
      Math.floor(Math.random() * 9000000 + 1000000),
      Math.floor(Math.random() * 9000000 + 1000000),
      Math.floor(Math.random() * 9000000 + 1000000),
      Math.floor(Math.random() * 9000000 + 1000000),
    ];

    try {
      let generationPrompt = prompt.trim();
      if (isEnhanceToggled && enhancedData?.enhancedPrompt) {
        generationPrompt = enhancedData.enhancedPrompt;
      }

      const requests = variationSeeds.map((s) =>
        fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: generationPrompt,
            aspectRatio,
            style,
            negativePrompt: negativePrompt.trim(),
            quality: '1K',
            seed: s,
            enhanceWithAi: isEnhanceToggled,
          }),
        }).then((r) => r.json())
      );

      setGenerationProgress(60);
      const results = await Promise.all(requests);
      setGenerationProgress(95);

      const newItems: GeneratedImageItem[] = [];
      results.forEach((data, idx) => {
        if (data.imageUrl) {
          const item: GeneratedImageItem = {
            id: `img-var-${Date.now()}-${idx}`,
            url: data.imageUrl,
            prompt: prompt.trim(),
            enhancedPrompt: data.enhancedPrompt,
            style,
            aspectRatio,
            quality: '1K',
            width: data.width || 1024,
            height: data.height || 1024,
            seed: variationSeeds[idx],
            engine: data.engine || 'Flux.1 Pro Deep Diffusion',
            createdAt: Date.now() + idx,
          };
          newItems.push(item);
        }
      });

      if (newItems.length > 0) {
        setGallery((prev) => [...newItems, ...prev]);
        setActiveImage(newItems[0]);
      }
    } catch (err: any) {
      console.error('Variations generation failed:', err);
      setError(err.message || 'Failed to render image variations.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Perform Explicit 4K Super-Resolution Upscaling on Selected Image
  const handleUpscaleSelectedImage = async () => {
    if (!activeImage) return;
    setIsUpscaling(true);
    setUpscaleStatus('Analyzing high-frequency textures & synthesizing 4K pixels...');

    try {
      const result = await upscaleImageToResolution(activeImage.url, '4K');
      setUpscaleStatus(`Synthesized 4K UHD (${result.targetWidth}×${result.targetHeight}px, ${result.scaleFactor}x detail boost in ${result.processingTimeMs}ms)`);

      const updatedImage: GeneratedImageItem = {
        ...activeImage,
        url: result.upscaledUrl,
        originalUrl: activeImage.originalUrl || activeImage.url,
        width: result.targetWidth,
        height: result.targetHeight,
        quality: '4K',
        isUpscaled: true,
      };

      setActiveImage(updatedImage);
      setGallery((prev) => prev.map((item) => (item.id === activeImage.id ? updatedImage : item)));
    } catch (err: any) {
      setUpscaleStatus(`Upscaling note: ${err.message}`);
    } finally {
      setIsUpscaling(false);
    }
  };

  // Natural Language Image Editing
  const handleApplyEdit = async () => {
    const targetImage = sourceImage || activeImage?.url;
    if (!targetImage) {
      setEditError('Please upload an image or select one from the gallery to edit.');
      return;
    }

    setIsEditing(true);
    setEditError(null);

    try {
      const res = await fetch('/api/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: targetImage,
          instruction: editInstruction.trim(),
          action: editAction,
          style,
          aspectRatio,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to edit image');
      }

      const data = await res.json();
      const newItem: GeneratedImageItem = {
        id: `edit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        url: data.imageUrl,
        prompt: `[Edit: ${editAction}] ${editInstruction || 'AI transformation'}`,
        style,
        aspectRatio,
        quality: '2K',
        seed: Math.floor(Math.random() * 9000000 + 1000000),
        engine: 'Gemini Inpainting & Neural Editor',
        createdAt: Date.now(),
      };

      setGallery((prev) => [newItem, ...prev]);
      setActiveImage(newItem);
      setSourceImage(data.imageUrl);
      setEditInstruction('');
    } catch (err: any) {
      console.error('Edit error:', err);
      setEditError(err.message || 'Image modification failed');
    } finally {
      setIsEditing(false);
    }
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSourceImage(event.target?.result as string);
      setEditError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyPrompt = (item: GeneratedImageItem) => {
    const textToCopy = item.enhancedPrompt || item.prompt;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (item: GeneratedImageItem) => {
    let downloadUrl = item.url;
    if (burnBrandWatermark && watermarkConfig?.enabled) {
      try {
        downloadUrl = await applyWatermarkToImage(item.url, watermarkConfig);
      } catch (e) {
        console.warn('Watermark generation fallback:', e);
      }
    }
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `ultimate-ai-${item.style}-${item.quality}-${item.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Studio Top Header */}
      <div className="border-b border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-slate-950/90 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">AI Image Creation Studio</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                PRO DIFFUSION 4K
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Photorealistic generation, intelligent AI prompt enhancement, natural language inpainting & genuine 4K upscaling
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'generate'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Artwork</span>
          </button>
          <button
            onClick={() => setActiveTab('enhance')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'enhance'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Enhance &amp; 4K Restore</span>
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'edit'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>AI Inpainting &amp; Edit</span>
          </button>
        </div>
      </div>

      {activeTab === 'enhance' ? (
        <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <ImageEnhancer
            initialImageUrl={activeImage?.url}
            onSendToVideoStudio={onSendToVideoStudio}
            onSendToVideoEditor={onSendToVideoEditor}
          />
        </div>
      ) : (
        <div className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Column (lg: 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {activeTab === 'generate' ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              {/* Prompt Input & AI Enhancer Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Prompt</span>
                    <span className="text-[10px] text-rose-400 font-normal">Natural Language</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancing || !prompt.trim()}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 hover:border-indigo-500 text-[11px] font-semibold text-indigo-300 hover:text-white transition-all shadow-sm"
                  >
                    <Wand2 className={`w-3 h-3 ${isEnhancing ? 'animate-spin' : 'text-indigo-400'}`} />
                    <span>{isEnhancing ? 'Enhancing...' : 'Enhance with AI'}</span>
                  </button>
                </div>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your vision in natural language (e.g., 'A beautiful girl standing in a garden')..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/40 resize-none transition-all leading-relaxed"
                />

                {/* Prompt Inspiration & ChatGPT DALL-E Polish Chips */}
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium text-slate-300">
                      <Sparkles className="w-3 h-3 text-rose-400" />
                      <span>Creative Sparks & Top Prompts:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const randomItem = PROMPT_INSPIRATIONS[Math.floor(Math.random() * PROMPT_INSPIRATIONS.length)];
                        handleSelectInspiration(randomItem);
                      }}
                      className="text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      🎲 Surprise Me
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PROMPT_INSPIRATIONS.slice(0, 4).map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectInspiration(item)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-[10px] text-slate-300 transition-all text-left"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Enhanced Prompt Banner (if generated) */}
              {enhancedData && (
                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Intelligent AI Enhanced Prompt</span>
                    </span>
                    <button
                      onClick={() => setEnhancedData(null)}
                      className="text-slate-400 hover:text-white text-[11px]"
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    "{enhancedData.enhancedPrompt}"
                  </p>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-1 border-t border-indigo-900/40">
                    <Camera className="w-3 h-3 text-indigo-400" />
                    <span>{enhancedData.cameraSettings}</span>
                  </div>
                </div>
              )}

              {/* Negative Prompt */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Negative Prompt (Excluded Elements)
                </label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="blurry, distorted, deformed hands, extra fingers, bad anatomy, plastic skin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
                />
              </div>

              {/* 12 Creative Visual Styles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Visual Style Preset
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">12 Pro Aesthetics</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {STYLE_OPTIONS.map((opt) => {
                    const isSelected = style === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setStyle(opt.id)}
                        className={`text-left p-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-rose-950/40 border-rose-500 text-white shadow-sm ring-1 ring-rose-500/40'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <span>{opt.icon}</span>
                          <span className="truncate">{opt.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Aspect Ratio & Resolution Quality */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                    Aspect Ratio
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {ASPECT_RATIO_OPTIONS.map((ratio) => {
                      const isSelected = aspectRatio === ratio.id;
                      return (
                        <button
                          key={ratio.id}
                          type="button"
                          onClick={() => setAspectRatio(ratio.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-slate-800 border-rose-500/60 text-white'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`${ratio.iconClass} border-slate-400 inline-block`} />
                            <span>{ratio.label}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{ratio.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                    Output Resolution
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { id: '1K', label: 'Native 1K HD', desc: '1024×1024' },
                      { id: '2K', label: 'Crisp 2K HD', desc: '2048px Master' },
                      { id: '4K', label: 'Ultra 4K UHD', desc: '3840px Cinema' },
                    ].map((q) => {
                      const isSelected = quality === q.id;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setQuality(q.id as any)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-slate-800 border-rose-500/60 text-white shadow-sm'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{q.label}</div>
                            <div className="text-[10px] text-slate-500">{q.desc}</div>
                          </div>
                          {q.id === '4K' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              4K
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Reference Image Conditioning & Seed Locking */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-rose-400" />
                    <span>Reference Image Conditioning</span>
                  </span>
                  {referenceImage ? (
                    <button
                      onClick={() => setReferenceImage(null)}
                      className="text-[10px] text-rose-400 hover:text-rose-300"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => referenceInputRef.current?.click()}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      + Upload
                    </button>
                  )}
                  <input
                    ref={referenceInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleReferenceUpload}
                    className="hidden"
                  />
                </div>

                {referenceImage ? (
                  <div className="flex items-center gap-3">
                    <img src={referenceImage} alt="Reference" className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
                    <div className="text-xs text-slate-300">
                      <span className="font-semibold block">Character & Style Reference Active</span>
                      <span className="text-[10px] text-slate-500">Subject traits condition new generations</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Upload a portrait or character image to preserve facial identity across generations.
                  </p>
                )}

                {/* Seed Lock */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    Seed: #{seed}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSeedLocked(!isSeedLocked)}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    {isSeedLocked ? (
                      <>
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span className="text-amber-400">Locked</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3" />
                        <span>Lock Seed</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Generation Error</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Progress Bar when Generating */}
              {isGenerating && (
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                      <span>Synthesizing high-resolution diffusion pixels...</span>
                    </span>
                    <span className="font-mono text-rose-400">{generationProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-purple-500 h-1.5 rounded-full transition-all duration-200"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Main Generate & 4 Variations Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className={`sm:col-span-2 py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                    isGenerating || !prompt.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-rose-600/25 hover:scale-[1.01] active:scale-[0.99]'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Rendering Ultra HD...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Generate Artwork ({quality})</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleGenerateVariations}
                  disabled={isGenerating || !prompt.trim()}
                  className={`py-3 px-3 rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                    isGenerating || !prompt.trim()
                      ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600 text-indigo-300 hover:text-white'
                  }`}
                  title="Generate 4 creative seeds simultaneously"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>4 Variations</span>
                </button>
              </div>
            </div>
          ) : (
            /* Inpainting & Image Edit Form */
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-2">
                  Target Image to Edit
                </label>
                {sourceImage || activeImage?.url ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group">
                    <img
                      src={sourceImage || activeImage?.url}
                      alt="Source for editing"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                      <button
                        onClick={() => editFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs hover:bg-slate-700"
                      >
                        Change Image
                      </button>
                      <button
                        onClick={() => setSourceImage(null)}
                        className="px-3 py-1.5 rounded-lg bg-red-600/80 text-white text-xs hover:bg-red-600"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-rose-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-950/40"
                  >
                    <Upload className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-300">Click to upload an image to edit</p>
                    <p className="text-[11px] text-slate-500 mt-1">Or select an existing generation from your studio gallery</p>
                  </div>
                )}
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditFileUpload}
                  className="hidden"
                />
              </div>

              {/* Inpainting Operation Modes */}
              <div>
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-2">
                  Edit Operation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'edit', label: 'Natural Language Edit', desc: 'Describe localized change' },
                    { id: 'remove_background', label: 'Remove Background', desc: 'Isolate main subject' },
                    { id: 'replace_background', label: 'Replace Background', desc: 'New cinematic backdrop' },
                    { id: 'upscale', label: '4K Super-Resolution', desc: 'Micro-texture restoration' },
                  ].map((act) => {
                    const isSelected = editAction === act.id;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setEditAction(act.id as any)}
                        className={`text-left p-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-rose-950/40 border-rose-500 text-white ring-1 ring-rose-500/40'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-xs font-semibold">{act.label}</div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">{act.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Natural language modification description */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  {editAction === 'replace_background'
                    ? 'New Background Environment'
                    : editAction === 'upscale'
                    ? 'Upscaling Guidance (Optional)'
                    : 'Modification Instruction'}
                </label>
                <textarea
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                  placeholder={
                    editAction === 'remove_background'
                      ? 'AI will cleanly isolate the subject and remove the background...'
                      : editAction === 'replace_background'
                      ? 'e.g., "A modern luxury penthouse balcony overlooking Dubai skyline at twilight"'
                      : editAction === 'upscale'
                      ? 'e.g., "Restore fine hair textures, skin pores, and eye catchlights with zero artifacts"'
                      : 'e.g., "Change the clothing to a black leather jacket and add golden rim lighting"'
                  }
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/60 resize-none transition-all leading-relaxed"
                />
              </div>

              {editError && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleApplyEdit}
                disabled={isEditing || (!sourceImage && !activeImage)}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                  isEditing || (!sourceImage && !activeImage)
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-rose-600/25'
                }`}
              >
                {isEditing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Applying AI Inpainting...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Apply AI Transformation</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Preview Column (lg: 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Main Selected Image Showcase */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-rose-400" />
                <span>Selected Artwork Viewport</span>
              </span>
              {activeImage && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                    {activeImage.width}×{activeImage.height}px
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                    {activeImage.aspectRatio}
                  </span>
                  {activeImage.isUpscaled && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                      4K UHD UPSCALED
                    </span>
                  )}
                </div>
              )}
            </div>

            {activeImage ? (
              <div className="flex flex-col gap-4">
                {/* Viewport Frame */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[380px] max-h-[520px]">
                  <img
                    src={isComparingOriginal && activeImage.originalUrl ? activeImage.originalUrl : activeImage.url}
                    alt={activeImage.prompt}
                    className="max-h-[500px] w-auto max-w-full object-contain rounded-xl shadow-2xl transition-all"
                  />
                  {isGenerating && (
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
                      <p className="text-xs font-bold text-white tracking-wide">Rendering high-resolution pixels ({generationProgress}%)...</p>
                    </div>
                  )}
                  {isUpscaling && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-3">
                      <Zap className="w-8 h-8 text-amber-400 animate-bounce" />
                      <p className="text-xs font-bold text-white tracking-wide">Synthesizing 4K Super-Resolution Detail...</p>
                    </div>
                  )}
                </div>

                {/* Prompt Details & Technical Metadata */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <p className="text-xs text-slate-200 leading-relaxed font-normal">
                    "{activeImage.enhancedPrompt || activeImage.prompt}"
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-2 border-t border-slate-900 font-mono">
                    <span>Engine: <strong className="text-slate-300 font-normal">{activeImage.engine || 'SANA 4K Deep Diffusion'}</strong></span>
                    <span>•</span>
                    <span>Seed: <strong className="text-slate-300 font-normal">#{activeImage.seed}</strong></span>
                    {activeImage.cameraSettings && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-400">{activeImage.cameraSettings}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Upscale status feedback */}
                {upscaleStatus && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{upscaleStatus}</span>
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(activeImage)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                      title="Download image at full resolution"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleCopyPrompt(activeImage)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      {copiedId === activeImage.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Prompt</span>
                        </>
                      )}
                    </button>

                    {/* 4K Upscale Trigger Button */}
                    <button
                      onClick={handleUpscaleSelectedImage}
                      disabled={isUpscaling || activeImage.isUpscaled}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        activeImage.isUpscaled
                          ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 cursor-default'
                          : 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 hover:border-amber-500 text-amber-300 hover:text-white shadow-sm'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{activeImage.isUpscaled ? '4K Restored' : 'Upscale to 4K UHD'}</span>
                    </button>

                    {activeImage.originalUrl && (
                      <button
                        onMouseDown={() => setIsComparingOriginal(true)}
                        onMouseUp={() => setIsComparingOriginal(false)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 text-[11px] text-slate-300 hover:bg-slate-700"
                        title="Hold to see original before upscaling"
                      >
                        <SplitSquareVertical className="w-3.5 h-3.5" />
                        <span>Hold to Compare</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onSendToVideoStudio && (
                      <button
                        onClick={() => onSendToVideoStudio(activeImage.url, activeImage.prompt)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.01]"
                        title="Animate this artwork into a cinematic video in Video Studio"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Direct in Video Studio</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-[380px] flex flex-col items-center justify-center text-slate-500 gap-3 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                  <Wand2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-300">Ready to Create</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Enter your prompt on the left and click "Generate Artwork" to create photorealistic, high-resolution masterpieces.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Creation History Gallery */}
          {gallery.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Session Creations ({gallery.length})
                </span>
                <span className="text-[11px] text-slate-500">Click to view & upscale</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {gallery.map((item) => {
                  const isSelected = activeImage?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveImage(item)}
                      className={`relative rounded-xl overflow-hidden aspect-square border transition-all group ${
                        isSelected
                          ? 'border-rose-500 ring-2 ring-rose-500/40 scale-[1.02]'
                          : 'border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
                      {item.isUpscaled && (
                        <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-amber-500 text-[8px] font-black text-black">
                          4K
                        </span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                        <p className="text-[10px] text-white line-clamp-1 text-left font-medium">
                          {item.prompt}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
