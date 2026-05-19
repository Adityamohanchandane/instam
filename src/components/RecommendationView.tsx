import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Settings } from "lucide-react";
import { getRecommendations } from "../lib/recommender";
import { AIRecommendationEngine } from "../lib/ai-recommendation-engine";
import { mongodb } from "../lib/mongodb";
import SongCard from "./SongCard";
import MoodSelector from "./MoodSelector";
import ImageUpload from "./ImageUpload";
import type {
  UserProfile,
  Song,
  SongWithReason,
  MoodType,
  SceneType,
  ColorTone,
  RecommendationResult,
} from "../lib/types";
import type { RealImageAnalysis } from "../lib/real-image-analyzer";

interface Props {
  userProfile: UserProfile;
  onEditProfile: () => void;
}

const MOOD_SEARCH_WORDS: Record<MoodType, string[]> = {
  happy: ["happy", "feel good", "good vibes"],
  sad: ["sad", "emotional", "heart touching"],
  attitude: ["attitude", "swag", "bold"],
  romantic: ["romantic", "love", "couple"],
  energetic: ["energetic", "dance", "power"],
  peaceful: ["peaceful", "chill", "lofi"],
  nostalgic: ["nostalgic", "old memories", "yaad"],
  aggressive: ["aggressive", "power", "rap"],
  confident: ["confident", "motivation", "swag"],
  lonely: ["lonely", "alone", "sad"],
  party: ["party", "dance", "club"],
};

const SCENE_SEARCH_WORDS: Record<SceneType, string[]> = {
  selfie: ["selfie", "instagram story"],
  travel: ["travel", "journey", "safar"],
  gym: ["gym", "workout", "motivation"],
  night: ["night", "city lights", "dark"],
  party: ["party", "celebration", "dance"],
  nature: ["nature", "calm", "fresh"],
  couple: ["couple", "love", "romantic"],
  alone: ["alone", "lonely", "sad"],
  friends: ["friends", "fun", "yaari"],
  city: ["city", "urban", "drive"],
  beach: ["beach", "sunset", "summer"],
  morning: ["morning", "sunrise", "fresh"],
  rain: ["rain", "barsaat", "nostalgic"],
};

const COLOR_SEARCH_WORDS: Record<ColorTone, string[]> = {
  dark: ["dark", "night"],
  warm: ["warm", "soft"],
  vibrant: ["vibrant", "viral"],
  moody: ["moody", "emotional"],
  neon: ["neon", "club"],
  golden: ["golden hour", "sunset"],
  cool: ["cool", "chill"],
};

function getPreviewAudioUrl(song: SongWithReason): string {
  if (song.preview_url) return song.preview_url;
  const songNumber = (song.id.charCodeAt(0) % 10) + 1;
  return `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${songNumber}.mp3`;
}

function dedupeSongs(items: Song[]): Song[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.title.toLowerCase()}_${item.artist.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function RecommendationView({
  userProfile,
  onEditProfile,
}: Props) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [results, setResults] = useState<RecommendationResult | null>(null);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [recSessionId, setRecSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [showMoodPanel, setShowMoodPanel] = useState(true);
  const [hasImage, setHasImage] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<RealImageAnalysis | null>(null);
  const [aiEngine] = useState(() => new AIRecommendationEngine());

  const [imageMood, setImageMood] = useState<MoodType>("happy");
  const [imageScene, setImageScene] = useState<SceneType>("selfie");
  const [imageColorTone, setImageColorTone] = useState<ColorTone>("warm");
  const [userMoodOverride, setUserMoodOverride] = useState<MoodType | "">("");

  const primaryTrait = userProfile.personality_traits?.[0];

  useEffect(() => {
    loadSongs();
  }, []);

  async function loadSongs() {
    try {
      await mongodb.connect();
      const loadedSongs = await mongodb.getSongs(50);
      if (loadedSongs.length > 0) {
        setSongs(loadedSongs);
      }
    } catch (error) {
      console.log(
        "Song catalog will use local fallback:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  const buildSearchQueries = useCallback(
    (mood: MoodType, scene: SceneType, colorTone: ColorTone) => {
      const preferredLanguage = userProfile.preferred_languages?.[0] || "Hindi";
      const favoriteArtist = userProfile.favorite_artists?.[0];
      const favoriteGenre = userProfile.favorite_genres?.[0];
      const moodWords = MOOD_SEARCH_WORDS[mood] || [mood];
      const sceneWords = SCENE_SEARCH_WORDS[scene] || [scene];
      const colorWords = COLOR_SEARCH_WORDS[colorTone] || [colorTone];

      const queries = [
        favoriteArtist ? `${favoriteArtist} ${moodWords[0]} song` : "",
        favoriteGenre
          ? `${preferredLanguage} ${favoriteGenre} ${moodWords[0]} song`
          : "",
        `${preferredLanguage} ${moodWords[0]} ${sceneWords[0]} instagram song`,
        `${preferredLanguage} ${sceneWords[0]} ${colorWords[0]} reels song`,
        `${preferredLanguage} viral ${moodWords[1] || moodWords[0]} song`,
      ];

      return Array.from(new Set(queries.filter(Boolean))).slice(0, 5);
    },
    [
      userProfile.favorite_artists,
      userProfile.favorite_genres,
      userProfile.preferred_languages,
    ],
  );

  const generateSongMatches = useCallback(
    async function generateSongMatches(
      availableSongs: Song[],
      mood: MoodType,
      scene: SceneType,
      colorTone: ColorTone,
      userMood: MoodType | "",
      freshSkipped: Set<string>,
    ) {
      setLoading(true);
      setLoadingMessage('Searching for perfect songs...');
      try {
        const finalMood = (userMood || mood) as MoodType;
        console.log("🎵 Generating song matches for mood:", finalMood);

        const queries = buildSearchQueries(finalMood, scene, colorTone);
        console.log("🔍 Search queries:", queries);

        const allResults: Song[] = [];
        const seenIds = new Set<string>();

        const preferredLanguage = userProfile.preferred_languages?.[0] || "Hindi";
        setLoadingMessage('Fetching songs from music database...');
        for (const q of queries) {
          if (allResults.length >= 30) break;
          const results = await mongodb.searchSongs(q, preferredLanguage, 10);
          for (const song of results) {
            if (!seenIds.has(song.id)) {
              seenIds.add(song.id);
              allResults.push(song);
            }
          }
        }

        if (allResults.length === 0) {
          console.log("⚠️ No songs found from search, using local songs");
          setLoadingMessage('Loading local song library...');
          const localSongs = await mongodb.getSongs(20);
          allResults.push(...localSongs);
        }

        const input = {
          userProfile,
          imageMood: mood,
          imageScene: scene,
          imageColorTone: colorTone,
          userMoodOverride: userMood,
        };

        setLoadingMessage('AI is analyzing your preferences...');
        // Use basic recommender
        const basicRecs = getRecommendations(allResults, input, freshSkipped);
        
        setLoadingMessage('Applying advanced AI recommendation engine...');
        // Enhance with AI engine
        const enhancedRecs = await aiEngine.getRecommendations({
          mood: finalMood,
          scene,
          colorTone,
          userProfile,
          songs: allResults,
          skippedIds: freshSkipped,
          imageAnalysis
        });

        setLoadingMessage('Finalizing recommendations...');
        // Merge results
        const mergedSongs: SongWithReason[] = basicRecs.songs.map(song => {
          const enhanced = enhancedRecs.songs.find(s => s.id === song.id);
          return {
            ...song,
            matchScore: enhanced?.matchScore || song.matchScore,
            reason: enhanced?.reason || song.reason,
            label: enhanced?.label || song.label
          };
        });

        mergedSongs.sort((a, b) => b.matchScore - a.matchScore);

        const finalRecs: RecommendationResult = {
          songs: mergedSongs.slice(0, 8),
          safeChoice: mergedSongs.find(s => s.label === 'safe') || mergedSongs[0],
          uniquePick: mergedSongs.find(s => s.label === 'unique') || mergedSongs[1] || mergedSongs[0]
        };

        setResults(finalRecs);
        setShowMoodPanel(true);

        try {
          const sessionId = await mongodb.saveSession({
            session_id: userProfile.session_id,
            image_mood: mood,
            image_scene: scene,
            image_color_tone: colorTone,
            user_mood_override: userMood,
            recommended_song_ids: finalRecs.songs.map((song) => song.id),
            safe_choice_id: finalRecs.safeChoice.id,
            unique_pick_id: finalRecs.uniquePick.id,
          });
          if (sessionId) setRecSessionId(sessionId);
        } catch (error) {
          console.log("Recommendation session saved locally only:", error);
        }
      } catch (error) {
        console.log("Song matching fallback failed:", error);
      } finally {
        setLoading(false);
        setLoadingMessage('');
      }
    },
    [buildSearchQueries, songs, userProfile, aiEngine, imageAnalysis],
  );

  function handleImageAnalyzedWithAI(
    mood: MoodType,
    scene: SceneType,
    colorTone: ColorTone,
    _url: string,
    analysis?: RealImageAnalysis,
  ) {
    const freshSkipped = new Set<string>();
    setImageMood(mood);
    setImageScene(scene);
    setImageColorTone(colorTone);
    setHasImage(true);
    setSkippedIds(freshSkipped);
    setImageAnalysis(analysis || null);
    
    console.log('📊 Image analysis received:', {
      mood,
      scene,
      colorTone,
      hasAnalysis: !!analysis,
      confidence: analysis?.mood.confidence,
      objectsDetected: analysis?.objects.length,
      aiProvider: analysis?.aiProvider
    });
    
    generateSongMatches(
      songs,
      mood,
      scene,
      colorTone,
      userMoodOverride,
      freshSkipped,
    );
  }

  function handleRefresh() {
    generateSongMatches(
      songs,
      imageMood,
      imageScene,
      imageColorTone,
      userMoodOverride,
      skippedIds,
    );
  }

  function handleMoodChange(mood: MoodType | "") {
    setUserMoodOverride(mood);
    if (hasImage) {
      generateSongMatches(
        songs,
        imageMood,
        imageScene,
        imageColorTone,
        mood,
        skippedIds,
      );
    }
  }

  function handleSceneChange(scene: SceneType) {
    setImageScene(scene);
    if (hasImage) {
      generateSongMatches(
        songs,
        imageMood,
        scene,
        imageColorTone,
        userMoodOverride,
        skippedIds,
      );
    }
  }

  function handleColorChange(color: ColorTone) {
    setImageColorTone(color);
    if (hasImage) {
      generateSongMatches(
        songs,
        imageMood,
        imageScene,
        color,
        userMoodOverride,
        skippedIds,
      );
    }
  }

  async function handleSkip(song: SongWithReason) {
    const newSkipped = new Set(skippedIds);
    newSkipped.add(song.id);
    setSkippedIds(newSkipped);

    if (recSessionId) {
      try {
        await mongodb.saveFeedback({
          session_id: userProfile.session_id,
          song_id: song.id,
          recommendation_session_id: recSessionId,
          action: "skipped",
        });
      } catch (error) {
        console.log("Skip feedback saved locally only:", error);
      }
    }

    const newResults = getRecommendations(
      songs,
      {
        userProfile,
        imageMood,
        imageScene,
        imageColorTone,
        userMoodOverride,
      },
      newSkipped,
    );
    setResults(newResults);
  }

  async function handleLike(song: SongWithReason) {
    if (!recSessionId) return;

    try {
      await mongodb.saveFeedback({
        session_id: userProfile.session_id,
        song_id: song.id,
        recommendation_session_id: recSessionId,
        action: "liked",
      });
    } catch (error) {
      console.log("Like feedback saved locally only:", error);
    }
  }

  async function handleSelect(song: SongWithReason) {
    setSelectedSong(song.id);

    if (!recSessionId) return;

    try {
      await mongodb.saveFeedback({
        session_id: userProfile.session_id,
        song_id: song.id,
        recommendation_session_id: recSessionId,
        action: "selected",
      });
    } catch (error) {
      console.log("Select feedback saved locally only:", error);
    }
  }

  function handleDownload(song: SongWithReason) {
    try {
      const link = document.createElement("a");
      link.href = getPreviewAudioUrl(song);
      link.download = `${song.title} - ${song.artist}.mp3`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.log("Download failed:", error);
      alert("Download failed. Please try again.");
    }
  }

  function handleSetOnPhoto(song: SongWithReason) {
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
    `;

    const content = document.createElement("div");
    content.style.cssText = `
      background: var(--bg-elevated);
      color: var(--text-primary);
      padding: 24px;
      border-radius: 16px;
      max-width: 380px;
      text-align: center;
      border: 1px solid var(--border);
    `;

    content.innerHTML = `
      <h3 style="margin-bottom: 12px;">🎵 ${song.title}</h3>
      <p style="color: var(--text-secondary); margin-bottom: 18px;">
        हा song तुमच्या story/photo साठी selected आहे. पुढे आपण direct Instagram export feature जोडू शकतो.
      </p>
      <button id="closeSongModal" style="background: var(--accent); color: white; border: none; padding: 10px 16px; border-radius: 10px; cursor: pointer;">Got it</button>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    document.getElementById("closeSongModal")?.addEventListener("click", () => {
      if (document.body.contains(modal)) document.body.removeChild(modal);
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal && document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    });
  }

  return (
    <div className="rec-view">
      <div className="top-bar">
        <div className="top-logo">
          <span>🎵</span>
          <span>Instam</span>
        </div>
        <div className="top-actions">
          <button
            onClick={() => setShowMoodPanel((value) => !value)}
            className="icon-btn"
            title="Tune vibes"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={onEditProfile}
            className="profile-btn"
            title="Edit profile"
          >
            {primaryTrait === "gangster"
              ? "🥷"
              : primaryTrait === "romantic"
                ? "💘"
                : primaryTrait === "chill"
                  ? "😎"
                  : primaryTrait === "spiritual"
                    ? "🙏"
                    : "🎭"}
          </button>
        </div>
      </div>

      <div className="ai-flow-panel">
        <div className="ai-flow-copy">
          <span className="ai-flow-kicker">AI Song Match</span>
          <h1>
            Photo टाका, mood optional select करा, आणि perfect story song play
            करा.
          </h1>
          <p>
            AI photo मधला vibe, color, scene आणि तुमची music taste पाहून songs
            suggest करतो.
          </p>
        </div>
        <div className="ai-flow-steps">
          <span className={hasImage ? "done" : "active"}>1 Photo</span>
          <span className={userMoodOverride ? "done" : "active"}>2 Mood</span>
          <span className={results ? "done" : "active"}>3 Play</span>
        </div>
        {hasImage && (
          <div className="detected-vibe-card">
            <span>Detected vibe</span>
            <strong>{userMoodOverride || imageMood}</strong>
            <small>
              {imageScene} • {imageColorTone}
            </small>
          </div>
        )}
      </div>

      <div className="upload-section">
        <ImageUpload onAnalyzed={handleImageAnalyzedWithAI} />
        {!hasImage && (
          <p className="upload-prompt">
            Upload your photo to get personalized song recommendations
          </p>
        )}
      </div>

      {showMoodPanel && (
        <MoodSelector
          imageMood={imageMood}
          imageScene={imageScene}
          imageColorTone={imageColorTone}
          userMoodOverride={userMoodOverride}
          onMoodChange={handleMoodChange}
          onSceneChange={handleSceneChange}
          onColorChange={handleColorChange}
        />
      )}

      {loading && (
        <div className="loading-container">
          <div className="loading-waves">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="wave-bar"
                style={{ animationDelay: `${index * 0.1}s` }}
              />
            ))}
          </div>
          <p className="loading-text">Finding your perfect vibe...</p>
        </div>
      )}

      {!loading && results && (
        <div className="results-section">
          <div className="results-header">
            <div>
              <h2 className="results-title">Your Songs</h2>
              <p className="results-subtitle">
                {primaryTrait
                  ? `Tuned for your ${primaryTrait} vibe`
                  : "Personalized for you"}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="refresh-btn"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="highlights-row">
            <div className="highlight-card safe">
              <span className="highlight-label">Safe Choice</span>
              <span className="highlight-song">{results.safeChoice.title}</span>
              <span className="highlight-artist">
                {results.safeChoice.artist}
              </span>
            </div>
            <div className="highlight-card unique">
              <span className="highlight-label">Unique Pick</span>
              <span className="highlight-song">{results.uniquePick.title}</span>
              <span className="highlight-artist">
                {results.uniquePick.artist}
              </span>
            </div>
          </div>

          <div className="songs-list">
            {results.songs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onLike={() => handleLike(song)}
                onSkip={() => handleSkip(song)}
                onSelect={() => handleSelect(song)}
                isSelected={selectedSong === song.id}
                onDownload={handleDownload}
                onSetOnPhoto={handleSetOnPhoto}
              />
            ))}
          </div>

          {selectedSong && (
            <div className="selected-banner">
              <span>🎵</span>
              <span>Song selected for your story!</span>
            </div>
          )}
        </div>
      )}

      {!loading && !results && !hasImage && (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <p className="empty-title">Drop a photo to start</p>
          <p className="empty-sub">We will find songs that match your vibe.</p>
        </div>
      )}
    </div>
  );
}
