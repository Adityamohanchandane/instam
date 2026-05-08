// Browser-compatible MongoDB client with API fallback
// Uses API endpoints to communicate with MongoDB Atlas

import { deezerAPI } from './deezer-api';
import type { UserProfile } from './types';

const API_BASE_URL = '/api'; // Will be created with Vite proxy or server

// Mock ObjectId for browser compatibility
class MockObjectId {
  private id: string;
  
  constructor(id?: string) {
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

// MongoDB client with API calls and localStorage fallback
class MongoDBClient {
  private songs: Song[] = [];
  private profiles: UserProfile[] = [];
  private sessions: RecommendationSession[] = [];
  private feedback: SongFeedback[] = [];
  private useLocalStorage = false;
  
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
  
  private async apiCall<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: data ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn('API call failed, falling back to localStorage:', error);
      this.useLocalStorage = true;
      throw error;
    }
  }
  
  async connect() {
    try {
      // Try to connect to MongoDB via API
      await this.apiCall('/health');
      console.log('🌐 Connected to MongoDB Atlas via API');
      this.useLocalStorage = false;
    } catch (error) {
      console.log('📱 Falling back to localStorage');
      this.useLocalStorage = true;
      if (this.songs.length === 0) {
        await this.initializeSampleSongs();
      }
    }
    return this;
  }
  
  async disconnect() {
    console.log('📱 MongoDB client disconnected');
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
    if (this.useLocalStorage) {
      return this.songs.slice(0, limit);
    }
    
    try {
      // Try MongoDB API (now includes Deezer fallback on server)
      const songs = await this.apiCall<Song[]>('/songs', { limit });
      this.songs = songs;
      this.saveToStorage();
      return songs;
    } catch (error) {
      console.log('❌ API failed, using local songs');
      return this.songs.slice(0, limit);
    }
  }

  async searchSongs(query: string, language: string = 'en', limit: number = 20): Promise<Song[]> {
    console.log(`🔍 Searching for songs: "${query}" in ${language}`);
    
    try {
      // Use server-side Deezer search to avoid CORS
      const tracks = await this.apiCall<any[]>('/deezer/search', { query, limit });
      
      // Convert to our song format
      const songs = tracks.map(track => ({
        id: `deezer_${track.id}`,
        title: track.title,
        artist: track.artist.name,
        album: track.album.title,
        language: 'English',
        genre: 'Pop',
        mood_tags: ['search_result'],
        scene_tags: ['general'],
        personality_tags: ['music_lover'],
        color_tone_tags: ['neutral'],
        energy_level: 5,
        is_trending: track.rank > 500000,
        trend_region: 'Global',
        play_count: track.rank || 0,
        youtube_query: `${track.title} ${track.artist.name}`,
        preview_url: track.preview,
        album_art: track.album.cover_medium,
        duration: track.duration,
        source: 'deezer'
      }));
      
      console.log(`📊 Found ${songs.length} songs from server-side Deezer`);
      return songs;
    } catch (error) {
      console.error('❌ Server-side Deezer search failed:', error);
      return [];
    }
  }
  
  async getProfile(sessionId: string): Promise<UserProfile | null> {
    if (this.useLocalStorage) {
      return this.profiles.find(p => p.session_id === sessionId) || null;
    }
    
    try {
      const profile = await this.apiCall<UserProfile>(`/profile/${sessionId}`);
      return profile;
    } catch (error) {
      return this.profiles.find(p => p.session_id === sessionId) || null;
    }
  }
  
  async saveProfile(profile: Partial<UserProfile> & Pick<UserProfile, 'session_id'>): Promise<void> {
    console.log('=== MONGODB: SAVE PROFILE STARTED ===');
    console.log('Profile to save:', profile);
    console.log('useLocalStorage:', this.useLocalStorage);
    
    const profileWithTimestamp = {
      ...profile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    if (this.useLocalStorage) {
      console.log('Using localStorage for profile...');
      const existingIndex = this.profiles.findIndex(p => p.session_id === profile.session_id);
      if (existingIndex >= 0) {
        this.profiles[existingIndex] = profileWithTimestamp;
        console.log('Updated existing profile');
      } else {
        this.profiles.push(profileWithTimestamp);
        console.log('Added new profile');
      }
      this.saveToStorage();
      console.log('✅ Profile saved to localStorage');
      return;
    }
    
    try {
      console.log('Saving profile to MongoDB API...');
      await this.apiCall('/profile', profileWithTimestamp);
      console.log('✅ Profile saved to MongoDB');
    } catch (error) {
      console.log('❌ MongoDB save failed, using localStorage fallback:', error instanceof Error ? error.message : 'Unknown error');
      // Fallback to localStorage
      const existingIndex = this.profiles.findIndex(p => p.session_id === profile.session_id);
      if (existingIndex >= 0) {
        this.profiles[existingIndex] = profileWithTimestamp;
      } else {
        this.profiles.push(profileWithTimestamp);
      }
      this.saveToStorage();
      console.log('⚠️ Profile saved to localStorage (fallback)');
    }
  }
  
  async saveSession(session: Omit<RecommendationSession, '_id' | 'created_at'>): Promise<string | null> {
    const sessionWithTimestamp = {
      ...session,
      created_at: new Date()
    };
    
    if (this.useLocalStorage) {
      const sessionWithId = {
        ...sessionWithTimestamp,
        _id: new MockObjectId()
      };
      this.sessions.push(sessionWithId);
      this.saveToStorage();
      console.log('✅ Session saved to localStorage');
      return sessionWithId._id.toString();
    }
    
    try {
      const result = await this.apiCall<{ id: string }>('/session', sessionWithTimestamp);
      console.log('✅ Session saved to MongoDB');
      return result.id;
    } catch (error) {
      // Fallback to localStorage
      const sessionWithId = {
        ...sessionWithTimestamp,
        _id: new MockObjectId()
      };
      this.sessions.push(sessionWithId);
      this.saveToStorage();
      console.log('⚠️ Session saved to localStorage (fallback)');
      return sessionWithId._id.toString();
    }
  }
  
  async saveFeedback(feedbackData: Omit<SongFeedback, '_id' | 'created_at'>): Promise<void> {
    const feedbackWithTimestamp = {
      ...feedbackData,
      created_at: new Date()
    };
    
    if (this.useLocalStorage) {
      const feedbackWithId = {
        ...feedbackWithTimestamp,
        _id: new MockObjectId()
      };
      this.feedback.push(feedbackWithId);
      this.saveToStorage();
      console.log('✅ Feedback saved to localStorage');
      return;
    }
    
    try {
      await this.apiCall('/feedback', feedbackWithTimestamp);
      console.log('✅ Feedback saved to MongoDB');
    } catch (error) {
      // Fallback to localStorage
      const feedbackWithId = {
        ...feedbackWithTimestamp,
        _id: new MockObjectId()
      };
      this.feedback.push(feedbackWithId);
      this.saveToStorage();
      console.log('⚠️ Feedback saved to localStorage (fallback)');
    }
  }
}

// Export singleton instance
export const mongodb = new MongoDBClient();

// Export types
export type { Song, UserProfile, RecommendationSession, SongFeedback };
