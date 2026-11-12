import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Compass,
  Sparkles,
  Zap,
  Info,
  Maximize2,
  Minimize2,
  RefreshCw,
  Orbit,
  Eye,
  Sliders,
  ShieldCheck,
  Layers,
  ArrowRight,
  HelpCircle,
  Play,
  Pause,
  Atom,
  Film,
  Download,
  Image as ImageIcon,
  Check,
  ExternalLink,
  Users,
  Bot,
  Award,
  Copy,
  MessageSquare,
  Scale,
  BrainCircuit,
  AlertCircle,
} from 'lucide-react';
import { MultiverseCouncilResponse, MultiverseAgentResult } from '../types';

interface UniverseScenario {
  id: string;
  title: string;
  question: string;
  classification: 'ESTABLISHED PHYSICS' | 'THEORETICAL PHYSICS' | 'SCIENTIFIC HYPOTHESIS' | 'SPECULATIVE SCI-FI';
  classificationColor: string;
  summary: string;
  ambientColor?: string;
  particleCount?: number;
  timeDilation?: number;
  curvature?: string;
  physicalParameters: {
    label: string;
    value: string;
    deviation: string;
  }[];
  consequences: {
    title: string;
    impact: string;
  }[];
  scientificBasis: string;
  limitations: string;
  visualPrompt?: string;
  visualImageUrl?: string;
}

interface SimulatedUniverse {
  id: string;
  name: string;
  type: string;
  description: string;
  ambientColor: string;
  particleCount: number;
  timeDilation: number;
  curvature: string;
  visualPrompt?: string;
}

interface MultiverseProps {
  onSendToVideoStudio?: (imageUrl: string, prompt: string) => void;
  onSendToImageStudio?: () => void;
}

const UNIVERSES: SimulatedUniverse[] = [
  {
    id: 'u-prime',
    name: 'Universe-001: Standard Model Reality',
    type: 'Prime Cosmos',
    description: 'Our canonical 3+1 dimensional spacetime with canonical physical constants (c = 299,792 km/s, G = 6.674×10⁻¹¹ m³/(kg·s²)).',
    ambientColor: '#38bdf8',
    particleCount: 220,
    timeDilation: 1.0,
    curvature: 'Flat (Ω = 1.00 ± 0.02)',
    visualPrompt: 'A breathtaking photorealistic wide-angle view of Earth from space with illuminated city lights and atmospheric twilight glow, Hasselblad 8k',
  },
  {
    id: 'u-hyper',
    name: 'Universe-042: 4D Hyper-Spatial Continuum',
    type: 'Higher Dimension',
    description: 'A universe where matter oscillates into a 4th spatial dimension, stabilizing tetrahedral planetary orbital mechanics and quad-star structures.',
    ambientColor: '#a855f7',
    particleCount: 300,
    timeDilation: 0.65,
    curvature: 'Positive Hypersphere',
    visualPrompt: 'A photorealistic depiction of a 4D hypersphere planet orbiting quad stars with kaleidoscopic crystalline rings, cinematic volumetric lighting, 8k',
  },
  {
    id: 'u-dark',
    name: 'Universe-089: Negative Gravity & Dark Inversion',
    type: 'Cosmic Inflation Anomaly',
    description: 'Cosmic repulsive energy outpaces gravitational pull at macroscopic scales; matter aggregates in thin fibrous sheets rather than spherical planets.',
    ambientColor: '#f43f5e',
    particleCount: 180,
    timeDilation: 1.4,
    curvature: 'Hyperbolic Open',
    visualPrompt: 'Photorealistic fibrous floating continents drifting in deep space connected by glowing energetic bridges, dark cosmic aesthetic, 8k',
  },
  {
    id: 'u-cryst',
    name: 'Universe-117: Sub-Luminal Velocity Reality',
    type: 'Variable Speed of Light',
    description: 'Speed of light is scaled down to 30,000 km/s. Relativistic Lorentz contractions and chromatic Doppler shifts occur at highway speeds.',
    ambientColor: '#10b981',
    particleCount: 240,
    timeDilation: 0.25,
    curvature: 'Anisotropic Relativistic',
    visualPrompt: 'A futuristic boulevard where vehicles traveling at 60 mph display visible relativistic optical Doppler blueshift and Lorentz contraction, anamorphic film still, 8k',
  },
  {
    id: 'u-blackhole',
    name: 'Universe-504: Super-Singularity Ergosystem',
    type: 'Supermassive Cluster',
    description: 'Extreme gravitational density where stellar systems orbit an interlocking web of supermassive Kerr black holes connected via theoretical Einstein-Rosen bridges.',
    ambientColor: '#f59e0b',
    particleCount: 350,
    timeDilation: 0.12,
    curvature: 'Extreme Relativistic Frame Dragging',
    visualPrompt: 'Supermassive Kerr black hole with blazing golden accretion disk and gravitational lensing halo warping starlight, Interstellar cinematic grade, 8k',
  },
];

const PARALLEL_SCENARIOS: UniverseScenario[] = [
  {
    id: 'two-moons',
    title: 'Bi-Lunar Earth',
    question: 'What if Earth had two moons of equal mass in stable resonance?',
    classification: 'THEORETICAL PHYSICS',
    classificationColor: 'text-violet-400 bg-violet-950/60 border-violet-800',
    summary: 'Tidal gravitational forces would increase by approximately 220-340%, triggering severe coastal tidal waves, hyper-velocity oceanic currents, and a synchronized bi-lunar orbital resonance.',
    ambientColor: '#8b5cf6',
    particleCount: 260,
    timeDilation: 1.0,
    curvature: 'Dual-Tidal Tensor Resonant Spacetime',
    visualPrompt: 'A breathtaking photorealistic wide-angle view from Earth coastline showing two luminous full moons in the night sky over hyper-velocity tidal waves and bioluminescent coral reefs, 8k photography, Hasselblad',
    physicalParameters: [
      { label: 'Tidal Amplitude', value: '±12 to 24 meters', deviation: '+280% vs Earth' },
      { label: 'Axial Precession', value: 'Stabilized ±1.2°', deviation: 'Extreme seasonal stability' },
      { label: 'Night Sky Luminance', value: '0.45 lux at dual full moon', deviation: '+190% illuminance' },
      { label: 'Orbital Resonance', value: '2:1 Laplace resonance', deviation: 'Orbital period 14.1 & 28.2 days' },
    ],
    consequences: [
      {
        title: 'Coastal Topography & Marine Life',
        impact: 'Continental coastlines would become uninhabitable buffer zones with massive intertidal estuaries spanning dozens of kilometers inland.',
      },
      {
        title: 'Nocturnal Ecosystem Evolution',
        impact: 'High night-time illumination would favor bioluminescent navigation and dual-cycle circadian rhythms in biological lifeforms.',
      },
      {
        title: 'Geological Volcanism',
        impact: 'Continuous gravitational tidal flexing of the Earth mantle would increase tectonic friction, resulting in elevated volcanic activity.',
      },
    ],
    scientificBasis: 'Calculated using Newtonian tidal gravity tensors: F_tidal ∝ 2GMm/r³. Stable co-orbital motion requires Lagrange point or mean-motion orbital resonance.',
    limitations: 'Assumes non-colliding orbital resonance and constant oceanic mantle volume over geological timescales.',
  },
  {
    id: 'variable-g',
    title: 'Hyper-Gravity Cosmos (2× G)',
    question: 'What if the universal gravitational constant G was doubled?',
    classification: 'THEORETICAL PHYSICS',
    classificationColor: 'text-violet-400 bg-violet-950/60 border-violet-800',
    summary: 'Stellar core fusion rates would increase quadratically. Stars would burn through their hydrogen reserves in under 1.5 billion years, drastically reducing the window for biological evolution.',
    ambientColor: '#f97316',
    particleCount: 300,
    timeDilation: 0.7,
    curvature: 'Compressed Hyper-Gravitational Metric',
    visualPrompt: 'Photorealistic landscape of a hyper-gravity planet under a blinding blue-white star, squat tetrahedral vegetation, compressed dense atmospheric haze, Hasselblad 8k',
    physicalParameters: [
      { label: 'Surface Gravity (g)', value: '19.62 m/s²', deviation: '+100% (2.0 G)' },
      { label: 'Stellar Lifespan', value: '~1.2 Billion Years', deviation: '-88% lifespan reduction' },
      { label: 'Atmospheric Scale Height', value: '4.2 km', deviation: '-50% compressed atmosphere' },
      { label: 'Max Biological Height', value: '~0.6 - 1.1 meters', deviation: 'Squat skeletal frames' },
    ],
    consequences: [
      {
        title: 'Stellar Burnout & Supernovae',
        impact: 'Main-sequence stars would burn with searing blue-white intensity, exhausting their fuel before complex multicellular life could emerge.',
      },
      {
        title: 'Compressed Atmospheric Shield',
        impact: 'Atmospheric pressure at sea level would double, trapping dense greenhouse vapors and drastically dampening high-altitude flight.',
      },
      {
        title: 'Structural Architecture',
        impact: 'Biological organisms would require dense bone mineral density and quadrupedal low-center-of-gravity anatomical structures.',
      },
    ],
    scientificBasis: 'Stellar luminosity scales as L ∝ M³G⁴; higher G accelerates core thermonuclear pressure and hydrostatic equilibrium.',
    limitations: 'Calculations hold the fine-structure constant and Planck constant constant while isolating G.',
  },
  {
    id: 'slow-light',
    title: 'Sub-Luminal Velocity Reality',
    question: 'What if the speed of light were only 30,000 km/s?',
    classification: 'SCIENTIFIC HYPOTHESIS',
    classificationColor: 'text-amber-400 bg-amber-950/60 border-amber-800',
    summary: 'Special relativity would become a tangible daily reality. Driving an automobile at 100 km/h would cause perceptible relativistic Doppler color shifts and Lorentz length contraction.',
    ambientColor: '#10b981',
    particleCount: 220,
    timeDilation: 0.3,
    curvature: 'Visible Relativistic Aberration Metric',
    visualPrompt: 'Photorealistic futuristic city boulevard where cars traveling at 60 mph display visible relativistic Doppler blueshift and Lorentz contraction, anamorphic film still, 8k',
    physicalParameters: [
      { label: 'Speed of Light (c)', value: '30,000 km/s', deviation: '-90% from standard c' },
      { label: 'Lorentz Factor γ at 3000 km/s', value: '1.005 γ', deviation: 'Perceptible time dilation' },
      { label: 'Rest Energy E = mc²', value: '9×10¹⁴ J/kg', deviation: '-99% nuclear yield' },
      { label: 'Doppler Shift Threshold', value: '~50 km/h', deviation: 'Visible color metamorphosis' },
    ],
    consequences: [
      {
        title: 'Visual Headlight Effect',
        impact: 'Objects moving toward an observer would visually bunch up, shift into ultraviolet, and concentrate light forward into a blinding beam.',
      },
      {
        title: 'Nuclear Chemistry Metamorphosis',
        impact: 'Lower rest mass-energy release would make nuclear fusion and fission significantly less energetic, altering stellar radiation spectra.',
      },
      {
        title: 'Electromagnetic Communication Latency',
        impact: 'Intercontinental fiber transmissions would experience tangible multi-second ping delays, reshaping computing and communication.',
      },
    ],
    scientificBasis: 'Special Relativity: Lorentz Transformation t = t₀/√(1 - v²/c²). Optical relativistic aberration and Doppler shift.',
    limitations: 'Modifying c impacts Maxwell equations, fine-structure constant α = e²/(4πε₀ħc), and atomic electron orbital radii.',
  },
  {
    id: 'dino-survival',
    title: 'The Unstruck Earth (Asteroid Miss)',
    question: 'What if the Chicxulub asteroid missed Earth 66 million years ago?',
    classification: 'SPECULATIVE SCI-FI',
    classificationColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
    summary: 'Non-avian dinosaurs, pterosaurs, and marine reptiles would have continued their evolutionary trajectory into the Cenozoic, resulting in potential avian/reptilian sapience.',
    ambientColor: '#059669',
    particleCount: 240,
    timeDilation: 1.0,
    curvature: 'Standard Earth Evolutionary Divergence',
    visualPrompt: 'Photorealistic view of an advanced civilization of feathered troodontids inhabiting an organic bio-luminescent city in an untouched prehistoric jungle, 8k',
    physicalParameters: [
      { label: 'Atmospheric Ash & Dust', value: '0 GT soot', deviation: 'No nuclear impact winter' },
      { label: 'Mammalian Biomass', value: '< 4% of terrestrial fauna', deviation: 'Remained nocturnal burrowers' },
      { label: 'Theropod Brain-to-Body Ratio', value: 'Troodontid EQ ~ 6.0', deviation: 'Convergent tool manipulation' },
      { label: 'Global Flora Diversity', value: 'Gymnosperm & Fern dominance', deviation: 'Angiosperm delay' },
    ],
    consequences: [
      {
        title: 'Avian-Dinosaur Sapience',
        impact: 'Dromaeosaurids and troodontids with stereoscopic vision, prehensile digits, and social flock hunting could have evolved advanced culture.',
      },
      {
        title: 'Suppression of Large Mammals',
        impact: 'Primates, ungulates, and cetaceans would likely never have diversified past small insectivorous niches due to apex reptilian competition.',
      },
      {
        title: 'Continental Drift Adaptation',
        impact: 'Dinosaurs would adapt to the Antarctic glaciation and grassland expansion of the Miocene epoch with thick feathered insulation.',
      },
    ],
    scientificBasis: 'Paleoclimatology and evolutionary biology based on pre-K-Pg extinction fossil records in the Hell Creek Formation.',
    limitations: 'Speculative evolutionary trajectory over 66 million years cannot account for subsequent ice ages and disease vectors.',
  },
];

const QUANTUM_PROMPT_SEEDS = [
  'What if Earth orbited a triple-star system with no true night?',
  'What if humanity discovered room-temperature anti-gravity in 1890?',
  'What if atmospheric oxygen was 40% and trees grew 500 meters tall?',
  'What if Mars had vast liquid oceans and an active magnetic field?',
  'What if the Planck constant was doubled, making quantum tunneling macroscopic?',
  'What if Earth had massive planetary rings like Saturn visible from the equator?',
];

export const Multiverse: React.FC<MultiverseProps> = ({
  onSendToVideoStudio,
  onSendToImageStudio,
}) => {
  const [universeList, setUniverseList] = useState<SimulatedUniverse[]>(UNIVERSES);
  const [scenarioList, setScenarioList] = useState<UniverseScenario[]>(PARALLEL_SCENARIOS);
  const [activeUniverse, setActiveUniverse] = useState<SimulatedUniverse>(UNIVERSES[0]);
  const [activeScenario, setActiveScenario] = useState<UniverseScenario>(PARALLEL_SCENARIOS[0]);
  const [activeTab, setActiveTab] = useState<'council' | 'explorer' | 'simulator' | 'scenarios' | 'theory'>('council');

  // Multi-Agent Council State
  const [councilPrompt, setCouncilPrompt] = useState('Compare the future of quantum computing versus classical neuromorphic architectures for real-time edge AI.');
  const [councilMode, setCouncilMode] = useState<'compare' | 'debate' | 'collaborate'>('compare');
  const [selectedCouncilModels, setSelectedCouncilModels] = useState<string[]>([
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
  ]);
  const [isCouncilLoading, setIsCouncilLoading] = useState(false);
  const [councilResponse, setCouncilResponse] = useState<MultiverseCouncilResponse | null>(null);
  const [councilError, setCouncilError] = useState<string | null>(null);
  const [copiedSynthesis, setCopiedSynthesis] = useState(false);

  // Simulation controls
  const [isRotating, setIsRotating] = useState(true);
  const [timeDilationSpeed, setTimeDilationSpeed] = useState(1.0);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [viewPerspective, setViewPerspective] = useState<'orbit' | 'galaxy' | 'singularity' | 'wormhole'>('orbit');
  const [enableDopplerShift, setEnableDopplerShift] = useState(true);

  // Interactive mouse gravity well
  const [mouseGravity, setMouseGravity] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  // Custom Simulator State
  const [simulatorQuestion, setSimulatorQuestion] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulateError, setSimulateError] = useState<string | null>(null);

  // Visualizer State (direct 8K image generation)
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [visualizedImage, setVisualizedImage] = useState<string | null>(null);
  const [visualizedPrompt, setVisualizedPrompt] = useState<string | null>(null);
  const [visualizeError, setVisualizeError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger Multi-Agent Council Parallel Query
  const handleRunCouncilQuery = async (customPrompt?: string) => {
    const p = (customPrompt || councilPrompt).trim();
    if (!p) return;

    setIsCouncilLoading(true);
    setCouncilError(null);

    try {
      const res = await fetch('/api/multiverse/parallel-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: p,
          models: selectedCouncilModels,
          mode: councilMode,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server returned error ${res.status}`);
      }

      const data: MultiverseCouncilResponse = await res.json();
      setCouncilResponse(data);
    } catch (err: any) {
      console.error('Council query failed:', err);
      setCouncilError(err.message || 'Parallel query processing failed');
    } finally {
      setIsCouncilLoading(false);
    }
  };

  // Trigger AI Multiverse Simulation
  const handleRunSimulation = async (questionText?: string) => {
    const q = (questionText || simulatorQuestion).trim();
    if (!q) return;

    setIsSimulating(true);
    setSimulateError(null);

    try {
      const res = await fetch('/api/multiverse-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioQuestion: q,
          baseUniverseId: activeUniverse.id,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Simulation server error ${res.status}`);
      }

      const data = await res.json();
      const sim = data.simulation as UniverseScenario;

      // Add to scenarios list
      setScenarioList((prev) => [sim, ...prev]);
      setActiveScenario(sim);

      // Create corresponding simulated universe for 3D exploration
      const newUniverse: SimulatedUniverse = {
        id: sim.id,
        name: `Universe-Sim: ${sim.title}`,
        type: sim.classification,
        description: sim.summary,
        ambientColor: sim.ambientColor || '#06b6d4',
        particleCount: sim.particleCount || 280,
        timeDilation: sim.timeDilation || 0.85,
        curvature: sim.curvature || 'Hyperbolic Relativistic Spacetime',
        visualPrompt: sim.visualPrompt,
      };

      setUniverseList((prev) => [newUniverse, ...prev]);
      setActiveUniverse(newUniverse);
      setActiveTab('scenarios');
    } catch (err: any) {
      console.error('Simulation failed:', err);
      setSimulateError(err.message || 'Failed to complete quantum simulation.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Generate Photorealistic Visual of Alternate Universe
  const handleVisualizeUniverse = async (scenario: UniverseScenario) => {
    setIsVisualizing(true);
    setVisualizeError(null);

    const promptText = scenario.visualPrompt || `A photorealistic depiction of ${scenario.title}: ${scenario.question}, Hasselblad 8k, volumetric lighting, epic scale`;

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          aspectRatio: '16:9',
          style: 'cinematic',
          quality: '2K',
          enhanceWithAi: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to render universe visualization');
      }

      const data = await res.json();
      setVisualizedImage(data.imageUrl);
      setVisualizedPrompt(promptText);

      // Save to scenario
      setScenarioList((prev) =>
        prev.map((s) => (s.id === scenario.id ? { ...s, visualImageUrl: data.imageUrl } : s))
      );
    } catch (err: any) {
      console.error('Universe visualization error:', err);
      setVisualizeError(err.message || 'Failed to generate visual depiction.');
    } finally {
      setIsVisualizing(false);
    }
  };

  // Canvas-based real-time 3D Universe Simulation with Mouse Gravity Wells
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    // Generate celestial bodies & stardust
    const stars = Array.from({ length: activeUniverse.particleCount || 240 }).map(() => ({
      x: (Math.random() - 0.5) * 850,
      y: (Math.random() - 0.5) * 850,
      z: Math.random() * 800 + 100,
      size: Math.random() * 2.2 + 0.8,
      baseColor: activeUniverse.ambientColor,
      orbitRadius: Math.random() * 270 + 40,
      orbitSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
      orbitAngle: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }));

    const render = () => {
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      if (isRotating) {
        angle += 0.008 * timeDilationSpeed * (activeUniverse.timeDilation || 1.0);
      }

      // Draw background cosmic nebula glow
      const nebulaGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, canvas.width * 0.6);
      nebulaGrad.addColorStop(0, (activeUniverse.ambientColor || '#38bdf8') + '25');
      nebulaGrad.addColorStop(0.5, '#11182744');
      nebulaGrad.addColorStop(1, '#030712');
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render 3D Stardust & Celestial Bodies with Perspective Projection
      const fov = 350 * zoomLevel;

      stars.forEach((star) => {
        if (isRotating) {
          star.orbitAngle += star.orbitSpeed * timeDilationSpeed;
        }

        let sx = Math.cos(star.orbitAngle + angle) * star.orbitRadius + star.vx;
        let sz = Math.sin(star.orbitAngle + angle) * star.orbitRadius + 400;
        let sy = star.y * 0.4 + star.vy;

        // Apply interactive mouse gravity singularity
        if (mouseGravity.active) {
          const rect = canvas.getBoundingClientRect();
          const targetX = ((mouseGravity.x - rect.left) / rect.width) * canvas.width - cx;
          const targetY = ((mouseGravity.y - rect.top) / rect.height) * canvas.height - cy;

          const dx = targetX - sx;
          const dy = targetY - sy;
          const distSq = dx * dx + dy * dy + 400;
          const force = 350 / distSq;

          star.vx += (dx / Math.sqrt(distSq)) * force * 2.5;
          star.vy += (dy / Math.sqrt(distSq)) * force * 2.5;

          // Drag damping
          star.vx *= 0.96;
          star.vy *= 0.96;
        }

        if (viewPerspective === 'singularity') {
          // Gravitational lensing towards center
          const dist = Math.sqrt(sx * sx + sy * sy);
          const warp = Math.max(0.1, 1 - 120 / (dist + 50));
          sx *= warp;
          sy *= warp;
        } else if (viewPerspective === 'wormhole') {
          sz = (sz % 300) + 100;
        }

        const scale = fov / sz;
        const px = cx + sx * scale;
        const py = cy + sy * scale;

        if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height && scale > 0) {
          ctx.beginPath();

          // Doppler redshift/blueshift effect
          if (enableDopplerShift) {
            const zVelocity = Math.cos(star.orbitAngle + angle) * star.orbitSpeed;
            if (zVelocity > 0.005) {
              // Receding -> Redshift
              ctx.fillStyle = '#f87171';
            } else if (zVelocity < -0.005) {
              // Approaching -> Blueshift
              ctx.fillStyle = '#38bdf8';
            } else {
              ctx.fillStyle = star.baseColor;
            }
          } else {
            ctx.fillStyle = star.baseColor;
          }

          ctx.globalAlpha = Math.min(1, Math.max(0.18, scale * 1.5));
          ctx.arc(px, py, star.size * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1.0;

      // Draw Center Landmark
      if (viewPerspective === 'singularity') {
        const bhRadius = 45 * zoomLevel;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, 0.35);
        const diskGrad = ctx.createRadialGradient(0, 0, bhRadius, 0, 0, bhRadius * 2.8);
        diskGrad.addColorStop(0, '#f97316');
        diskGrad.addColorStop(0.4, '#fbbf24');
        diskGrad.addColorStop(0.8, '#ec4899');
        diskGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = diskGrad;
        ctx.beginPath();
        ctx.arc(0, 0, bhRadius * 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.fillStyle = '#000000';
        ctx.arc(cx, cy, bhRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5 * zoomLevel;
        ctx.beginPath();
        ctx.arc(cx, cy, bhRadius + 2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (viewPerspective === 'wormhole') {
        for (let r = 8; r >= 1; r--) {
          const ringRadius = r * 22 * zoomLevel;
          ctx.strokeStyle = r % 2 === 0 ? activeUniverse.ambientColor : '#a855f7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, ringRadius, ringRadius * 0.45, angle * r * 0.1, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        const coreRadius = 24 * zoomLevel;
        const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, coreRadius * 2.5);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.3, activeUniverse.ambientColor);
        coreGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = (activeUniverse.ambientColor || '#38bdf8') + '44';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 140 * zoomLevel, 45 * zoomLevel, 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw Interactive Mouse Singularity if active
      if (mouseGravity.active) {
        const rect = canvas.getBoundingClientRect();
        const mx = ((mouseGravity.x - rect.left) / rect.width) * canvas.width;
        const my = ((mouseGravity.y - rect.top) / rect.height) * canvas.height;

        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mx, my, 18, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(mx, my, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mx, my, 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // HUD Watermark & Scientific Coordinate Overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = '11px monospace';
      ctx.fillText(`UNIVERSE ID: ${activeUniverse.id.toUpperCase()}`, 24, 34);
      ctx.fillText(`COSMIC CURVATURE: ${activeUniverse.curvature}`, 24, 50);
      ctx.fillText(`TIME DILATION: ${(activeUniverse.timeDilation * timeDilationSpeed).toFixed(3)}x`, 24, 66);
      if (mouseGravity.active) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`ACTIVE SINGULARITY GRAVITY WELL: ENGAGED`, 24, 82);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [activeUniverse, isRotating, timeDilationSpeed, zoomLevel, viewPerspective, enableDopplerShift, mouseGravity]);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-slate-950/85 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Orbit className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">KYRON.AI Multiverse Engine</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                PARALLEL REALITY SIMULATOR
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive 3D cosmos particle spacetime, AI "What-If" alternate reality generation & direct 8K visualization
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('council')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'council'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Multi-Agent Council & Debate</span>
          </button>
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'explorer'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
            <span>3D Spacetime</span>
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'simulator'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>AI "What-If" Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'scenarios'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Parallel Dossiers ({scenarioList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'theory'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>Theoretical Proofs</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* 0. MULTI-AGENT COUNCIL & PARALLEL MODEL STUDIO */}
        {activeTab === 'council' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Top Control Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-indigo-400" />
                    <span>Council Configuration & Participating AI Models</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Query multiple genuine Gemini models concurrently. Compare side-by-side or watch them debate.
                  </p>
                </div>

                {/* Mode Selectors */}
                <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setCouncilMode('compare')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      councilMode === 'compare'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Compare Models
                  </button>
                  <button
                    onClick={() => setCouncilMode('debate')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      councilMode === 'debate'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    AI Debate
                  </button>
                  <button
                    onClick={() => setCouncilMode('collaborate')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      councilMode === 'collaborate'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Collaborative Synthesis
                  </button>
                </div>
              </div>

              {/* Model Selection Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'gemini-3.1-flash-lite',
                    name: 'Flash-Lite Engine',
                    badge: 'FASTEST (SUB-SECOND)',
                    desc: 'Speed, concise facts & immediate responses',
                    color: 'text-cyan-400 border-cyan-800/60 bg-cyan-950/20',
                  },
                  {
                    id: 'gemini-flash-latest',
                    name: 'Gemini Flash Dynamic',
                    badge: 'CREATIVE & COMPREHENSIVE',
                    desc: 'Rich nuance, expansive prose & multi-perspective insight',
                    color: 'text-indigo-400 border-indigo-800/60 bg-indigo-950/20',
                  },
                  {
                    id: 'gemini-3.8-flash',
                    name: 'Gemini 3.8 Reasoning',
                    badge: 'DEEP LOGIC & AUDIT',
                    desc: 'Systematic multi-step reasoning & architecture scrutiny',
                    color: 'text-violet-400 border-violet-800/60 bg-violet-950/20',
                  },
                ].map((m) => {
                  const isChecked = selectedCouncilModels.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      onClick={() => {
                        if (isChecked) {
                          if (selectedCouncilModels.length > 1) {
                            setSelectedCouncilModels(selectedCouncilModels.filter((id) => id !== m.id));
                          }
                        } else {
                          setSelectedCouncilModels([...selectedCouncilModels, m.id]);
                        }
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? `${m.color} ring-1 ring-white/10 shadow-lg`
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 accent-indigo-500 rounded cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-200 truncate">{m.name}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 font-semibold">
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{m.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Inquiry Prompt Input Bar */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Council Topic / Inquiry</span>
                  <span className="text-[11px] text-slate-500">Press Enter or click Dispatch to run in parallel</span>
                </div>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={councilPrompt}
                    onChange={(e) => setCouncilPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleRunCouncilQuery();
                      }
                    }}
                    placeholder="Enter a prompt, debate question, or technical problem to dispatch across all models simultaneously..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-mono"
                  />
                  <button
                    disabled={isCouncilLoading || !councilPrompt.trim()}
                    onClick={() => handleRunCouncilQuery()}
                    className="px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {isCouncilLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-white" />
                        <span>Dispatch Council</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Example Quick Seeds */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-slate-500 font-medium">Quick Presets:</span>
                  {[
                    'Sub-second real-time streaming pipeline architecture',
                    'Is General AI safer with open-weight or closed models?',
                    'Optimal mathematical path to net-positive nuclear fusion',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCouncilPrompt(preset);
                        handleRunCouncilQuery(preset);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {councilError && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{councilError}</span>
              </div>
            )}

            {/* Council Results Section */}
            {councilResponse && (
              <div className="flex flex-col gap-6">
                {/* Arbiter Evaluation & Master Consensus Banner */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-indigo-950/30 to-purple-950/40 border border-amber-600/40 shadow-2xl backdrop-blur flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-800/30 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                            Council Arbiter Consensus
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                            WINNER: {councilResponse.arbiter.recommendedBestModel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          {councilResponse.arbiter.evaluationSummary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">
                        Total Parallel Dispatch: {councilResponse.totalDurationMs}ms
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(councilResponse.arbiter.masterSynthesis);
                          setCopiedSynthesis(true);
                          setTimeout(() => setCopiedSynthesis(false), 2000);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedSynthesis ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSynthesis ? 'Copied' : 'Copy Synthesis'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                      Unified Master Synthesis
                    </p>
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                      {councilResponse.arbiter.masterSynthesis}
                    </p>
                  </div>
                </div>

                {/* Side-By-Side Parallel Model Responses */}
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Scale className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Side-By-Side Agent Comparison ({councilResponse.agents.length} Models)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Mode: {councilResponse.mode.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {councilResponse.agents.map((agent, i) => {
                    const isWinner = agent.model === councilResponse.arbiter.recommendedBestModel;
                    return (
                      <div
                        key={agent.model}
                        className={`rounded-3xl border p-5 flex flex-col justify-between shadow-xl backdrop-blur transition-all ${
                          isWinner
                            ? 'bg-slate-900/95 border-amber-500/50 ring-1 ring-amber-500/30'
                            : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        <div>
                          {/* Agent Header */}
                          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white tracking-tight">
                                  {agent.profile.name}
                                </span>
                                {isWinner && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                    ★ TOP RATED
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">{agent.profile.role}</p>
                            </div>

                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-indigo-300 border border-slate-800">
                              ⚡ {agent.latencyMs}ms
                            </span>
                          </div>

                          {/* Response Text */}
                          <div className="text-xs text-slate-300 leading-relaxed max-h-[360px] overflow-y-auto whitespace-pre-line pr-1 font-sans">
                            {agent.content}
                          </div>
                        </div>

                        {/* Agent Footer Strip */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>{agent.wordCount} words (~{agent.estimatedTokens} tok)</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(agent.content);
                            }}
                            className="hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1. 3D COSMOS EXPLORER */}
        {activeTab === 'explorer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div
                className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl h-[480px] sm:h-[540px] flex items-center justify-center cursor-crosshair select-none"
                onMouseDown={(e) => setMouseGravity({ x: e.clientX, y: e.clientY, active: true })}
                onMouseMove={(e) => {
                  if (mouseGravity.active) {
                    setMouseGravity({ x: e.clientX, y: e.clientY, active: true });
                  }
                }}
                onMouseUp={() => setMouseGravity((prev) => ({ ...prev, active: false }))}
                onMouseLeave={() => setMouseGravity((prev) => ({ ...prev, active: false }))}
              >
                <canvas
                  ref={canvasRef}
                  width={1000}
                  height={600}
                  className="w-full h-full object-cover"
                />

                {/* Floating Hint Overlay */}
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] text-slate-300 pointer-events-none flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Click or drag anywhere to summon an interactive gravity singularity well</span>
                </div>

                {/* Simulation Overlays & Floating Controls */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-800 p-1.5 rounded-xl text-xs">
                  <button
                    onClick={() => setEnableDopplerShift(!enableDopplerShift)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      enableDopplerShift ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400'
                    }`}
                    title="Toggle Relativistic Doppler Redshift/Blueshift"
                  >
                    Doppler Shift: {enableDopplerShift ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => setIsRotating((prev) => !prev)}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title={isRotating ? 'Pause rotation' : 'Resume rotation'}
                  >
                    {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                    className="px-2 py-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    +
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                    className="px-2 py-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    -
                  </button>
                </div>

                {/* Perspective Mode Switcher Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 bg-slate-950/85 backdrop-blur border border-slate-800/80 p-2.5 rounded-2xl">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                      Perspective:
                    </span>
                    {(['orbit', 'galaxy', 'singularity', 'wormhole'] as const).map((view) => (
                      <button
                        key={view}
                        onClick={() => setViewPerspective(view)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                          viewPerspective === view
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {view === 'singularity' ? 'Black Hole Singularity' : view === 'wormhole' ? 'Einstein-Rosen Bridge' : view}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Time Dilation:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.1"
                      value={timeDilationSpeed}
                      onChange={(e) => setTimeDilationSpeed(Number(e.target.value))}
                      className="w-20 sm:w-28"
                    />
                    <span className="text-[11px] font-mono text-cyan-400 w-8">
                      {timeDilationSpeed.toFixed(1)}x
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Universe Telemetry Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{activeUniverse.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/80 text-cyan-300">
                      {activeUniverse.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{activeUniverse.description}</p>
                </div>

                <button
                  onClick={() => {
                    // Find or create matching scenario and visualize
                    const match = scenarioList.find((s) => s.id === activeUniverse.id) || scenarioList[0];
                    setActiveScenario(match);
                    handleVisualizeUniverse(match);
                    setActiveTab('scenarios');
                  }}
                  disabled={isVisualizing}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/25 transition-all"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Visualize in 8K</span>
                </button>
              </div>
            </div>

            {/* Right Universe Selector (lg: 4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Simulated Cosmos ({universeList.length})
              </span>
              <div className="flex flex-col gap-2.5 max-h-[540px] overflow-y-auto pr-1">
                {universeList.map((u) => {
                  const isSelected = activeUniverse.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setActiveUniverse(u)}
                      className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-900 border-cyan-500 ring-1 ring-cyan-500/30 shadow-lg'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{u.name}</span>
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: u.ambientColor }}
                        />
                      </div>
                      <div className="text-[11px] text-cyan-400 font-mono mb-1">{u.type}</div>
                      <p className="text-xs text-slate-400 line-clamp-2">{u.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. AI "WHAT-IF" REALITY SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 flex flex-col gap-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Quantum Reality Simulator Engine</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Input any hypothetical physics constant mutation, historical divergence point, or cosmological question. Our theoretical physics engine simulates the exact consequences and generates a photorealistic visual prompt.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Hypothetical "What If?" Scenario
                </label>
                <textarea
                  value={simulatorQuestion}
                  onChange={(e) => setSimulatorQuestion(e.target.value)}
                  placeholder="e.g. 'What if Earth had rings like Saturn and humanity built atmospheric tether elevators?' or 'What if the speed of light was 10,000 km/h?'"
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 resize-none transition-all leading-relaxed"
                />
              </div>

              {/* Instant Quantum Prompt Seeds */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Quantum Seeds & Theoretical Inquiries:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUANTUM_PROMPT_SEEDS.map((seed, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSimulatorQuestion(seed);
                        handleRunSimulation(seed);
                      }}
                      className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left text-xs text-slate-300 hover:text-white transition-all line-clamp-2"
                    >
                      {seed}
                    </button>
                  ))}
                </div>
              </div>

              {simulateError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
                  {simulateError}
                </div>
              )}

              <button
                type="button"
                onClick={() => handleRunSimulation()}
                disabled={isSimulating || !simulatorQuestion.trim()}
                className={`py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                  isSimulating || !simulatorQuestion.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-white shadow-cyan-600/30'
                }`}
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Computing Quantum Multiverse Tensors...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Simulate Parallel Reality</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Instructions & Feature Highlights (lg: 5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                  How The Multiverse Simulator Operates
                </span>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0 text-cyan-400 font-bold text-[11px]">
                      1
                    </div>
                    <p>
                      <strong>Physical Laws Perturbation:</strong> Calculates deviations across Planck length, Gravitational constant, Speed of light, and Entropy gradients.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center shrink-0 text-indigo-400 font-bold text-[11px]">
                      2
                    </div>
                    <p>
                      <strong>Macro Biological Consequences:</strong> Forecasts convergent evolutionary paths, biospheric equilibrium, and skeletal or anatomical adaptations.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-fuchsia-950 border border-fuchsia-800 flex items-center justify-center shrink-0 text-fuchsia-400 font-bold text-[11px]">
                      3
                    </div>
                    <p>
                      <strong>3D Cosmos Rendering & 8K Image:</strong> Automatically spawns an interactive 3D particle simulation and lets you render an 8K photorealistic visualization with 1 click.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Simulations quick jump */}
              <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Active Realities in Registry ({scenarioList.length})
                </span>
                <div className="space-y-1.5">
                  {scenarioList.slice(0, 3).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setActiveScenario(s);
                        setActiveTab('scenarios');
                      }}
                      className="w-full text-left p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-xs text-slate-300 flex items-center justify-between"
                    >
                      <span className="truncate">{s.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. PARALLEL DOSSIERS & DIRECT VISUALIZATION */}
        {activeTab === 'scenarios' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Scenario Selector (lg: 4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Parallel Universes ({scenarioList.length})
                </span>
                <button
                  onClick={() => setActiveTab('simulator')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  + New Scenario
                </button>
              </div>
              <div className="flex flex-col gap-2.5 max-h-[640px] overflow-y-auto pr-1">
                {scenarioList.map((sc) => {
                  const isSelected = activeScenario.id === sc.id;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => setActiveScenario(sc)}
                      className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-900 border-cyan-500 ring-1 ring-cyan-500/30 shadow-lg'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{sc.title}</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${sc.classificationColor}`}>
                          {sc.classification.split(' ')[0]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{sc.question}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Scenario Detailed Dossier (lg: 8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
              {/* Header & Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${activeScenario.classificationColor}`}>
                      {activeScenario.classification}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Dossier ID: {activeScenario.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{activeScenario.title}</h3>
                </div>

                {/* 1-Click Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const match = universeList.find((u) => u.id === activeScenario.id) || {
                        id: activeScenario.id,
                        name: activeScenario.title,
                        type: activeScenario.classification,
                        description: activeScenario.summary,
                        ambientColor: activeScenario.ambientColor || '#06b6d4',
                        particleCount: activeScenario.particleCount || 260,
                        timeDilation: activeScenario.timeDilation || 1.0,
                        curvature: activeScenario.curvature || 'Divergent Spacetime Metric',
                      };
                      setActiveUniverse(match);
                      setActiveTab('explorer');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    <Orbit className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open in 3D</span>
                  </button>

                  <button
                    onClick={() => handleVisualizeUniverse(activeScenario)}
                    disabled={isVisualizing}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 transition-all"
                  >
                    {isVisualizing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Rendering 8K Art...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>🌌 Visualize Universe (8K)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Photorealistic Visualization Showcase (if generated) */}
              {(activeScenario.visualImageUrl || visualizedImage) && (
                <div className="rounded-2xl overflow-hidden border border-cyan-800/60 bg-slate-950 p-4 space-y-3 shadow-2xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>8K Photorealistic Visualization of {activeScenario.title}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {onSendToVideoStudio && (
                        <button
                          onClick={() => {
                            const imgUrl = activeScenario.visualImageUrl || visualizedImage!;
                            onSendToVideoStudio(imgUrl, activeScenario.visualPrompt || activeScenario.question);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-800 text-[11px] font-semibold text-purple-300 hover:text-white"
                        >
                          <Film className="w-3 h-3 text-purple-400" />
                          <span>Animate in Video Studio</span>
                        </button>
                      )}
                      <a
                        href={activeScenario.visualImageUrl || visualizedImage!}
                        download={`${activeScenario.id}-universe-visual.jpg`}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-white"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download 8K</span>
                      </a>
                    </div>
                  </div>

                  <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-800">
                    <img
                      src={activeScenario.visualImageUrl || visualizedImage!}
                      alt={`Visual depiction of ${activeScenario.title}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono italic">
                    Prompt: "{activeScenario.visualPrompt || visualizedPrompt}"
                  </p>
                </div>
              )}

              {visualizeError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
                  {visualizeError}
                </div>
              )}

              {/* Question & Core Summary */}
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-slate-200">
                <span className="text-xs font-semibold text-cyan-400 block mb-1">Primary Thought Experiment</span>
                <p className="text-sm font-medium italic">"{activeScenario.question}"</p>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{activeScenario.summary}</p>
              </div>

              {/* Timeline Divergence Tree Visualizer */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Timeline Divergence Vector
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                    Earth-Prime (Standard Model)
                  </div>
                  <div className="h-0.5 w-8 bg-cyan-500/60" />
                  <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold font-mono">
                    Divergence Point: {activeScenario.title}
                  </div>
                </div>
              </div>

              {/* Physical Parameter Variations */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Calculated Physical Variations
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {activeScenario.physicalParameters.map((p, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">{p.label}</div>
                      <div className="text-xs font-bold text-white font-mono mt-0.5">{p.value}</div>
                      <div className="text-[10px] text-cyan-400 mt-0.5">{p.deviation}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Macro Consequences */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Systemic Macro Consequences
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeScenario.consequences.map((c, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <span className="text-xs font-bold text-slate-200 block">{c.title}</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{c.impact}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scientific Basis & Boundaries */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <Atom className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-300">Theoretical Foundation: </span>
                    <span className="text-slate-400">{activeScenario.scientificBasis}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-300">Hypothetical Boundaries & Assumptions: </span>
                    <span className="text-slate-400">{activeScenario.limitations}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. THEORETICAL RIGOR & EPISTEMOLOGY */}
        {activeTab === 'theory' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white">Scientific Rigor & Epistemological Taxonomy</h3>
              <p className="text-xs text-slate-400 mt-1">
                KYRON.AI enforces strict demarcation between verified empirical observations, mathematically consistent theoretical frameworks, and speculative thought experiments.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-800/60 space-y-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ESTABLISHED PHYSICS
                </span>
                <h4 className="text-xs font-bold text-white">Empirically Verified</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Theories backed by peer-reviewed empirical evidence and repeatable experimental verification, including General Relativity, Quantum Electrodynamics, and the Standard Model of particle physics.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-violet-800/60 space-y-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
                  THEORETICAL PHYSICS
                </span>
                <h4 className="text-xs font-bold text-white">Mathematically Grounded</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Rigorous mathematical solutions to Einstein's field equations and quantum mechanics that lack direct empirical probe detection, such as Kerr black hole ring singularities and cosmic inflation.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-800/60 space-y-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  SCIENTIFIC HYPOTHESIS
                </span>
                <h4 className="text-xs font-bold text-white">Theoretical Proposals</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Plausible models proposed to resolve cosmological tensions (e.g. Tegmark Multiverse Levels I-IV, Ekpyrotic Brane Collisions, String Theory Landscape) awaiting empirical falsifiability tests.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-pink-800/60 space-y-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-800">
                  SPECULATIVE SCI-FI
                </span>
                <h4 className="text-xs font-bold text-white">Creative Exploration</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Fictional, counterfactual, or cinematic timeline divergence scenarios designed for narrative exploration and philosophical inquiry. Never presented as proven empirical truth.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
