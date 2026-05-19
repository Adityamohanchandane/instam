// Browser-compatible MongoDB client with API fallback
// Uses API endpoints to communicate with MongoDB Atlas

import { deezerAPI } from "./deezer-api";
import { songSearchCache } from "./smart-cache";
import { retry } from "./retry-handler";
import type { UserProfile } from "./types";

const API_BASE_URL = import.meta.env.DEV ? "http://localhost:3001/api" : "/api"; // Use relative path for Vite proxy in production

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
  preview_url?: string;
  album_art?: string;
  duration?: number;
  album?: string;
  source?: string;
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
  action: "liked" | "skipped" | "selected";
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
      const storedSongs = localStorage.getItem("instam_songs");
      const storedProfiles = localStorage.getItem("instam_profiles");
      const storedSessions = localStorage.getItem("instam_sessions");
      const storedFeedback = localStorage.getItem("instam_feedback");

      if (storedSongs) this.songs = JSON.parse(storedSongs);
      if (storedProfiles) this.profiles = JSON.parse(storedProfiles);
      if (storedSessions) this.sessions = JSON.parse(storedSessions);
      if (storedFeedback) this.feedback = JSON.parse(storedFeedback);

      console.log("📦 Loaded data from localStorage");
    } catch (error) {
      console.warn("Could not load from localStorage:", error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem("instam_songs", JSON.stringify(this.songs));
      localStorage.setItem("instam_profiles", JSON.stringify(this.profiles));
      localStorage.setItem("instam_sessions", JSON.stringify(this.sessions));
      localStorage.setItem("instam_feedback", JSON.stringify(this.feedback));
    } catch (error) {
      console.warn("Could not save to localStorage:", error);
    }
  }

  private async apiCall<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: data ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn("API call failed, falling back to localStorage:", error);
      this.useLocalStorage = true;
      throw error;
    }
  }

  async connect() {
    // Skip API connection if already in localStorage mode
    if (this.useLocalStorage) {
      console.log(
        "📱 Already using localStorage mode, skipping API connection",
      );
      return this;
    }

    try {
      // Try to connect to MongoDB via API
      await this.apiCall("/health");
      console.log("🌐 Connected to MongoDB Atlas via API");
      this.useLocalStorage = false;
    } catch (error) {
      console.log("❌ MongoDB connection failed, using localStorage:", error);
      this.useLocalStorage = true;
      console.log("📱 Using localStorage fallback mode");
      // Don't throw error to prevent React error boundary
      console.log("⚠️ API connection failed but continuing with localStorage");
    }
    if (this.songs.length === 0) {
      await this.initializeSampleSongs();
    }
    return this;
  }

  async disconnect() {
    console.log("📱 MongoDB client disconnected");
  }

  private async initializeSampleSongs() {
    const sampleSongs: Song[] = [
      {
        id: "en_1",
        title: "Shape of You",
        artist: "Ed Sheeran",
        language: "English",
        genre: "Pop",
        mood_tags: ["happy", "energetic", "party"],
        scene_tags: ["party", "friends", "celebration"],
        personality_tags: ["chill", "social", "confident"],
        color_tone_tags: ["vibrant", "warm", "golden"],
        energy_level: 7,
        is_trending: true,
        trend_region: "Global",
        play_count: 3000000000,
        youtube_query: "shape of you ed sheeran official",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "hi_1",
        title: "Tum Hi Ho",
        artist: "Arijit Singh",
        language: "Hindi",
        genre: "Romantic",
        mood_tags: ["romantic", "emotional", "peaceful"],
        scene_tags: ["couple", "night", "rain"],
        personality_tags: ["romantic", "emotional", "soft"],
        color_tone_tags: ["warm", "moody", "golden"],
        energy_level: 4,
        is_trending: false,
        trend_region: "India",
        play_count: 1500000000,
        youtube_query: "tum hi ho aashiqui 2 arijit singh official",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "mr_1",
        title: "Zingaat",
        artist: "Ajay-Atul",
        language: "Marathi",
        genre: "Folk",
        mood_tags: ["energetic", "happy", "party"],
        scene_tags: ["party", "friends", "celebration"],
        personality_tags: ["energetic", "social", "confident"],
        color_tone_tags: ["vibrant", "warm", "golden"],
        energy_level: 10,
        is_trending: true,
        trend_region: "Maharashtra",
        play_count: 500000000,
        youtube_query: "zingaat sairat ajay atul official",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "hi_2",
        title: "Kesariya",
        artist: "Arijit Singh",
        language: "Hindi",
        genre: "Romantic",
        mood_tags: ["romantic", "peaceful", "nostalgic"],
        scene_tags: ["couple", "travel", "nature"],
        personality_tags: ["romantic", "soft"],
        color_tone_tags: ["warm", "golden"],
        energy_level: 5,
        is_trending: true,
        trend_region: "India",
        play_count: 800000000,
        youtube_query: "kesariya brahmastra arijit singh",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "en_2",
        title: "Blinding Lights",
        artist: "The Weeknd",
        language: "English",
        genre: "Pop",
        mood_tags: ["energetic", "nostalgic", "party"],
        scene_tags: ["night", "city", "drive"],
        personality_tags: ["confident", "chill"],
        color_tone_tags: ["neon", "dark"],
        energy_level: 8,
        is_trending: true,
        trend_region: "Global",
        play_count: 3500000000,
        youtube_query: "blinding lights the weeknd official",
        created_at: new Date(),
        updated_at: new Date(),
      },
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
      const response = await fetch(`${API_BASE_URL}/songs?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Songs API failed: ${response.statusText}`);
      }

      const songs = await response.json();
      this.songs = songs;
      this.saveToStorage();
      return songs;
    } catch (error) {
      console.log("❌ API failed, using local songs");
      return this.songs.slice(0, limit);
    }
  }

  async searchSongs(
    query: string,
    language: string = "en",
    limit: number = 20,
  ): Promise<Song[]> {
    console.log(`🔍 Searching for songs: "${query}" in ${language}`);

    // Check cache first
    const cacheKey = `search:${query}:${language}:${limit}`;
    const cached = songSearchCache.get<Song[]>(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit for "${query}"`);
      return cached;
    }

    try {
      // Use retry logic for API call
      const tracks = await retry(async () => {
        const response = await fetch(
          `${API_BASE_URL}/deezer/search?query=${encodeURIComponent(query)}&limit=${limit}`,
        );
        if (!response.ok) {
          throw new Error(`Deezer search API failed: ${response.statusText}`);
        }
        return await response.json();
      }, {
        maxRetries: 2,
        initialDelay: 500,
        onRetry: (attempt, error) => {
          console.log(`🔄 Retrying Deezer search (attempt ${attempt})`);
        }
      });

      // Convert to our song format
      const songs = tracks.map((track: any) => ({
        id: `deezer_${track.id}`,
        title: track.title,
        artist: track.artist.name,
        album: track.album.title,
        language,
        genre: this.detectExternalGenre(track.title, track.artist.name),
        mood_tags: this.detectExternalMoods(track.title),
        scene_tags: this.detectExternalScenes(track.title),
        personality_tags: this.detectExternalPersonality(track.title),
        color_tone_tags: this.detectExternalColorTone(track.title),
        energy_level: this.detectExternalEnergy(track.title),
        is_trending: track.rank > 500000,
        trend_region: "Global",
        play_count: track.rank || 0,
        youtube_query: `${track.title} ${track.artist.name}`,
        preview_url: track.preview,
        album_art: track.album.cover_medium,
        duration: track.duration,
        source: "deezer",
      }));

      console.log(`📊 Found ${songs.length} songs from server-side Deezer`);
      
      // Cache the results
      songSearchCache.set(cacheKey, songs);
      
      return songs;
    } catch (error) {
      console.error("❌ Server-side Deezer search failed:", error);
      return [];
    }
  }

  private detectExternalGenre(title: string, artist: string): string {
    const text = `${title} ${artist}`.toLowerCase();
    if (
      text.includes("romantic") ||
      text.includes("love") ||
      text.includes("dil")
    )
      return "Romantic";
    if (text.includes("sad") || text.includes("cry") || text.includes("alone"))
      return "Sad";
    if (text.includes("party") || text.includes("dance") || text.includes("dj"))
      return "Party";
    if (
      text.includes("rap") ||
      text.includes("hip hop") ||
      text.includes("badshah")
    )
      return "Hip-Hop";
    if (
      text.includes("bhajan") ||
      text.includes("devotional") ||
      text.includes("spiritual")
    )
      return "Spiritual";
    if (text.includes("marathi") || text.includes("folk")) return "Folk";
    return "Pop";
  }

  private detectExternalMoods(title: string): string[] {
    const text = title.toLowerCase();
    const moods: string[] = [];
    if (
      text.includes("love") ||
      text.includes("romantic") ||
      text.includes("dil") ||
      text.includes("heart")
    )
      moods.push("romantic");
    if (
      text.includes("sad") ||
      text.includes("alone") ||
      text.includes("cry") ||
      text.includes("yaad")
    )
      moods.push("sad", "lonely", "nostalgic");
    if (
      text.includes("party") ||
      text.includes("dance") ||
      text.includes("dj") ||
      text.includes("club")
    )
      moods.push("party", "energetic");
    if (
      text.includes("attitude") ||
      text.includes("swag") ||
      text.includes("gangster")
    )
      moods.push("attitude", "confident");
    if (
      text.includes("peace") ||
      text.includes("calm") ||
      text.includes("lofi") ||
      text.includes("chill")
    )
      moods.push("peaceful");
    if (moods.length === 0) moods.push("happy", "trending");
    return Array.from(new Set(moods));
  }

  private detectExternalScenes(title: string): string[] {
    const text = title.toLowerCase();
    const scenes: string[] = [];
    if (text.includes("night") || text.includes("moon")) scenes.push("night");
    if (text.includes("rain") || text.includes("barsaat")) scenes.push("rain");
    if (
      text.includes("party") ||
      text.includes("dance") ||
      text.includes("club")
    )
      scenes.push("party");
    if (
      text.includes("travel") ||
      text.includes("safar") ||
      text.includes("road")
    )
      scenes.push("travel");
    if (text.includes("love") || text.includes("romantic"))
      scenes.push("couple");
    if (scenes.length === 0) scenes.push("selfie", "general");
    return scenes;
  }

  private detectExternalPersonality(title: string): string[] {
    const text = title.toLowerCase();
    const tags: string[] = [];
    if (text.includes("love") || text.includes("romantic"))
      tags.push("romantic");
    if (text.includes("sad") || text.includes("alone")) tags.push("emotional");
    if (text.includes("party") || text.includes("dance"))
      tags.push("social", "energetic");
    if (
      text.includes("swag") ||
      text.includes("attitude") ||
      text.includes("gangster")
    )
      tags.push("attitude", "confident", "gangster");
    if (tags.length === 0) tags.push("chill", "social");
    return tags;
  }

  private detectExternalColorTone(title: string): string[] {
    const text = title.toLowerCase();
    if (
      text.includes("night") ||
      text.includes("dark") ||
      text.includes("black")
    )
      return ["dark", "moody"];
    if (
      text.includes("sun") ||
      text.includes("gold") ||
      text.includes("morning")
    )
      return ["golden", "warm"];
    if (
      text.includes("party") ||
      text.includes("dance") ||
      text.includes("neon")
    )
      return ["neon", "vibrant"];
    if (text.includes("sad") || text.includes("rain")) return ["moody", "cool"];
    return ["warm", "vibrant"];
  }

  private detectExternalEnergy(title: string): number {
    const text = title.toLowerCase();
    if (
      text.includes("party") ||
      text.includes("dance") ||
      text.includes("dj") ||
      text.includes("remix")
    )
      return 9;
    if (
      text.includes("attitude") ||
      text.includes("swag") ||
      text.includes("gym")
    )
      return 8;
    if (text.includes("happy") || text.includes("travel")) return 7;
    if (text.includes("romantic") || text.includes("love")) return 5;
    if (text.includes("sad") || text.includes("lofi") || text.includes("calm"))
      return 3;
    return 6;
  }

  async getProfile(sessionId: string): Promise<UserProfile | null> {
    if (this.useLocalStorage) {
      return this.profiles.find((p) => p.session_id === sessionId) || null;
    }

    try {
      const profile = await this.apiCall<UserProfile>(`/profile/${sessionId}`);
      return profile;
    } catch (error) {
      return this.profiles.find((p) => p.session_id === sessionId) || null;
    }
  }

  async saveProfile(
    profile: Partial<UserProfile> & Pick<UserProfile, "session_id">,
  ): Promise<void> {
    console.log("=== MONGODB: SAVE PROFILE STARTED ===");
    console.log("Profile to save:", profile);
    console.log("useLocalStorage:", this.useLocalStorage);

    const profileWithTimestamp = {
      ...profile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.useLocalStorage) {
      console.log("Using localStorage for profile...");
      const existingIndex = this.profiles.findIndex(
        (p) => p.session_id === profile.session_id,
      );
      if (existingIndex >= 0) {
        this.profiles[existingIndex] = profileWithTimestamp;
        console.log("Updated existing profile");
      } else {
        this.profiles.push(profileWithTimestamp);
        console.log("Added new profile");
      }
      this.saveToStorage();
      console.log("✅ Profile saved to localStorage");
      return;
    }

    try {
      console.log("Saving profile to MongoDB API...");
      await this.apiCall("/profile", profileWithTimestamp);
      console.log("✅ Profile saved to MongoDB");
    } catch (error) {
      console.log(
        "❌ MongoDB save failed, using localStorage fallback:",
        error instanceof Error ? error.message : "Unknown error",
      );
      // Fallback to localStorage
      const existingIndex = this.profiles.findIndex(
        (p) => p.session_id === profile.session_id,
      );
      if (existingIndex >= 0) {
        this.profiles[existingIndex] = profileWithTimestamp;
      } else {
        this.profiles.push(profileWithTimestamp);
      }
      this.saveToStorage();
      console.log("⚠️ Profile saved to localStorage (fallback)");
    }
  }

  async saveSession(
    session: Omit<RecommendationSession, "_id" | "created_at">,
  ): Promise<string | null> {
    const sessionWithTimestamp = {
      ...session,
      created_at: new Date(),
    };

    if (this.useLocalStorage) {
      const sessionWithId = {
        ...sessionWithTimestamp,
        _id: new MockObjectId(),
      };
      this.sessions.push(sessionWithId);
      this.saveToStorage();
      console.log("✅ Session saved to localStorage");
      return sessionWithId._id.toString();
    }

    try {
      const result = await this.apiCall<{ id: string }>(
        "/session",
        sessionWithTimestamp,
      );
      console.log("✅ Session saved to MongoDB");
      return result.id;
    } catch (error) {
      // Fallback to localStorage
      const sessionWithId = {
        ...sessionWithTimestamp,
        _id: new MockObjectId(),
      };
      this.sessions.push(sessionWithId);
      this.saveToStorage();
      console.log("⚠️ Session saved to localStorage (fallback)");
      return sessionWithId._id.toString();
    }
  }

  async saveFeedback(
    feedbackData: Omit<SongFeedback, "_id" | "created_at">,
  ): Promise<void> {
    const feedbackWithTimestamp = {
      ...feedbackData,
      created_at: new Date(),
    };

    if (this.useLocalStorage) {
      const feedbackWithId = {
        ...feedbackWithTimestamp,
        _id: new MockObjectId(),
      };
      this.feedback.push(feedbackWithId);
      this.saveToStorage();
      console.log("✅ Feedback saved to localStorage");
      return;
    }

    try {
      await this.apiCall("/feedback", feedbackWithTimestamp);
      console.log("✅ Feedback saved to MongoDB");
    } catch (error) {
      // Fallback to localStorage
      const feedbackWithId = {
        ...feedbackWithTimestamp,
        _id: new MockObjectId(),
      };
      this.feedback.push(feedbackWithId);
      this.saveToStorage();
      console.log("⚠️ Feedback saved to localStorage (fallback)");
    }
  }
}

// Export singleton instance
export const mongodb = new MongoDBClient();

// Export types
export type { Song, UserProfile, RecommendationSession, SongFeedback };
