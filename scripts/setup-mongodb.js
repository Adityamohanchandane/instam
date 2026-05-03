// MongoDB Setup Script for Instam
// Run this script to initialize MongoDB with sample data

import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'instam';

// Sample songs data (same as in RecommendationView.tsx)
const sampleSongs = [
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
  }
];

async function setupMongoDB() {
  console.log('🚀 Setting up MongoDB for Instam...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Create collections with indexes
    console.log('📁 Creating collections...');
    
    // Songs collection
    const songsCollection = db.collection('songs');
    await songsCollection.createIndex({ id: 1 }, { unique: true });
    await songsCollection.createIndex({ language: 1 });
    await songsCollection.createIndex({ play_count: -1 });
    await songsCollection.createIndex({ is_trending: -1 });
    console.log('✅ Songs collection created with indexes');
    
    // User profiles collection
    const profilesCollection = db.collection('user_profiles');
    await profilesCollection.createIndex({ session_id: 1 }, { unique: true });
    console.log('✅ User profiles collection created with indexes');
    
    // Recommendation sessions collection
    const sessionsCollection = db.collection('recommendation_sessions');
    await sessionsCollection.createIndex({ session_id: 1 });
    await sessionsCollection.createIndex({ created_at: -1 });
    console.log('✅ Sessions collection created with indexes');
    
    // Song feedback collection
    const feedbackCollection = db.collection('song_feedback');
    await feedbackCollection.createIndex({ session_id: 1 });
    await feedbackCollection.createIndex({ song_id: 1 });
    await feedbackCollection.createIndex({ created_at: -1 });
    console.log('✅ Feedback collection created with indexes');
    
    // Insert sample songs
    console.log('🎵 Inserting sample songs...');
    const existingSongsCount = await songsCollection.countDocuments();
    
    if (existingSongsCount === 0) {
      const songsToAdd = sampleSongs.map(song => ({
        ...song,
        created_at: new Date(),
        updated_at: new Date()
      }));
      
      await songsCollection.insertMany(songsToToAdd);
      console.log(`✅ Inserted ${songsToToAdd.length} sample songs`);
    } else {
      console.log(`📝 Found ${existingSongsCount} existing songs, skipping sample data`);
    }
    
    // Create indexes for better performance
    console.log('🔍 Creating additional indexes...');
    
    // Compound indexes for complex queries
    await songsCollection.createIndex({ language: 1, is_trending: -1 });
    await songsCollection.createIndex({ mood_tags: 1, energy_level: -1 });
    await songsCollection.createIndex({ genre: 1, play_count: -1 });
    
    console.log('✅ Additional indexes created');
    
    // Display database stats
    const stats = await db.stats();
    console.log('\n📊 Database Statistics:');
    console.log(`   Database: ${stats.db}`);
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Display collection stats
    console.log('\n📋 Collection Statistics:');
    console.log(`   Songs: ${await songsCollection.countDocuments()} documents`);
    console.log(`   Profiles: ${await profilesCollection.countDocuments()} documents`);
    console.log(`   Sessions: ${await sessionsCollection.countDocuments()} documents`);
    console.log(`   Feedback: ${await feedbackCollection.countDocuments()} documents`);
    
    console.log('\n🎉 MongoDB setup completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Start your Instam app: npm run dev');
    console.log('   2. The app will automatically connect to MongoDB');
    console.log('   3. All user data will be stored in MongoDB');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('   • Make sure MongoDB is running on localhost:27017');
    console.log('   • Or set MONGODB_URI environment variable');
    console.log('   • Check if MongoDB authentication is required');
  } finally {
    await client.close();
  }
}

// Run the setup
setupMongoDB();
