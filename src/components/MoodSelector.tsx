import type { MoodType, SceneType, ColorTone } from '../lib/types';

interface Props {
  imageMood: MoodType;
  imageScene: SceneType;
  imageColorTone: ColorTone;
  userMoodOverride: MoodType | '';
  onMoodChange: (mood: MoodType | '') => void;
  onSceneChange: (scene: SceneType) => void;
  onColorChange: (color: ColorTone) => void;
}

const MOODS: { value: MoodType; label: string; emoji: string }[] = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'attitude', label: 'Attitude', emoji: '😤' },
  { value: 'romantic', label: 'Romantic', emoji: '💕' },
  { value: 'energetic', label: 'Energetic', emoji: '⚡' },
  { value: 'peaceful', label: 'Peaceful', emoji: '🌿' },
  { value: 'nostalgic', label: 'Nostalgic', emoji: '🌅' },
  { value: 'aggressive', label: 'Aggressive', emoji: '🔥' },
  { value: 'confident', label: 'Confident', emoji: '💪' },
  { value: 'lonely', label: 'Lonely', emoji: '🌙' },
  { value: 'party', label: 'Party', emoji: '🎉' },
];

const SCENES: { value: SceneType; label: string; emoji: string }[] = [
  { value: 'selfie', label: 'Selfie', emoji: '🤳' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'gym', label: 'Gym', emoji: '🏋️' },
  { value: 'night', label: 'Night', emoji: '🌙' },
  { value: 'party', label: 'Party', emoji: '🎊' },
  { value: 'nature', label: 'Nature', emoji: '🌿' },
  { value: 'couple', label: 'Couple', emoji: '👫' },
  { value: 'alone', label: 'Alone', emoji: '🪞' },
  { value: 'friends', label: 'Friends', emoji: '👯' },
  { value: 'city', label: 'City', emoji: '🏙️' },
  { value: 'beach', label: 'Beach', emoji: '🏖️' },
  { value: 'morning', label: 'Morning', emoji: '☀️' },
  { value: 'rain', label: 'Rain', emoji: '🌧️' },
];

const COLORS: { value: ColorTone; label: string; style: string }[] = [
  { value: 'dark', label: 'Dark', style: 'bg-gray-900 border-gray-700' },
  { value: 'warm', label: 'Warm', style: 'bg-amber-800 border-amber-600' },
  { value: 'vibrant', label: 'Vibrant', style: 'bg-rose-600 border-rose-400' },
  { value: 'moody', label: 'Moody', style: 'bg-slate-700 border-slate-500' },
  { value: 'neon', label: 'Neon', style: 'bg-cyan-700 border-cyan-400' },
  { value: 'golden', label: 'Golden', style: 'bg-yellow-700 border-yellow-500' },
  { value: 'cool', label: 'Cool', style: 'bg-blue-800 border-blue-500' },
];

export default function MoodSelector({ imageMood, imageScene, imageColorTone, userMoodOverride, onMoodChange, onSceneChange, onColorChange }: Props) {
  return (
    <div className="mood-selector">
      <div className="selector-section">
        <h3 className="selector-label">Override Mood</h3>
        <div className="mood-grid">
          <button
            onClick={() => onMoodChange('')}
            className={`mood-chip ${userMoodOverride === '' ? 'active' : ''}`}
          >
            <span>🤖</span>
            <span className="text-xs">Auto</span>
          </button>
          {MOODS.map(m => (
            <button
              key={m.value}
              onClick={() => {
                console.log('Mood selected:', m.value, 'Current override:', userMoodOverride);
                onMoodChange(m.value);
              }}
              className={`mood-chip ${userMoodOverride === m.value ? 'active' : imageMood === m.value ? 'detected' : ''}`}
            >
              <span>{m.emoji}</span>
              <span className="text-xs">{m.label}</span>
              {imageMood === m.value && userMoodOverride === '' && (
                <span className="detected-dot" title="Auto detected" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="selector-section">
        <h3 className="selector-label">Scene</h3>
        <div className="scene-scroll">
          {SCENES.map(s => (
            <button
              key={s.value}
              onClick={() => onSceneChange(s.value)}
              className={`scene-chip ${imageScene === s.value ? 'active' : ''}`}
            >
              <span>{s.emoji}</span>
              <span className="text-xs">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="selector-section">
        <h3 className="selector-label">Color Tone</h3>
        <div className="color-scroll">
          {COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => {
                console.log('Color tone selected:', c.value);
                onColorChange(c.value);
              }}
              className={`color-chip border-2 ${c.style} ${imageColorTone === c.value ? 'ring-2 ring-white scale-110' : 'opacity-70'}`}
            >
              <span className="text-xs text-white font-medium">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
