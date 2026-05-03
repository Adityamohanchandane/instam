// Simple MongoDB Setup
import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'instam';

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
  }
];

async function setup() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const songs = db.collection('songs');
    
    const count = await songs.countDocuments();
    if (count === 0) {
      await songs.insertMany(sampleSongs);
      console.log(`✅ Inserted ${sampleSongs.length} sample songs`);
    } else {
      console.log(`📝 Found ${count} existing songs`);
    }
    
    console.log('🎉 MongoDB setup completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

setup();
