import { useState } from 'react';
import type { UserProfile, Language, PersonalityTrait, Genre } from '../lib/types';

interface Props {
  sessionId: string;
  onComplete: (profile: UserProfile) => void;
}

const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: 'Hindi', label: 'Hindi', flag: '🇮🇳' },
  { value: 'Marathi', label: 'Marathi', flag: '🏔️' },
  { value: 'English', label: 'English', flag: '🌍' },
  { value: 'Punjabi', label: 'Punjabi', flag: '🌾' },
  { value: 'Telugu', label: 'Telugu', flag: '🌴' },
  { value: 'Tamil', label: 'Tamil', flag: '🎭' },
  { value: 'Bengali', label: 'Bengali', flag: '🐯' },
];

const PERSONALITIES: { value: PersonalityTrait; label: string; emoji: string; desc: string }[] = [
  { value: 'gangster', label: 'Gangster', emoji: '🥷', desc: 'Bold & fearless' },
  { value: 'romantic', label: 'Romantic', emoji: '💘', desc: 'Love & feelings' },
  { value: 'chill', label: 'Chill', emoji: '😎', desc: 'Easy going vibes' },
  { value: 'emotional', label: 'Emotional', emoji: '🥺', desc: 'Deep & soulful' },
  { value: 'aesthetic', label: 'Aesthetic', emoji: '✨', desc: 'Artsy & dreamy' },
  { value: 'spiritual', label: 'Spiritual', emoji: '🙏', desc: 'Peace & devotion' },
  { value: 'attitude', label: 'Attitude', emoji: '💅', desc: 'Confident & fierce' },
  { value: 'social', label: 'Social', emoji: '🎉', desc: 'Fun & outgoing' },
];

const GENRES: { value: Genre; label: string }[] = [
  { value: 'Pop', label: 'Pop' },
  { value: 'Hip-Hop', label: 'Hip-Hop' },
  { value: 'Romantic', label: 'Romantic' },
  { value: 'Sad', label: 'Sad / Emotional' },
  { value: 'Dance', label: 'Dance / Party' },
  { value: 'Folk', label: 'Folk' },
  { value: 'Indie', label: 'Indie' },
  { value: 'R&B', label: 'R&B' },
  { value: 'Motivational', label: 'Motivational' },
  { value: 'Spiritual', label: 'Spiritual' },
];

const INTENTS = [
  { value: 'stories', label: 'Stories', emoji: '📱' },
  { value: 'reels', label: 'Reels', emoji: '🎬' },
  { value: 'posts', label: 'Posts', emoji: '🖼️' },
];

export default function Onboarding({ sessionId, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [langs, setLangs] = useState<Language[]>([]);
  const [traits, setTraits] = useState<PersonalityTrait[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [artistInput, setArtistInput] = useState('');
  const [artists, setArtists] = useState<string[]>([]);
  const [intent, setIntent] = useState<'stories' | 'reels' | 'posts'>('stories');
  const [region, setRegion] = useState('');

  function toggle<T>(arr: T[], setArr: (a: T[]) => void, val: T) {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }

  function addArtist() {
    const trimmed = artistInput.trim();
    if (trimmed && !artists.includes(trimmed)) {
      setArtists([...artists, trimmed]);
    }
    setArtistInput('');
  }

  function handleFinish() {
    const profile: UserProfile = {
      session_id: sessionId,
      preferred_languages: langs.length > 0 ? langs : ['Hindi'],
      personality_traits: traits.length > 0 ? traits : ['chill'],
      favorite_genres: genres,
      favorite_artists: artists,
      usage_intent: intent,
      age_group: '',
      region,
    };
    onComplete(profile);
  }

  const steps = [
    {
      title: 'Which languages do you vibe with?',
      subtitle: 'Select all that apply',
      content: (
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map(l => (
            <button
              key={l.value}
              onClick={() => toggle(langs, setLangs, l.value)}
              className={`lang-pill ${langs.includes(l.value) ? 'selected' : ''}`}
            >
              <span className="text-2xl">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'What\'s your vibe?',
      subtitle: 'Pick your personality (multiple allowed)',
      content: (
        <div className="grid grid-cols-2 gap-3">
          {PERSONALITIES.map(p => (
            <button
              key={p.value}
              onClick={() => toggle(traits, setTraits, p.value)}
              className={`personality-card ${traits.includes(p.value) ? 'selected' : ''}`}
            >
              <span className="text-3xl">{p.emoji}</span>
              <span className="font-semibold text-sm">{p.label}</span>
              <span className="text-xs opacity-60">{p.desc}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Your music taste',
      subtitle: 'Pick genres you love',
      content: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {GENRES.map(g => (
              <button
                key={g.value}
                onClick={() => toggle(genres, setGenres, g.value)}
                className={`genre-tag ${genres.includes(g.value) ? 'selected' : ''}`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Favorite artists (optional)</p>
            <div className="flex gap-2">
              <input
                className="onboard-input flex-1"
                placeholder="e.g. Arijit Singh, AP Dhillon..."
                value={artistInput}
                onChange={e => setArtistInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addArtist()}
              />
              <button onClick={addArtist} className="btn-sm">Add</button>
            </div>
            {artists.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {artists.map(a => (
                  <span key={a} className="artist-chip">
                    {a}
                    <button onClick={() => setArtists(artists.filter(x => x !== a))} className="ml-1 opacity-60 hover:opacity-100">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'How do you use Instagram?',
      subtitle: 'This helps us tune the energy level',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {INTENTS.map(i => (
              <button
                key={i.value}
                onClick={() => setIntent(i.value as typeof intent)}
                className={`intent-card ${intent === i.value ? 'selected' : ''}`}
              >
                <span className="text-3xl">{i.emoji}</span>
                <span className="text-sm font-medium">{i.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Your region (optional)</p>
            <input
              className="onboard-input w-full"
              placeholder="e.g. Maharashtra, Punjab, Delhi..."
              value={region}
              onChange={e => setRegion(e.target.value)}
            />
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* Header */}
        <div className="onboard-header">
          <div className="brand-logo">
            <span className="brand-icon">🎵</span>
            <span className="brand-name">VibeSync</span>
          </div>
          <p className="brand-tagline">AI Music for Your Moments</p>
        </div>

        {/* Progress dots */}
        <div className="progress-dots">
          {steps.map((_, i) => (
            <div key={i} className={`dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
          ))}
        </div>

        {/* Step content */}
        <div className="step-content">
          <h2 className="step-title">{current.title}</h2>
          <p className="step-subtitle">{current.subtitle}</p>
          <div className="step-body">{current.content}</div>
        </div>

        {/* Navigation */}
        <div className="onboard-nav">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="btn-back">Back</button>
          )}
          <button
            onClick={isLast ? handleFinish : () => setStep(step + 1)}
            className="btn-next"
          >
            {isLast ? "Let's Vibe! 🎶" : 'Next →'}
          </button>
        </div>

        {step === 0 && (
          <button onClick={handleFinish} className="skip-btn">Skip setup →</button>
        )}
      </div>
    </div>
  );
}
