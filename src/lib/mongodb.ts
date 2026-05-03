import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

// MongoDB Configuration
const MONGODB_URI = import.meta.env.VITE_MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'instam';

let client: MongoClient | null = null;
let db: Db | null = null;

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

// MongoDB Client Class
class MongoDBClient {
  private static instance: MongoDBClient;
  
  private constructor() {}
  
  static getInstance(): MongoDBClient {
    if (!MongoDBClient.instance) {
      MongoDBClient.instance = new MongoDBClient();
    }
    return MongoDBClient.instance;
  }
  
  async connect(): Promise<Db> {
    if (client && db) {
      return db;
    }
    
    try {
      console.log('Connecting to MongoDB...');
      client = new MongoClient(MONGODB_URI);
      await client.connect();
      db = client.db(DB_NAME);
      console.log('✅ Connected to MongoDB successfully!');
      return db;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    if (client) {
      await client.close();
      client = null;
      db = null;
      console.log('Disconnected from MongoDB');
    }
  }
  
  // Collection getters
  getSongsCollection(): Collection<Song> {
    if (!db) throw new Error('Database not connected');
    return db.collection<Song>('songs');
  }
  
  getProfilesCollection(): Collection<UserProfile> {
    if (!db) throw new Error('Database not connected');
    return db.collection<UserProfile>('user_profiles');
  }
  
  getSessionsCollection(): Collection<RecommendationSession> {
    if (!db) throw new Error('Database not connected');
    return db.collection<RecommendationSession>('recommendation_sessions');
  }
  
  getFeedbackCollection(): Collection<SongFeedback> {
    if (!db) throw new Error('Database not connected');
    return db.collection<SongFeedback>('song_feedback');
  }
  
  // Song operations
  async getSongs(limit: number = 50): Promise<Song[]> {
    try {
      const collection = this.getSongsCollection();
      const songs = await collection
        .find({})
        .sort({ play_count: -1 })
        .limit(limit)
        .toArray();
      
      // Convert MongoDB _id to string id for compatibility
      return songs.map(song => ({
        ...song,
        id: song.id || song._id?.toString() || ''
      }));
    } catch (error) {
      console.error('Error fetching songs:', error);
      return [];
    }
  }
  
  async addSongs(songs: Omit<Song, '_id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    try {
      const collection = this.getSongsCollection();
      const songsWithTimestamps = songs.map(song => ({
        ...song,
        created_at: new Date(),
        updated_at: new Date()
      }));
      await collection.insertMany(songsWithTimestamps);
      console.log(`✅ Added ${songs.length} songs to MongoDB`);
    } catch (error) {
      console.error('Error adding songs:', error);
    }
  }
  
  // Profile operations
  async getProfile(sessionId: string): Promise<UserProfile | null> {
    try {
      const collection = this.getProfilesCollection();
      const profile = await collection.findOne({ session_id: sessionId });
      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }
  
  async saveProfile(profile: Omit<UserProfile, '_id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const collection = this.getProfilesCollection();
      await collection.updateOne(
        { session_id: profile.session_id },
        { 
          $set: { 
            ...profile, 
            updated_at: new Date() 
          },
          $setOnInsert: { 
            created_at: new Date() 
          }
        },
        { upsert: true }
      );
      console.log('✅ Profile saved to MongoDB');
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  }
  
  // Session operations
  async saveSession(session: Omit<RecommendationSession, '_id' | 'created_at'>): Promise<string | null> {
    try {
      const collection = this.getSessionsCollection();
      const sessionWithTimestamp = {
        ...session,
        created_at: new Date()
      };
      const result = await collection.insertOne(sessionWithTimestamp);
      console.log('✅ Session saved to MongoDB');
      return result.insertedId.toString();
    } catch (error) {
      console.error('Error saving session:', error);
      return null;
    }
  }
  
  // Feedback operations
  async saveFeedback(feedback: Omit<SongFeedback, '_id' | 'created_at'>): Promise<void> {
    try {
      const collection = this.getFeedbackCollection();
      const feedbackWithTimestamp = {
        ...feedback,
        created_at: new Date()
      };
      await collection.insertOne(feedbackWithTimestamp);
      console.log('✅ Feedback saved to MongoDB');
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  }
}

// Export singleton instance
export const mongodb = MongoDBClient.getInstance();

// Export types
export type { Song, UserProfile, RecommendationSession, SongFeedback };
