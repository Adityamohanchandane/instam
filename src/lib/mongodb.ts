// Browser-compatible MongoDB client
// For now, we'll use local storage fallback until we set up API endpoints

// MongoDB Configuration
const MONGODB_URI = import.meta.env.VITE_MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'instam';

// Mock ObjectId for browser compatibility
class MockObjectId {
  constructor(private id?: string) {
    this.id = id || Math.random().toString(36).substring(2, 15);
  }
  
  toString() {
    return this.id || Math.random().toString(36).substring(2, 15);
  }
  
  static fromString(id: string) {
    return new MockObjectId(id);
  }
}

type ObjectId = MockObjectId;

// MongoDB connection types
interface Song {
  _id?: ObjectId;
  id: string;
  title: string;
  artist: string;
  language: string;
  genre: string;
  mood_tags: string[];
  scene_tags: string[];
  personality_tags: string[];
  color_tone_tags: string[];
  energy_level: number;
  is_trending: boolean;
  trend_region: string;
  play_count: number;
  youtube_query: string;
  created_at?: Date;
  updated_at?: Date;
}

interface UserProfile {
  _id?: ObjectId;
  session_id: string;
  name: string;
  age: number;
  region: string;
  personality_traits: string[];
  preferred_languages: string[];
  music_taste: string[];
  editMode?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface RecommendationSession {
  _id?: ObjectId;
  session_id: string;
  image_mood: string;
  image_scene: string;
  image_color_tone: string;
  user_mood_override: string;
  recommended_song_ids: string[];
  safe_choice_id: string;
  unique_pick_id: string;
  created_at?: Date;
}

interface SongFeedback {
  _id?: ObjectId;
  session_id: string;
  song_id: string;
  recommendation_session_id: string;
  action: 'liked' | 'skipped' | 'selected';
  created_at?: Date;
}

// Browser-compatible MongoDB operations using localStorage
class BrowserMongoDB {
  private songs: Song[] = [];
  private profiles: UserProfile[] = [];
  private sessions: RecommendationSession[] = [];
  private feedback: SongFeedback[] = [];
  
  constructor() {
    this.loadFromStorage();
  }
  
  private loadFromStorage() {
    try {
      const storedSongs = localStorage.getItem('instam_songs');
      const storedProfiles = localStorage.getItem('instam_profiles');
      const storedSessions = localStorage.getItem('instam_sessions');
      const storedFeedback = localStorage.getItem('instam_feedback');
      
      if (storedSongs) this.songs = JSON.parse(storedSongs);
      if (storedProfiles) this.profiles = JSON.parse(storedProfiles);
      if (storedSessions) this.sessions = JSON.parse(storedSessions);
      if (storedFeedback) this.feedback = JSON.parse(storedFeedback);
      
      console.log('📦 Loaded data from localStorage');
    } catch (error) {
      console.warn('Could not load from localStorage:', error);
    }
  }
  
  private saveToStorage() {
    try {
      localStorage.setItem('instam_songs', JSON.stringify(this.songs));
      localStorage.setItem('instam_profiles', JSON.stringify(this.profiles));
      localStorage.setItem('instam_sessions', JSON.stringify(this.sessions));
      localStorage.setItem('instam_feedback', JSON.stringify(this.feedback));
    } catch (error) {
      console.warn('Could not save to localStorage:', error);
    }
  }
  
  async connect() {
    console.log('📱 Using browser-compatible storage (localStorage)');
    // Initialize with sample songs if empty
    if (this.songs.length === 0) {
      await this.initializeSampleSongs();
    }
    return this;
  }
  
  async disconnect() {
    console.log('📱 Browser storage disconnected');
  }
  
  private async initializeSampleSongs() {
    const sampleSongs: Song[] = [
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
        youtube_query: 'shape of you ed sheeran official',
        created_at: new Date(),
        updated_at: new Date()
      },
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
        youtube_query: 'tum hi ho aashiqui 2 arijit singh official',
        created_at: new Date(),
        updated_at: new Date()
      },
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
        youtube_query: 'zingaat sairat ajay atul official',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    this.songs = sampleSongs;
    this.saveToStorage();
    console.log(`🎵 Initialized ${sampleSongs.length} sample songs`);
  }
  
  async getSongs(limit: number = 50): Promise<Song[]> {
    return this.songs.slice(0, limit);
  }
  
  async getProfile(sessionId: string): Promise<UserProfile | null> {
    return this.profiles.find(p => p.session_id === sessionId) || null;
  }
  
  async saveProfile(profile: Omit<UserProfile, '_id' | 'created_at' | 'updated_at'>): Promise<void> {
    const existingIndex = this.profiles.findIndex(p => p.session_id === profile.session_id);
    const profileWithTimestamp = {
      ...profile,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    if (existingIndex >= 0) {
      this.profiles[existingIndex] = profileWithTimestamp;
    } else {
      this.profiles.push(profileWithTimestamp);
    }
    
    this.saveToStorage();
    console.log('✅ Profile saved to localStorage');
  }
  
  async saveSession(session: Omit<RecommendationSession, '_id' | 'created_at'>): Promise<string | null> {
    const sessionWithTimestamp = {
      ...session,
      _id: new MockObjectId(),
      created_at: new Date()
    };
    
    this.sessions.push(sessionWithTimestamp);
    this.saveToStorage();
    console.log('✅ Session saved to localStorage');
    return sessionWithTimestamp._id.toString();
  }
  
  async saveFeedback(feedbackData: Omit<SongFeedback, '_id' | 'created_at'>): Promise<void> {
    const feedbackWithTimestamp = {
      ...feedbackData,
      _id: new MockObjectId(),
      created_at: new Date()
    };
    
    this.feedback.push(feedbackWithTimestamp);
    this.saveToStorage();
    console.log('✅ Feedback saved to localStorage');
  }
}

// Export singleton instance
export const mongodb = new BrowserMongoDB();

// Export types
export type { Song, UserProfile, RecommendationSession, SongFeedback };
