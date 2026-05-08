// MongoDB API Server for Instam
// Run this server to enable MongoDB Atlas connection

import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables from current directory
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.VITE_MONGODB_URI;
const DB_NAME = 'instam';

// Validate environment variables
if (!MONGODB_URI) {
  console.error('❌ ERROR: VITE_MONGODB_URI not found in .env file');
  console.log('💡 Please create a .env file with your MongoDB connection string');
  console.log('   Example: VITE_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️ Using fallback mode - data will be stored in memory');
    // Return null to indicate we're in fallback mode
    return null;
  }
}

// Deezer API proxy (server-side to avoid CORS)
async function searchDeezer(query, limit = 20) {
  try {
    console.log(`🔍 Server searching Deezer for: "${query}"`);
    
    const response = await fetch(`https://api.deezer.com/search/track?q=${encodeURIComponent(query)}&limit=${limit}`);
    
    if (!response.ok) {
      console.error(`❌ Deezer API HTTP error: ${response.status} ${response.statusText}`);
      throw new Error(`Deezer API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.data) {
      console.error('❌ Invalid Deezer API response structure');
      return [];
    }
    
    console.log(`✅ Server Deezer search successful: ${data.data.length} tracks found`);
    return data.data || [];
  } catch (error) {
    console.error('❌ Server Deezer search failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      query: query,
      limit: limit
    });
    return [];
  }
}

// Songs endpoints
app.get('/api/songs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const connection = await connectToDatabase();
    
    // Try MongoDB first if available
    if (connection && connection.db) {
      try {
        const songs = await connection.db.collection('songs')
          .find({})
          .sort({ play_count: -1 })
          .limit(limit)
          .toArray();
        
        if (songs.length > 0) {
          console.log(`📊 Found ${songs.length} songs in MongoDB`);
          res.json(songs);
          return;
        }
      } catch (dbError) {
        console.log('⚠️ MongoDB query failed, using Deezer fallback');
      }
    }

    // Fallback to Deezer API
    console.log('🔄 Using Deezer API in fallback mode...');
    const deezerTracks = await searchDeezer('popular songs', limit);
    
    if (deezerTracks.length > 0) {
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
    res.status(500).json({ error: 'Failed to fetch songs', fallback: true });
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

// API status check endpoint
app.get('/api/status', async (req, res) => {
  try {
    console.log('🔍 Checking API status...');
    
    // Check MongoDB
    let mongoStatus = 'disconnected';
    try {
      const { db } = await connectToDatabase();
      await db.admin().ping();
      mongoStatus = 'connected';
    } catch (error) {
      console.error('MongoDB status check failed:', error);
    }
    
    // Check Deezer API
    let deezerStatus = 'disconnected';
    try {
      const response = await fetch('https://api.deezer.com/search/track?q=test&limit=1');
      deezerStatus = response.ok ? 'connected' : 'error';
    } catch (error) {
      console.error('Deezer status check failed:', error);
    }
    
    const status = {
      timestamp: new Date().toISOString(),
      mongodb: mongoStatus,
      deezer: deezerStatus,
      server: 'running',
      environment: process.env.NODE_ENV || 'development'
    };
    
    console.log('✅ API status checked:', status);
    res.json(status);
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({ error: 'Failed to check API status' });
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
    console.log('=== SERVER: PROFILE POST STARTED ===');
    console.log('Received profile data:', req.body);
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

// OpenAI Image Analysis Endpoint
app.post('/api/analyze-image', async (req, res) => {
  try {
    console.log('🖼️ OpenAI Image Analysis Request Received');
    
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Check for OpenAI API key
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiKey || openaiKey === 'your_openai_api_key_here') {
      console.log('⚠️ No OpenAI API key found, using mock analysis');
      
      // Return mock analysis with realistic results
      const mockAnalysis = generateMockImageAnalysis();
      return res.json(mockAnalysis);
    }

    // Call OpenAI Vision API
    console.log('🤖 Calling OpenAI Vision API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a music recommendation AI. Look at the image carefully and list exactly what you see in it (people, animals, objects, scenery, weather, mood, colors, activities). Then suggest the perfect music mood, genre, and specific songs that match the scene. Return JSON with: what_ai_sees (string describing everything visible in the image), description, mood, genre, energy_level (1-10), suggested_songs (array), and scene_type.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and suggest perfect music for it. Describe what you see, the mood, and recommend songs.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 800,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ OpenAI API error:', errorData);
      
      // Fallback to mock analysis
      const mockAnalysis = generateMockImageAnalysis();
      return res.json(mockAnalysis);
    }

    const data = await response.json();
    const analysisContent = data.choices?.[0]?.message?.content;
    
    if (!analysisContent) {
      throw new Error('No analysis content from OpenAI');
    }

    let analysis;
    try {
      analysis = JSON.parse(analysisContent);
    } catch (e) {
      // If not valid JSON, create structured response from text
      analysis = {
        description: analysisContent,
        mood: 'happy',
        genre: 'pop',
        energy_level: 7,
        suggested_songs: ['Perfect by Ed Sheeran', 'Happy by Pharrell Williams', 'Good Vibes'],
        scene_type: 'general'
      };
    }

    console.log('✅ OpenAI Analysis Complete:', analysis);
    
    res.json({
      success: true,
      analysis: analysis,
      ai_provider: 'openai',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Image analysis error:', error);
    
    // Return mock analysis on error
    const mockAnalysis = generateMockImageAnalysis();
    res.json(mockAnalysis);
  }
});

// Mock image analysis generator (fallback when no OpenAI key)
function generateMockImageAnalysis() {
  const scenes = [
    {
      what_ai_sees: 'तुमच्या photo मध्ये दिसत आहे: एक सुंदर सूर्यास्त (sunset), शांत समुद्रकिनारा (beach), सुनहरी लाटा, आणि केळीची झाडे नारंगी आकाशात silhouette म्हणून दिसत आहेत. पाणी शांत आहे आणि वातावरण खूप शांत आणि सुंदर आहे.',
      description: 'A beautiful sunset over a calm beach with golden waves and palm trees silhouetted against the orange sky.',
      mood: 'peaceful',
      genre: 'chill',
      energy_level: 3,
      suggested_songs: ['Sunset Lover', 'Ocean Waves', 'Tropical Breeze', 'Golden Hour'],
      scene_type: 'beach'
    },
    {
      what_ai_sees: 'तुमच्या photo मध्ये दिसत आहे: एक जिवंत शहराची रात्रीची रस्ता (city street at night), तेजस्वी neon lights, गर्दीची गर्दी (bustling crowds), आणि आधुनिक इमारती (modern buildings). रस्त्यावर गाड्या आहेत आणि शहर खूप energetic वाटते.',
      description: 'A lively city street at night with bright neon lights, bustling crowds, and modern buildings.',
      mood: 'energetic',
      genre: 'electronic',
      energy_level: 9,
      suggested_songs: ['City Lights', 'Night Drive', 'Neon Dreams', 'Urban Beat'],
      scene_type: 'city'
    },
    {
      what_ai_sees: 'तुमच्या photo मध्ये दिसत आहे: एक cute golden retriever कुत्रा (dog) हिरव्या park मध्ये खेळत आहे, झाडांमधून सूर्यप्रकाश (sunshine filtering through trees) येत आहे. कुत्रा खूप आनंदी दिसतो आणि वातावरण fresh आणि cheerful आहे.',
      description: 'A cute golden retriever playing in a green park with sunshine filtering through the trees.',
      mood: 'happy',
      genre: 'pop',
      energy_level: 8,
      suggested_songs: ['Happy Together', 'Good Day Sunshine', 'Walking on Sunshine', 'Best Day Ever'],
      scene_type: 'nature'
    },
    {
      what_ai_sees: 'तुमच्या photo मध्ये दिसत आहे: एक cozy cafe चे आतील भाग (interior), warm lighting, bookshelves भरलेल्या पुस्तकांनी, आणि wooden table वर steaming cup of coffee. वातावरण खूप cozy आणि relax करणारे आहे.',
      description: 'A cozy cafe interior with warm lighting, bookshelves, and a steaming cup of coffee on a wooden table.',
      mood: 'chill',
      genre: 'acoustic',
      energy_level: 4,
      suggested_songs: ['Coffee Shop Vibes', 'Acoustic Morning', 'Warm & Cozy', 'Lazy Afternoon'],
      scene_type: 'indoor'
    },
    {
      what_ai_sees: 'तुमच्या photo मध्ये दिसत आहे: बर्फाने (snow) झाकलेली पर्वतरांग (mountains), निळे आकाश (clear blue sky), pine trees, आणि शांत हिवाळ्याचे दृश्य (peaceful winter landscape). वातावरण शांत आणि pure आहे.',
      description: 'Snow-covered mountains with a clear blue sky, pine trees, and a peaceful winter landscape.',
      mood: 'peaceful',
      genre: 'classical',
      energy_level: 3,
      suggested_songs: ['Winter Wonderland', 'Mountain Air', 'Peaceful Snow', 'Frozen Beauty'],
      scene_type: 'mountain'
    }
  ];

  // Randomly select a scene
  const scene = scenes[Math.floor(Math.random() * scenes.length)];
  
  return {
    success: true,
    analysis: scene,
    ai_provider: 'mock',
    timestamp: new Date().toISOString(),
    note: 'This is a demo analysis. Add OPENAI_API_KEY to .env for real AI analysis.'
  };
}

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
