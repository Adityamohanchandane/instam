import { useRef, useState } from "react";
import { Upload, Camera } from "lucide-react";
import type { MoodType, SceneType, ColorTone } from "../lib/types";
import { analyzeImageFile, type RealImageAnalysis } from "../lib/real-image-analyzer";

interface Props {
  onAnalyzed: (
    mood: MoodType,
    scene: SceneType,
    colorTone: ColorTone,
    imageUrl: string,
    analysis?: RealImageAnalysis,
  ) => void;
}

const API_BASE_URL = import.meta.env.DEV ? "http://localhost:3001/api" : "/api";

const MOOD_MAP: Record<string, MoodType> = {
  calm: "peaceful",
  chill: "peaceful",
  dreamy: "peaceful",
  emotional: "sad",
  excited: "energetic",
  fun: "happy",
  melancholy: "sad",
  melancholic: "sad",
  neutral: "happy",
  upbeat: "energetic",
};

const SCENE_MAP: Record<string, SceneType> = {
  celebration: "party",
  club: "party",
  drive: "city",
  general: "selfie",
  indoor: "selfie",
  mountain: "nature",
  outdoor: "nature",
  restaurant: "friends",
  road: "travel",
  sunset: "beach",
  sunrise: "morning",
  urban: "city",
};

function normalizeMood(value?: string): MoodType | null {
  const mood = value?.toLowerCase().trim();
  if (!mood) return null;
  const allowed: MoodType[] = [
    "happy",
    "sad",
    "attitude",
    "romantic",
    "energetic",
    "peaceful",
    "nostalgic",
    "aggressive",
    "confident",
    "lonely",
    "party",
  ];
  if (allowed.includes(mood as MoodType)) return mood as MoodType;
  return MOOD_MAP[mood] || null;
}

function normalizeScene(value?: string): SceneType | null {
  const scene = value?.toLowerCase().trim();
  if (!scene) return null;
  const allowed: SceneType[] = [
    "selfie",
    "travel",
    "gym",
    "night",
    "party",
    "nature",
    "couple",
    "alone",
    "friends",
    "city",
    "beach",
    "morning",
    "rain",
  ];
  if (allowed.includes(scene as SceneType)) return scene as SceneType;
  return SCENE_MAP[scene] || null;
}

// Fast filename/context heuristic for scenes where browser AI/API is unavailable.
function analyzeImageName(file: File): {
  mood: MoodType;
  scene: SceneType;
  colorTone: ColorTone;
} {
  const name = file.name.toLowerCase();

  let scene: SceneType = "selfie";
  if (
    name.includes("travel") ||
    name.includes("trip") ||
    name.includes("vacation")
  )
    scene = "travel";
  else if (
    name.includes("gym") ||
    name.includes("workout") ||
    name.includes("fitness")
  )
    scene = "gym";
  else if (name.includes("night") || name.includes("dark")) scene = "night";
  else if (
    name.includes("party") ||
    name.includes("club") ||
    name.includes("celebration")
  )
    scene = "party";
  else if (
    name.includes("nature") ||
    name.includes("forest") ||
    name.includes("mountain")
  )
    scene = "nature";
  else if (name.includes("couple") || name.includes("love")) scene = "couple";
  else if (name.includes("rain")) scene = "rain";
  else if (
    name.includes("beach") ||
    name.includes("sea") ||
    name.includes("ocean")
  )
    scene = "beach";
  else if (name.includes("morning") || name.includes("sunrise"))
    scene = "morning";
  else if (
    name.includes("friend") ||
    name.includes("squad") ||
    name.includes("group")
  )
    scene = "friends";

  const mood: MoodType =
    scene === "party"
      ? "party"
      : scene === "gym"
        ? "energetic"
        : scene === "couple"
          ? "romantic"
          : scene === "nature" || scene === "morning"
            ? "peaceful"
            : scene === "night"
              ? "attitude"
              : scene === "rain"
                ? "nostalgic"
                : "happy";

  const colorTone: ColorTone =
    scene === "night" || name.includes("dark") || name.includes("black")
      ? "dark"
      : scene === "morning" ||
          name.includes("golden") ||
          name.includes("sunset")
        ? "golden"
        : scene === "party" || name.includes("neon")
          ? "neon"
          : scene === "nature"
            ? "warm"
            : scene === "beach"
              ? "vibrant"
              : "warm";

  return { mood, scene, colorTone };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function analyzeImagePixels(
  imageUrl: string,
  fallback: { mood: MoodType; scene: SceneType; colorTone: ColorTone },
) {
  try {
    const img = await loadImage(imageUrl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fallback;

    canvas.width = Math.min(img.width, 120);
    canvas.height = Math.min(img.height, 120);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let total = 0;
    let brightness = 0;
    let warm = 0;
    let cool = 0;
    let saturation = 0;

    for (let index = 0; index < pixels.length; index += 16) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      brightness += (red + green + blue) / 765;
      saturation += max === 0 ? 0 : (max - min) / max;
      warm += red + green * 0.55 - blue;
      cool += blue + green * 0.35 - red;
      total += 1;
    }

    brightness /= total;
    saturation /= total;

    let colorTone: ColorTone = fallback.colorTone;
    if (brightness < 0.24) colorTone = "dark";
    else if (saturation > 0.48 && cool > warm) colorTone = "neon";
    else if (saturation > 0.42) colorTone = "vibrant";
    else if (warm > cool * 1.25 && brightness > 0.55) colorTone = "golden";
    else if (cool > warm * 1.1) colorTone = "cool";
    else if (brightness < 0.38) colorTone = "moody";
    else colorTone = "warm";

    let mood = fallback.mood;
    if (colorTone === "dark" || colorTone === "moody")
      mood = fallback.scene === "couple" ? "romantic" : "attitude";
    if (colorTone === "golden")
      mood = fallback.scene === "couple" ? "romantic" : "peaceful";
    if (colorTone === "neon" || colorTone === "vibrant")
      mood = fallback.scene === "night" ? "attitude" : "energetic";
    if (fallback.scene === "rain") mood = "nostalgic";

    return { ...fallback, mood, colorTone };
  } catch (error) {
    console.warn("Pixel analysis fallback used:", error);
    return fallback;
  }
}

async function analyzeWithServerAI(imageUrl: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageUrl }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const analysis = data.analysis || data;
    const mood = normalizeMood(analysis.mood);
    const scene = normalizeScene(analysis.scene_type || analysis.scene);

    if (!mood && !scene) return null;
    return { mood, scene };
  } catch (error) {
    console.log("AI image API unavailable, using browser analysis:", error);
    return null;
  }
}

async function analyzeImage(
  file: File,
  imageUrl: string,
): Promise<{ mood: MoodType; scene: SceneType; colorTone: ColorTone; analysis: RealImageAnalysis }> {
  try {
    console.log('🧠 Starting real AI image analysis...');
    
    // Use the new real image analyzer
    const analysis = await analyzeImageFile(file);
    
    console.log('✅ Real AI analysis complete:', {
      mood: analysis.mood.primary,
      scene: analysis.scene.type,
      colorTone: analysis.colors.colorTone,
      confidence: analysis.mood.confidence,
      objects: analysis.objects.length,
      aiProvider: analysis.aiProvider
    });

    return {
      mood: analysis.mood.primary,
      scene: analysis.scene.type,
      colorTone: analysis.colors.colorTone,
      analysis
    };
  } catch (error) {
    console.error('❌ Real AI analysis failed, falling back to basic analysis:', error);
    
    // Fallback to basic analysis
    const nameAnalysis = analyzeImageName(file);
    const pixelAnalysis = await analyzeImagePixels(imageUrl, nameAnalysis);
    
    return {
      mood: pixelAnalysis.mood,
      scene: pixelAnalysis.scene,
      colorTone: pixelAnalysis.colorTone,
      analysis: {
        objects: [],
        faces: { detected: false, count: 0, confidence: 0 },
        scene: { type: pixelAnalysis.scene, confidence: 0.3, lighting: 'natural', timeOfDay: 'afternoon', environment: 'unknown' },
        colors: { dominantColors: ['neutral'], colorTone: pixelAnalysis.colorTone, warmth: 0.5, brightness: 0.5, saturation: 0.5 },
        mood: { primary: pixelAnalysis.mood, secondary: [], confidence: 0.3, energy: 5, valence: 0.5, reasoning: ['Fallback analysis used'] },
        timestamp: Date.now(),
        processingTime: 0,
        aiProvider: 'fallback'
      }
    };
  }
}

export default function ImageUpload({ onAnalyzed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');

  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  function processFile(file: File) {
    if (!file.type.startsWith("image/")) {
      console.warn("Rejected upload: not an image");
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.warn("Rejected upload: unsupported format", file.type);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      console.warn("Rejected upload: file too large", file.size);
      return;
    }
    setAnalyzing(true);
    setAnalysisStep('Loading image...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const url = event.target?.result as string;
      setPreview(url);
      
      // Simulate AI analysis steps for better UX
      setAnalysisStep('Initializing AI models...');
      await new Promise(r => setTimeout(r, 500));
      
      setAnalysisStep('Detecting objects and scenes...');
      await new Promise(r => setTimeout(r, 800));
      
      setAnalysisStep('Analyzing colors and mood...');
      await new Promise(r => setTimeout(r, 600));

      const result = await analyzeImage(file, url);
      setAnalyzing(false);
      setAnalysisStep('');
      onAnalyzed(result.mood, result.scene, result.colorTone, url, result.analysis);
    };
    reader.onerror = () => {
      setAnalyzing(false);
      setAnalysisStep('');
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div
      className={`upload-zone ${dragOver ? "drag-over" : ""} ${preview ? "has-image" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !preview && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {preview ? (
        <div className="relative w-full h-full">
          <img src={preview} alt="Uploaded" className="upload-preview" />
          {analyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg backdrop-blur-sm">
              <div className="text-white text-center px-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg font-medium mb-2">AI is thinking...</p>
                <p className="text-sm text-white/80">{analysisStep}</p>
              </div>
            </div>
          )}
          {!analyzing && (
            <button
              className="change-photo-btn"
              onClick={(e) => {
                e.stopPropagation();
                console.log("Change photo button clicked");
                setPreview(null);
                inputRef.current?.click();
              }}
            >
              Change Photo
            </button>
          )}
        </div>
      ) : (
        <div className="upload-placeholder">
          <div className="upload-icon-wrap">
            <Upload size={28} />
          </div>
          <p className="upload-title">Drop your Instagram photo here</p>
          <p className="upload-subtitle">AI will read mood, scene and vibe</p>
          <div className="upload-hint">
            <Camera size={14} />
            <span>Selfie, travel, gym, night out, couple, rain...</span>
          </div>
        </div>
      )}
    </div>
  );
}
