import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Settings } from 'lucide-react';
import { mongodb } from '../lib/mongodb';
import { getRecommendations } from '../lib/recommender';
import AIMusicAssistant, { type SongRecommendation } from '../lib/aiMusicAssistant';
import SongCard from './SongCard';
import MoodSelector from './MoodSelector';
import ImageUpload from './ImageUpload';
import type { UserProfile, Song, SongWithReason, MoodType, SceneType, ColorTone, RecommendationResult } from '../lib/types';

interface Props {
  userProfile: UserProfile;
  onEditProfile: () => void;
}

export default function RecommendationView({ userProfile, onEditProfile }: Props) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [results, setResults] = useState<RecommendationResult | null>(null);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [recSessionId, setRecSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMoodPanel, setShowMoodPanel] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [aiAssistant] = useState(() => new AIMusicAssistant());
  const [aiRecommendations, setAiRecommendations] = useState<SongRecommendation[]>([]);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);

  const [imageMood, setImageMood] = useState<MoodType>('happy');
  const [imageScene, setImageScene] = useState<SceneType>('selfie');
  const [imageColorTone, setImageColorTone] = useState<ColorTone>('warm');
  const [userMoodOverride, setUserMoodOverride] = useState<MoodType | ''>('');

  useEffect(() => {
    loadSongs();
  }, []);

  async function loadSongs() {
    try {
      console.log('Loading songs from MongoDB...');
      await mongodb.connect();
      const songs = await mongodb.getSongs(50);
      
      if (songs && songs.length > 0) {
        console.log(`✅ Loaded ${songs.length} songs from MongoDB`);
        setSongs(songs);
        return;
      }
      
      console.log('No songs in MongoDB, using local database as final fallback...');
      const mockSongs = [
        // English International Hits
        {
          id: 'en_1',
          title: 'Shape of You',
          artist: 'Ed Sheeran',
          language: 'English',
          genre: 'Pop',
          mood_tags: ['happy', 'energetic', 'party'],
          scene_tags: ['party', 'friends', 'celebration'],
          personality_tags: ['chill', 'social', 'confident'],
          color_tone_tags: ['vibrant', 'warm', 'golden'],
          energy_level: 7,
          is_trending: true,
          trend_region: 'Global',
          play_count: 3000000000,
          youtube_query: 'shape of you ed sheeran official'
        },
        {
          id: 'en_2',
          title: 'Blinding Lights',
          artist: 'The Weeknd',
          language: 'English',
          genre: 'Pop',
          mood_tags: ['energetic', 'confident', 'party'],
          scene_tags: ['night', 'city', 'drive'],
          personality_tags: ['confident', 'energetic', 'attitude'],
          color_tone_tags: ['neon', 'dark', 'vibrant'],
          energy_level: 9,
          is_trending: true,
          trend_region: 'Global',
          play_count: 3500000000,
          youtube_query: 'blinding lights the weeknd official'
        },
        {
          id: 'en_3',
          title: 'Someone Like You',
          artist: 'Adele',
          language: 'English',
          genre: 'Soul',
          mood_tags: ['romantic', 'emotional', 'sad'],
          scene_tags: ['couple', 'night', 'alone'],
          personality_tags: ['romantic', 'emotional', 'soft'],
          color_tone_tags: ['warm', 'moody', 'golden'],
          energy_level: 2,
          is_trending: false,
          trend_region: 'Global',
          play_count: 2000000000,
          youtube_query: 'someone like you adele official'
        },
        
        // Bollywood Blockbuster Songs
        {
          id: 'hi_1',
          title: 'Tum Hi Ho',
          artist: 'Arijit Singh',
          language: 'Hindi',
          genre: 'Romantic',
          mood_tags: ['romantic', 'emotional', 'peaceful'],
          scene_tags: ['couple', 'night', 'rain'],
          personality_tags: ['romantic', 'emotional', 'soft'],
          color_tone_tags: ['warm', 'moody', 'golden'],
          energy_level: 4,
          is_trending: false,
          trend_region: 'India',
          play_count: 1500000000,
          youtube_query: 'tum hi ho aashiqui 2 arijit singh official'
        },
        {
          id: 'hi_2',
          title: 'Kala Chashma',
          artist: 'Badshah, Amar Arshi',
          language: 'Hindi',
          genre: 'Party',
          mood_tags: ['energetic', 'happy', 'party'],
          scene_tags: ['party', 'celebration', 'wedding'],
          personality_tags: ['confident', 'energetic', 'social'],
          color_tone_tags: ['vibrant', 'warm', 'golden'],
          energy_level: 9,
          is_trending: true,
          trend_region: 'India',
          play_count: 1200000000,
          youtube_query: 'kala chashma baar baar dekho badshah official'
        },
        {
          id: 'hi_3',
          title: 'Channa Mereya',
          artist: 'Arijit Singh',
          language: 'Hindi',
          genre: 'Sad Romantic',
          mood_tags: ['sad', 'emotional', 'melancholic'],
          scene_tags: ['alone', 'night', 'wedding'],
          personality_tags: ['emotional', 'lonely', 'soft'],
          color_tone_tags: ['moody', 'dark', 'cool'],
          energy_level: 2,
          is_trending: false,
          trend_region: 'India',
          play_count: 800000000,
          youtube_query: 'channa mereya ae dil hai mushkil arijit singh official'
        },
        {
          id: 'hi_4',
          title: 'Garmi',
          artist: 'Badshah, Neha Kakkar',
          language: 'Hindi',
          genre: 'Party',
          mood_tags: ['energetic', 'happy', 'party'],
          scene_tags: ['party', 'street', 'summer'],
          personality_tags: ['attitude', 'confident', 'social'],
          color_tone_tags: ['vibrant', 'warm', 'neon'],
          energy_level: 8,
          is_trending: true,
          trend_region: 'India',
          play_count: 600000000,
          youtube_query: 'garmi street dancer 3d badshah official'
        },
        {
          id: 'hi_5',
          title: 'Mere Rashke Qamar',
          artist: 'Nusrat Fateh Ali Khan, Rahat Fateh Ali Khan',
          language: 'Hindi',
          genre: 'Sufi',
          mood_tags: ['romantic', 'emotional', 'peaceful'],
          scene_tags: ['couple', 'nature', 'travel'],
          personality_tags: ['romantic', 'spiritual', 'emotional'],
          color_tone_tags: ['warm', 'golden', 'moody'],
          energy_level: 5,
          is_trending: false,
          trend_region: 'India',
          play_count: 1000000000,
          youtube_query: 'mere rashke qamar rahat fateh ali khan official'
        },
        
        // Marathi Superhits
        {
          id: 'mr_1',
          title: 'Zingaat',
          artist: 'Ajay-Atul',
          language: 'Marathi',
          genre: 'Folk',
          mood_tags: ['energetic', 'happy', 'party'],
          scene_tags: ['party', 'friends', 'celebration'],
          personality_tags: ['energetic', 'social', 'confident'],
          color_tone_tags: ['vibrant', 'warm', 'golden'],
          energy_level: 10,
          is_trending: true,
          trend_region: 'Maharashtra',
          play_count: 500000000,
          youtube_query: 'zingaat sairat ajay atul official'
        },
        {
          id: 'mr_2',
          title: 'Mala Jau Dya Na Ghari',
          artist: 'Sonu Nigam, Shreya Ghoshal',
          language: 'Marathi',
          genre: 'Romantic',
          mood_tags: ['romantic', 'peaceful', 'happy'],
          scene_tags: ['couple', 'nature', 'travel'],
          personality_tags: ['romantic', 'soft', 'peaceful'],
          color_tone_tags: ['warm', 'golden', 'vibrant'],
          energy_level: 6,
          is_trending: false,
          trend_region: 'Maharashtra',
          play_count: 300000000,
          youtube_query: 'mala jau dya na ghari sonu nigam official'
        },
        {
          id: 'mr_3',
          title: 'Apsara Aali',
          artist: 'Ajay-Atul',
          language: 'Marathi',
          genre: 'Folk',
          mood_tags: ['energetic', 'happy', 'celebration'],
          scene_tags: ['party', 'wedding', 'celebration'],
          personality_tags: ['energetic', 'social', 'confident'],
          color_tone_tags: ['vibrant', 'warm', 'golden'],
          energy_level: 9,
          is_trending: true,
          trend_region: 'Maharashtra',
          play_count: 200000000,
          youtube_query: 'apsara aali natrang ajay atul official'
        },
        
        // Punjabi Chartbusters
        {
          id: 'pa_1',
          title: 'Brown Munde',
          artist: 'AP Dhillon, Gurinder Gill',
          language: 'Punjabi',
          genre: 'Hip Hop',
          mood_tags: ['attitude', 'confident', 'energetic'],
          scene_tags: ['street', 'party', 'friends'],
          personality_tags: ['attitude', 'gangster', 'confident'],
          color_tone_tags: ['dark', 'neon', 'vibrant'],
          energy_level: 9,
          is_trending: true,
          trend_region: 'North India',
          play_count: 800000000,
          youtube_query: 'brown munde ap dhillon official'
        },
        {
          id: 'pa_2',
          title: 'Laung Laachi',
          artist: 'Mannat Noor, Babbal Rai',
          language: 'Punjabi',
          genre: 'Romantic',
          mood_tags: ['romantic', 'happy', 'peaceful'],
          scene_tags: ['couple', 'celebration', 'wedding'],
          personality_tags: ['romantic', 'social', 'happy'],
          color_tone_tags: ['warm', 'vibrant', 'golden'],
          energy_level: 6,
          is_trending: false,
          trend_region: 'North India',
          play_count: 1400000000,
          youtube_query: 'laung laachi mannat noor official'
        },
        {
          id: 'pa_3',
          title: 'Lehanga',
          artist: 'Jass Manak',
          language: 'Punjabi',
          genre: 'Romantic',
          mood_tags: ['romantic', 'happy', 'peaceful'],
          scene_tags: ['couple', 'nature', 'village'],
          personality_tags: ['romantic', 'soft', 'happy'],
          color_tone_tags: ['warm', 'vibrant', 'golden'],
          energy_level: 5,
          is_trending: true,
          trend_region: 'North India',
          play_count: 900000000,
          youtube_query: 'lehanga jass manak official'
        },
        
        // Telugu Blockbusters
        {
          id: 'te_1',
          title: 'Arabic Kuthu',
          artist: 'Anirudh Ravichander, Jonita Gandhi',
          language: 'Telugu',
          genre: 'Mass',
          mood_tags: ['energetic', 'party', 'confident'],
          scene_tags: ['party', 'celebration', 'friends'],
          personality_tags: ['energetic', 'confident', 'social'],
          color_tone_tags: ['vibrant', 'neon', 'warm'],
          energy_level: 8,
          is_trending: true,
          trend_region: 'South India',
          play_count: 600000000,
          youtube_query: 'arabic kuthu beast anirudh official'
        },
        {
          id: 'te_2',
          title: 'Samajavaragamana',
          artist: 'Sid Sriram',
          language: 'Telugu',
          genre: 'Classical',
          mood_tags: ['romantic', 'peaceful', 'emotional'],
          scene_tags: ['couple', 'nature', 'sunset'],
          personality_tags: ['romantic', 'soft', 'spiritual'],
          color_tone_tags: ['warm', 'golden', 'moody'],
          energy_level: 4,
          is_trending: false,
          trend_region: 'South India',
          play_count: 400000000,
          youtube_query: 'samajavaragamana ala vaikunthapurramuloo sid sriram official'
        },
        {
          id: 'te_3',
          title: 'Butta Bomma',
          artist: 'Armaan Malik',
          language: 'Telugu',
          genre: 'Romantic',
          mood_tags: ['romantic', 'happy', 'energetic'],
          scene_tags: ['couple', 'party', 'celebration'],
          personality_tags: ['romantic', 'social', 'happy'],
          color_tone_tags: ['vibrant', 'warm', 'golden'],
          energy_level: 7,
          is_trending: true,
          trend_region: 'South India',
          play_count: 700000000,
          youtube_query: 'butta bomma ala vaikunthapurramuloo armaan malik official'
        },
        
        // Tamil Superhits
        {
          id: 'ta_1',
          title: 'Vaathi Coming',
          artist: 'Anirudh Ravichander',
          language: 'Tamil',
          genre: 'Mass',
          mood_tags: ['attitude', 'energetic', 'confident'],
          scene_tags: ['street', 'party', 'celebration'],
          personality_tags: ['attitude', 'gangster', 'confident'],
          color_tone_tags: ['dark', 'neon', 'vibrant'],
          energy_level: 9,
          is_trending: true,
          trend_region: 'South India',
          play_count: 1000000000,
          youtube_query: 'vaathi coming master anirudh official'
        },
        {
          id: 'ta_2',
          title: 'Enna Sona',
          artist: 'A.R. Rahman',
          language: 'Tamil',
          genre: 'Romantic',
          mood_tags: ['romantic', 'emotional', 'peaceful'],
          scene_tags: ['couple', 'nature', 'travel'],
          personality_tags: ['romantic', 'emotional', 'soft'],
          color_tone_tags: ['warm', 'golden', 'moody'],
          energy_level: 5,
          is_trending: false,
          trend_region: 'South India',
          play_count: 500000000,
          youtube_query: 'enna sona ok jaanu ar rahman official'
        },
        {
          id: 'ta_3',
          title: 'Kutty Pattas',
          artist: 'Anirudh Ravichander',
          language: 'Tamil',
          genre: 'Party',
          mood_tags: ['energetic', 'happy', 'party'],
          scene_tags: ['party', 'friends', 'celebration'],
          personality_tags: ['energetic', 'social', 'confident'],
          color_tone_tags: ['vibrant', 'neon', 'warm'],
          energy_level: 8,
          is_trending: true,
          trend_region: 'South India',
          play_count: 400000000,
          youtube_query: 'kutty pattas anirudh official'
        },
        
        // Bengali Hits
        {
          id: 'bn_1',
          title: 'Ekta Chilo',
          artist: 'Shironamhin',
          language: 'Bengali',
          genre: 'Rock',
          mood_tags: ['sad', 'emotional', 'melancholic'],
          scene_tags: ['alone', 'night', 'rain'],
          personality_tags: ['emotional', 'lonely', 'soft'],
          color_tone_tags: ['moody', 'dark', 'cool'],
          energy_level: 3,
          is_trending: false,
          trend_region: 'East India',
          play_count: 100000000,
          youtube_query: 'ekta chilo shironamhin official'
        },
        {
          id: 'bn_2',
          title: 'Mon Boleche',
          artist: 'Arijit Singh',
          language: 'Bengali',
          genre: 'Romantic',
          mood_tags: ['romantic', 'happy', 'peaceful'],
          scene_tags: ['couple', 'nature', 'travel'],
          personality_tags: ['romantic', 'soft', 'happy'],
          color_tone_tags: ['warm', 'vibrant', 'golden'],
          energy_level: 6,
          is_trending: true,
          trend_region: 'East India',
          play_count: 200000000,
          youtube_query: 'mon boleche arijit singh bengali official'
        },
        {
          id: 'bn_3',
          title: 'Keno Je Toke',
          artist: 'Arijit Singh',
          language: 'Bengali',
          genre: 'Romantic',
          mood_tags: ['romantic', 'emotional', 'peaceful'],
          scene_tags: ['couple', 'night', 'rain'],
          personality_tags: ['romantic', 'emotional', 'soft'],
          color_tone_tags: ['warm', 'moody', 'golden'],
          energy_level: 4,
          is_trending: false,
          trend_region: 'East India',
          play_count: 150000000,
          youtube_query: 'keno je toke arijit singh bengali official'
        }
      ];
      setSongs(mockSongs);
    } catch (error) {
      console.error('Failed to load songs:', error);
    }
  }

  
  const generateRecommendations = useCallback(async (
    songsData: Song[],
    moodData: MoodType,
    sceneData: SceneType,
    colorData: ColorTone,
    overrideData: MoodType | '',
    skipSet: Set<string>
  ) => {
    if (songsData.length === 0) return;
    setLoading(true);

    await new Promise(r => setTimeout(r, 600)); // simulate thinking

    const result = getRecommendations(songsData, {
      userProfile,
      imageMood: moodData,
      imageScene: sceneData,
      imageColorTone: colorData,
      userMoodOverride: overrideData,
    }, skipSet);

    setResults(result);
    setSelectedSong(null);

    // Save session to Supabase
    const songIds = result.songs.map(s => s.id);
    console.log('Recommendations generated:', songIds.length, 'songs');
    
    try {
      const sessionId = await mongodb.saveSession({
        session_id: userProfile.session_id,
        image_mood: moodData,
        image_scene: sceneData,
        image_color_tone: colorData,
        user_mood_override: overrideData,
        recommended_song_ids: songIds,
        safe_choice_id: result.safeChoice.id,
        unique_pick_id: result.uniquePick.id,
      });

      if (sessionId) {
        setRecSessionId(sessionId);
        console.log('✅ Session saved to MongoDB:', sessionId);
      } else {
        setRecSessionId('local_' + Date.now());
        console.log('⚠️ Using local session ID');
      }
    } catch (error) {
      console.log('⚠️ Could not save session to MongoDB:', error.message);
      setRecSessionId('local_' + Date.now());
    }

    setLoading(false);
  }, [userProfile]);

  function handleImageAnalyzed(mood: MoodType, scene: SceneType, colorTone: ColorTone, _url: string) {
    setImageMood(mood);
    setImageScene(scene);
    setImageColorTone(colorTone);
    setHasImage(true);
    generateRecommendations(songs, mood, scene, colorTone, userMoodOverride, skippedIds);
  }

  async function handleSkip(song: SongWithReason) {
    const newSkipped = new Set(skippedIds);
    newSkipped.add(song.id);
    setSkippedIds(newSkipped);

    console.log('Song skipped:', song.title);
    
    // Save feedback to MongoDB
    if (recSessionId) {
      try {
        await mongodb.saveFeedback({
          session_id: userProfile.session_id,
          song_id: song.id,
          recommendation_session_id: recSessionId,
          action: 'skipped',
        });
        console.log('✅ Skip feedback saved to MongoDB');
      } catch (error) {
        console.log('⚠️ Could not save skip feedback:', error.message);
      }
    }

    // Replace skipped song with next best
    const newResults = getRecommendations(songs, {
      userProfile, imageMood, imageScene, imageColorTone, userMoodOverride,
    }, newSkipped);
    setResults(newResults);
  }

  async function handleLike(song: SongWithReason) {
    console.log('Song liked:', song.title);
    
    if (recSessionId) {
      try {
        await mongodb.saveFeedback({
          session_id: userProfile.session_id,
          song_id: song.id,
          recommendation_session_id: recSessionId,
          action: 'liked',
        });
        console.log('✅ Like feedback saved to MongoDB');
      } catch (error) {
        console.log('⚠️ Could not save like feedback:', error.message);
      }
    }
  }

  async function handleSelect(song: SongWithReason) {
    setSelectedSong(song.id);
    console.log('Song selected:', song.title);
    
    if (recSessionId) {
      try {
        await mongodb.saveFeedback({
          session_id: userProfile.session_id,
          song_id: song.id,
          recommendation_session_id: recSessionId,
          action: 'selected',
        });
        console.log('✅ Select feedback saved to MongoDB');
      } catch (error) {
        console.log('⚠️ Could not save select feedback:', error.message);
      }
    }
  }

  function handleDownload(song: SongWithReason) {
    try {
      // Create download link for audio
      const songNumber = (song.id.charCodeAt(0) % 10) + 1;
      const audioUrl = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${songNumber}.mp3`;
      
      // Create temporary link element
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `${song.title} - ${song.artist}.mp3`;
      link.target = '_blank';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      console.log(`Download started: ${song.title} - ${song.artist}`);
      
      // Optional: Show a toast notification instead of alert
      const toast = document.createElement('div');
      toast.textContent = `🎵 Downloading: ${song.title}`;
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        animation: slide-up 0.3s ease;
      `;
      document.body.appendChild(toast);
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  }

  function handleSetOnPhoto(song: SongWithReason) {
    try {
      // Create a modal-like notification
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fade-in 0.3s ease;
      `;
      
      const content = document.createElement('div');
      content.style.cssText = `
        background: var(--bg-elevated);
        padding: 30px;
        border-radius: 16px;
        max-width: 400px;
        text-align: center;
        border: 1px solid var(--border);
      `;
      
      content.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: var(--text-primary); font-size: 18px;">
          🎵 Set "${song.title}" on Photo
        </h3>
        <p style="margin: 0 0 20px 0; color: var(--text-secondary); line-height: 1.5;">
          This feature would:<br>
          1. Open your photo gallery<br>
          2. Let you select a photo<br>
          3. Create a video with this music<br>
          4. Ready for Instagram Reels/Stories
        </p>
        <p style="margin: 0 0 20px 0; color: var(--warning); font-size: 12px;">
          Note: This requires native mobile app development for full functionality.
        </p>
        <button id="closeModal" style="
          background: var(--accent);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        ">Got it!</button>
      `;
      
      modal.appendChild(content);
      document.body.appendChild(modal);
      
      // Close modal on button click
      document.getElementById('closeModal')?.addEventListener('click', () => {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
      });
      
      // Close modal on background click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          if (document.body.contains(modal)) {
            document.body.removeChild(modal);
          }
        }
      });
      
    } catch (error) {
      console.error('Set on photo failed:', error);
      alert('Feature not available in web version.');
    }
  }

  function getAIRecommendations() {
    // Analyze current image and mood
    const imageDescription = `${imageMood} ${imageScene} ${imageColorTone}`;
    const caption = userMoodOverride || imageMood;
    
    const imageAnalysis = aiAssistant.analyzeImage(imageDescription);
    const captionAnalysis = aiAssistant.analyzeCaption(caption);
    const userContext = {
      location: userProfile.region?.toLowerCase() === 'india' ? 'india' : 'global',
      preferences: userProfile.preferred_languages,
      recentActivity: []
    };
    
    const recommendations = aiAssistant.recommendSongs(imageAnalysis, captionAnalysis, userContext);
    setAiRecommendations(recommendations);
    setShowAIRecommendations(true);
  }

  function handleImageAnalyzedWithAI(mood: MoodType, scene: SceneType, colorTone: ColorTone, url: string) {
    setImageMood(mood);
    setImageScene(scene);
    setImageColorTone(colorTone);
    setHasImage(true);
    generateRecommendations(songs, mood, scene, colorTone, userMoodOverride, skippedIds);
    
    // Also get AI recommendations
    setTimeout(() => getAIRecommendations(), 1000);
  }

  function handleRefresh() {
    generateRecommendations(songs, imageMood, imageScene, imageColorTone, userMoodOverride, skippedIds);
  }

  function handleMoodChange(mood: MoodType | '') {
    setUserMoodOverride(mood);
    if (hasImage) {
      generateRecommendations(songs, imageMood, imageScene, imageColorTone, mood, skippedIds);
    }
  }

  function handleSceneChange(scene: SceneType) {
    setImageScene(scene);
    if (hasImage) {
      generateRecommendations(songs, imageMood, scene, imageColorTone, userMoodOverride, skippedIds);
    }
  }

  function handleColorChange(color: ColorTone) {
    setImageColorTone(color);
    if (hasImage) {
      generateRecommendations(songs, imageMood, imageScene, color, userMoodOverride, skippedIds);
    }
  }

  return (
    <div className="rec-view">
      {/* Top bar */}
      <div className="top-bar">
        <div className="top-logo">
          <span>🎵</span>
          <span>Instam</span>
        </div>
        <div className="top-actions">
          <button onClick={() => setShowMoodPanel(!showMoodPanel)} className="icon-btn" title="Tune vibes">
            <Settings size={18} />
          </button>
          <button onClick={onEditProfile} className="profile-btn">
            {userProfile.personality_traits[0] === 'gangster' ? '🥷'
              : userProfile.personality_traits[0] === 'romantic' ? '💘'
              : userProfile.personality_traits[0] === 'chill' ? '😎'
              : userProfile.personality_traits[0] === 'spiritual' ? '🙏'
              : '🎭'}
          </button>
        </div>
      </div>

      {/* Image upload */}
      <div className="upload-section">
        <ImageUpload onAnalyzed={handleImageAnalyzedWithAI} />
        {!hasImage && (
          <p className="upload-prompt">Upload your photo to get personalized song recommendations</p>
        )}
      </div>

      {/* Mood panel */}
      {showMoodPanel && (
        <MoodSelector
          imageMood={imageMood}
          imageScene={imageScene}
          imageColorTone={imageColorTone}
          onMoodChange={handleMoodChange}
          onSceneChange={handleSceneChange}
          onColorChange={handleColorChange}
        />
      )}

      
      {/* Results */}
      {loading && (
        <div className="loading-container">
          <div className="loading-waves">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
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
                {userProfile.personality_traits[0] ? `Tuned for your ${userProfile.personality_traits[0]} vibe` : 'Personalized for you'}
              </p>
            </div>
            <button onClick={handleRefresh} className="refresh-btn" title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Highlights row */}
          <div className="highlights-row">
            <div className="highlight-card safe">
              <span className="highlight-label">Safe Choice</span>
              <span className="highlight-song">{results.safeChoice.title}</span>
              <span className="highlight-artist">{results.safeChoice.artist}</span>
            </div>
            <div className="highlight-card unique">
              <span className="highlight-label">Unique Pick</span>
              <span className="highlight-song">{results.uniquePick.title}</span>
              <span className="highlight-artist">{results.uniquePick.artist}</span>
            </div>
          </div>

          {/* Song cards */}
          <div className="songs-list">
            {results.songs.map(song => (
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
              <span>Song added to your story!</span>
            </div>
          )}
        </div>
      )}

      {/* AI Recommendations Section */}
      {showAIRecommendations && aiRecommendations.length > 0 && (
        <div className="ai-recommendations">
          <div className="ai-header">
            <h3>🤖 AI Smart Recommendations</h3>
            <button onClick={() => setShowAIRecommendations(false)} className="close-btn">×</button>
          </div>
          <div className="ai-songs-list">
            {aiRecommendations.map((rec, index) => (
              <div key={index} className="ai-song-card">
                <div className="ai-song-info">
                  <div className="ai-song-title">{rec.song}</div>
                  <div className="ai-song-artist">{rec.artist}</div>
                  <div className="ai-song-type">{rec.type}</div>
                </div>
                <div className="ai-song-reason">{rec.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !results && !hasImage && (
        <div className="empty-state">
          <div className="empty-icon">🎧</div>
          <p className="empty-title">Drop a photo to start</p>
          <p className="empty-sub">We'll find songs that match your vibe perfectly</p>
        </div>
      )}
    </div>
  );
}
