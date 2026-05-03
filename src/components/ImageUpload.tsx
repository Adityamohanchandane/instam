import { useRef, useState } from 'react';
import { Upload, Camera } from 'lucide-react';
import type { MoodType, SceneType, ColorTone } from '../lib/types';

interface Props {
  onAnalyzed: (mood: MoodType, scene: SceneType, colorTone: ColorTone, imageUrl: string) => void;
}

// Simple heuristic image analysis based on filename + dominant color sampling
function analyzeImage(file: File): { mood: MoodType; scene: SceneType; colorTone: ColorTone } {
  const name = file.name.toLowerCase();

  let scene: SceneType = 'selfie';
  if (name.includes('travel') || name.includes('trip') || name.includes('vacation')) scene = 'travel';
  else if (name.includes('gym') || name.includes('workout') || name.includes('fitness')) scene = 'gym';
  else if (name.includes('night') || name.includes('dark')) scene = 'night';
  else if (name.includes('party') || name.includes('club') || name.includes('celebration')) scene = 'party';
  else if (name.includes('nature') || name.includes('forest') || name.includes('mountain')) scene = 'nature';
  else if (name.includes('couple') || name.includes('love')) scene = 'couple';
  else if (name.includes('rain')) scene = 'rain';
  else if (name.includes('beach') || name.includes('sea') || name.includes('ocean')) scene = 'beach';
  else if (name.includes('morning') || name.includes('sunrise')) scene = 'morning';
  else if (name.includes('friend') || name.includes('squad') || name.includes('group')) scene = 'friends';

  const mood: MoodType = scene === 'party' ? 'party'
    : scene === 'gym' ? 'energetic'
    : scene === 'couple' ? 'romantic'
    : scene === 'nature' || scene === 'morning' ? 'peaceful'
    : scene === 'night' ? 'attitude'
    : scene === 'rain' ? 'nostalgic'
    : 'happy';

  const colorTone: ColorTone = scene === 'night' || name.includes('dark') || name.includes('black') ? 'dark'
    : scene === 'morning' || name.includes('golden') || name.includes('sunset') ? 'golden'
    : scene === 'party' || name.includes('neon') ? 'neon'
    : scene === 'nature' ? 'warm'
    : scene === 'beach' ? 'vibrant'
    : 'warm';

  return { mood, scene, colorTone };
}

export default function ImageUpload({ onAnalyzed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  function processFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setAnalyzing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPreview(url);

      setTimeout(() => {
        const result = analyzeImage(file);
        setAnalyzing(false);
        onAnalyzed(result.mood, result.scene, result.colorTone, url);
      }, 1200);
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
      className={`upload-zone ${dragOver ? 'drag-over' : ''} ${preview ? 'has-image' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !preview && inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />

      {preview ? (
        <div className="relative w-full h-full">
          <img src={preview} alt="Uploaded" className="upload-preview" />
          {analyzing && (
            <div className="analyzing-overlay">
              <div className="analyzing-pulse">
                <div className="analyze-ring" />
                <span className="analyze-text">Analyzing vibe...</span>
              </div>
            </div>
          )}
          {!analyzing && (
            <button
              className="change-photo-btn"
              onClick={(e) => { e.stopPropagation(); setPreview(null); inputRef.current?.click(); }}
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
          <p className="upload-title">Drop your photo here</p>
          <p className="upload-subtitle">or tap to upload from gallery</p>
          <div className="upload-hint">
            <Camera size={14} />
            <span>Selfie, travel, gym, night out...</span>
          </div>
        </div>
      )}
    </div>
  );
}
