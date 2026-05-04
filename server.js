// MongoDB API Server for Instam
// Run this server to enable MongoDB Atlas connection

import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://instam:instam2007@cluster.t0hdrjh.mongodb.net/?appName=Cluster';
const DB_NAME = 'instam';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// MongoDB connection
let db;
let client;

async function connectToDatabase() {
  if (client && db) {
    return { client, db };
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('✅ Connected to MongoDB Atlas');
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// Deezer API proxy (server-side to avoid CORS)
async function searchDeezer(query, limit = 20) {
  try {
    const response = await fetch(`https://api.deezer.com/search/track?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('❌ Deezer search failed:', error);
    return [];
  }
}

// Songs endpoints
app.get('/api/songs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const { db } = await connectToDatabase();
    
    // Try MongoDB first
    const songs = await db.collection('songs')
      .find({})
      .sort({ play_count: -1 })
      .limit(limit)
      .toArray();
    
    if (songs.length > 0) {
      console.log(`📊 Found ${songs.length} songs in MongoDB`);
      res.json(songs);
      return;
    }
    
    // Fallback to Deezer API
    console.log('🔄 No songs in MongoDB, trying Deezer API...');
    const deezerTracks = await searchDeezer('popular songs', limit);
    
    if (deezerTracks.length > 0) {
      // Convert Deezer tracks to our song format
      const convertedSongs = deezerTracks.map(track => ({
        id: `deezer_${track.id}`,
        title: track.title,
        artist: track.artist.name,
        album: track.album.title,
        language: 'en',
        genre: 'Pop',
        mood_tags: ['popular', 'trending'],
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
      
      console.log(`🎵 Loaded ${convertedSongs.length} songs from Deezer`);
      res.json(convertedSongs);
      return;
    }
    
    // Final fallback - empty array
    console.log('❌ No songs found anywhere');
    res.json([]);
    
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

// Deezer search endpoint
app.get('/api/deezer/search', async (req, res) => {
  try {
    const { query, limit = 20 } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const tracks = await searchDeezer(query, parseInt(limit));
    res.json(tracks);
  } catch (error) {
    console.error('Error searching Deezer:', error);
    res.status(500).json({ error: 'Failed to search Deezer' });
  }
});

// Profile endpoints
app.get('/api/profile/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { db } = await connectToDatabase();
    const profile = await db.collection('user_profiles').findOne({ session_id: sessionId });
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const profileData = req.body;
    const { db } = await connectToDatabase();
    await db.collection('user_profiles').updateOne(
      { session_id: profileData.session_id },
      { 
        $set: { 
          ...profileData, 
          updated_at: new Date() 
        },
        $setOnInsert: { 
          created_at: new Date() 
        }
      },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// Session endpoints
app.post('/api/session', async (req, res) => {
  try {
    const sessionData = req.body;
    const { db } = await connectToDatabase();
    const sessionWithTimestamp = {
      ...sessionData,
      created_at: new Date()
    };
    const result = await db.collection('recommendation_sessions').insertOne(sessionWithTimestamp);
    res.json({ id: result.insertedId.toString() });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// Feedback endpoints
app.post('/api/feedback', async (req, res) => {
  try {
    const feedbackData = req.body;
    const { db } = await connectToDatabase();
    const feedbackWithTimestamp = {
      ...feedbackData,
      created_at: new Date()
    };
    await db.collection('song_feedback').insertOne(feedbackWithTimestamp);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// Initialize database with sample songs
app.post('/api/init', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    
    const sampleSongs = [
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
      },
      {
        id: 'pa_1',
        title: 'Brown Munde',
        artist: 'AP Dhillon',
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
        youtube_query: 'brown munde ap dhillon official',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    await db.collection('songs').insertMany(sampleSongs);
    res.json({ success: true, message: 'Database initialized with sample songs' });
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).json({ error: 'Failed to initialize database' });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 MongoDB API Server running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  
  try {
    // Test database connection
    await connectToDatabase();
    console.log('✅ MongoDB Atlas connection established');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    console.log('💡 Please update your MongoDB password in .env file');
  }
});

export default app;
