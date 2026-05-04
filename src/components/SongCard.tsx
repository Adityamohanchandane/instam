import { useState, useRef, useEffect } from 'react';
import { Heart, SkipForward, CheckCircle, Music, TrendingUp, Star, Zap, Play, Pause, ExternalLink, Clock, Camera, Download, Image } from 'lucide-react';
import type { SongWithReason } from '../lib/types';

interface Props {
  song: SongWithReason;
  onLike: () => void;
  onSkip: () => void;
  onSelect: () => void;
  isSelected?: boolean;
  onDownload?: (song: SongWithReason) => void;
  onSetOnPhoto?: (song: SongWithReason) => void;
}

const ENERGY_COLORS = ['', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a'];

const LANG_FLAGS: Record<string, string> = {
  hindi: '🇮🇳',
  marathi: '🏔️',
  english: '🌍',
  punjabi: '🌾',
  telugu: '🌴',
  tamil: '🎭',
  bengali: '🐯',
};

function getLangFlag(lang: string) {
  const lower = lang.toLowerCase();
  for (const [key, flag] of Object.entries(LANG_FLAGS)) {
    if (lower.includes(key)) return flag;
  }
  return '🎵';
}

function getAudioUrl(song: SongWithReason): string {
  // Using demo audio for now - in production you'd use real audio URLs
  const songNumber = (song.id.charCodeAt(0) % 10) + 1;
  return `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${songNumber}.mp3`;
}

function getYouTubeUrl(song: SongWithReason): string {
  if (song.youtube_query) {
    const query = encodeURIComponent(`${song.title} ${song.artist} official audio`);
    return `https://www.youtube.com/results?search_query=${query}`;
  }
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.title} ${song.artist}`)}`;
}

function getInstagramAudioUrl(song: SongWithReason): string {
  // Instagram-style short clip (15-30 seconds)
  // In production, this would connect to Instagram's music library
  const songNumber = (song.id.charCodeAt(0) % 10) + 1;
  return `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${songNumber}.mp3#t=0,30`;
}

function getInstagramReelsUrl(song: SongWithReason): string {
  // Since we can't access Instagram API directly, we'll search on YouTube instead
  // for short-form content similar to Instagram Reels
  const query = encodeURIComponent(`${song.title} ${song.artist} short video reel`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

export default function SongCard({ song, onLike, onSkip, onSelect, isSelected, onDownload, onSetOnPhoto }: Props) {
  const [liked, setLiked] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCurrentPlaying, setIsCurrentPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<'full' | 'clip'>('clip');
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle global play state (only one song can play at a time)
  useEffect(() => {
    const handleSongPlayingEvent = (e: any) => {
      const playingSongId = e.detail.songId;
      if (playingSongId !== song.id) {
        setIsCurrentPlaying(false);
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    };

    // Listen for custom event when another song starts playing
    window.addEventListener('songPlaying', handleSongPlayingEvent);

    return () => {
      window.removeEventListener('songPlaying', handleSongPlayingEvent);
    };
  }, [song.id]);

  function handleLike() {
    setLiked(true);
    onLike();
  }

  function handleSkip() {
    setSkipped(true);
    onSkip();
  }

  function handlePlayPause() {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsCurrentPlaying(false);
    } else {
      // Stop all other songs
      window.dispatchEvent(new CustomEvent('songPlaying', { detail: { songId: song.id } }));
      
      // Update audio source based on play mode
      const audioUrl = playMode === 'clip' ? getInstagramAudioUrl(song) : getAudioUrl(song);
      audioRef.current.src = audioUrl;
      
      // Try to play with error handling
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsCurrentPlaying(true);
          })
          .catch(error => {
            console.error('Audio play failed:', error);
            // Handle autoplay policy - show user message
            alert('Audio playback requires user interaction. Please click again to play.');
          });
      }
    }
  }

  function togglePlayMode() {
    const newMode = playMode === 'clip' ? 'full' : 'clip';
    setPlayMode(newMode);
    
    // If currently playing, restart with new mode
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      const newUrl = newMode === 'clip' ? getInstagramAudioUrl(song) : getAudioUrl(song);
      audioRef.current.src = newUrl;
      audioRef.current.play();
    }
  }

  function handleSongClick() {
    handlePlayPause();
    onSelect();
  }

  function handleDownload() {
    if (onDownload) {
      onDownload(song);
    }
  }

  function handleSetOnPhoto() {
    if (onSetOnPhoto) {
      onSetOnPhoto(song);
    }
  }

  if (skipped) return null;

  const energyColor = ENERGY_COLORS[song.energy_level] || '#6b7280';

  return (
    <div className={`song-card ${isSelected ? 'selected' : ''} ${liked ? 'liked' : ''} ${isCurrentPlaying ? 'playing' : ''}`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={getAudioUrl(song)}
        onEnded={() => {
          setIsPlaying(false);
          setIsCurrentPlaying(false);
        }}
      />
      
      {/* Labels */}
      <div className="card-labels">
        {song.label === 'safe' && (
          <span className="label safe"><Star size={10} /> Safe Choice</span>
        )}
        {song.label === 'unique' && (
          <span className="label unique"><Zap size={10} /> Unique Pick</span>
        )}
        {song.label === 'trending' && (
          <span className="label trending"><TrendingUp size={10} /> Trending</span>
        )}
      </div>

      {/* Song info */}
      <div className="card-body" onClick={handleSongClick} style={{ cursor: 'pointer' }}>
        <div className="song-icon">
          {isCurrentPlaying ? <Pause size={22} /> : <Play size={22} />}
        </div>
        <div className="song-info">
          <h3 className="song-title">{song.title}</h3>
          <p className="song-artist">{song.artist}</p>
          <div className="song-meta">
            <span className="lang-badge">{getLangFlag(song.language)} {song.language}</span>
            <span className="genre-badge">{song.genre}</span>
            {isCurrentPlaying && <span className="playing-badge">🎵 Playing {playMode === 'clip' ? '(30s)' : '(Full)'}</span>}
            <span className="mode-badge" onClick={(e) => { 
                e.stopPropagation(); 
                console.log('Play mode toggled for:', song.title);
                togglePlayMode(); 
              }}>
              {playMode === 'clip' ? <Clock size={10} /> : <Music size={10} />}
              {playMode === 'clip' ? ' Clip' : ' Full'}
            </span>
          </div>
        </div>
      </div>

      {/* Energy bar */}
      <div className="energy-bar-container">
        <span className="energy-label">Energy</span>
        <div className="energy-bar-track">
          <div
            className="energy-bar-fill"
            style={{ width: `${song.energy_level * 10}%`, backgroundColor: energyColor }}
          />
        </div>
        <span className="energy-value">{song.energy_level}/10</span>
      </div>

      {/* Reason */}
      <p className="song-reason">
        <span className="reason-icon">✦</span> {song.reason}
      </p>

      {/* Actions */}
      <div className="card-actions">
        <button
          onClick={() => {
            console.log('Skip button clicked for:', song.title);
            handleSkip();
          }}
          className="action-btn skip"
          title="Skip this song"
        >
          <SkipForward size={16} />
        </button>
        <button
          onClick={() => {
            console.log('Like button clicked for:', song.title, 'Current liked:', liked);
            handleLike();
          }}
          className={`action-btn like ${liked ? 'active' : ''}`}
          title="Like"
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={() => {
            console.log('Select button clicked for:', song.title, 'Current selected:', isSelected);
            onSelect();
          }}
          className={`action-btn select ${isSelected ? 'active' : ''}`}
          title="Use this song"
        >
          <CheckCircle size={16} />
          <span>{isSelected ? 'Selected' : 'Use'}</span>
        </button>
        <a
          href={getYouTubeUrl(song)}
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn youtube"
          title="Play on YouTube"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={16} />
          <span>YouTube</span>
        </a>
        <a
          href={getInstagramReelsUrl(song)}
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn instagram"
          title="Find similar short videos"
          onClick={(e) => e.stopPropagation()}
        >
          <Camera size={16} />
          <span>Shorts</span>
        </a>
        <button
          onClick={() => {
            console.log('Download button clicked for:', song.title);
            handleDownload();
          }}
          className="action-btn download"
          title="Download music"
        >
          <Download size={16} />
          <span>Download</span>
        </button>
        <button
          onClick={() => {
            console.log('Set on photo button clicked for:', song.title);
            handleSetOnPhoto();
          }}
          className="action-btn set-on-photo"
          title="Set music on photo"
        >
          <Image size={16} />
          <span>Set on Photo</span>
        </button>
      </div>
    </div>
  );
}
