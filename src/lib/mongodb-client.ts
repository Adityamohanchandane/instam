// MongoDB Client for Server-Side Only
// We'll create API routes for browser compatibility

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.VITE_MONGODB_URI || 'mongodb+srv://instam:instam2007@cluster.t0hdrjh.mongodb.net/?appName=Cluster';
const DB_NAME = 'instam';

if (!MONGODB_URI) {
  throw new Error('Please define VITE_MONGODB_URI in your .env file');
}

// Cache the database connection
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    cachedClient = client;
    cachedDb = db;

    console.log('✅ Connected to MongoDB Atlas');
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// Database types
export interface Song {
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

export interface UserProfile {
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

export interface RecommendationSession {
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

export interface SongFeedback {
  _id?: ObjectId;
  session_id: string;
  song_id: string;
  recommendation_session_id: string;
  action: 'liked' | 'skipped' | 'selected';
  created_at?: Date;
}

// Database operations
export class MongoDBService {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  // Songs
  async getSongs(limit: number = 50): Promise<Song[]> {
    const collection = this.db.collection<Song>('songs');
    return await collection
      .find({})
      .sort({ play_count: -1 })
      .limit(limit)
      .toArray();
  }

  async addSongs(songs: Omit<Song, '_id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const collection = this.db.collection<Song>('songs');
    const songsWithTimestamps = songs.map(song => ({
      ...song,
      created_at: new Date(),
      updated_at: new Date()
    }));
    await collection.insertMany(songsToWithTimestamps);
  }

  // Profiles
  async getProfile(sessionId: string): Promise<UserProfile | null> {
    const collection = this.db.collection<UserProfile>('user_profiles');
    return await collection.findOne({ session_id: sessionId });
  }

  async saveProfile(profile: Omit<UserProfile, '_id' | 'created_at' | 'updated_at'>): Promise<void> {
    const collection = this.db.collection<UserProfile>('user_profiles');
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
  }

  // Sessions
  async saveSession(session: Omit<RecommendationSession, '_id' | 'created_at'>): Promise<string> {
    const collection = this.db.collection<RecommendationSession>('recommendation_sessions');
    const sessionWithTimestamp = {
      ...session,
      created_at: new Date()
    };
    const result = await collection.insertOne(sessionWithTimestamp);
    return result.insertedId.toString();
  }

  // Feedback
  async saveFeedback(feedback: Omit<SongFeedback, '_id' | 'created_at'>): Promise<void> {
    const collection = this.db.collection<SongFeedback>('song_feedback');
    const feedbackWithTimestamp = {
      ...feedback,
      created_at: new Date()
    };
    await collection.insertOne(feedbackWithTimestamp);
  }
}

export async function getMongoDBService(): Promise<MongoDBService> {
  const { db } = await connectToDatabase();
  return new MongoDBService(db);
}
