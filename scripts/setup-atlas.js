// MongoDB Atlas Setup for Instam
import { MongoClient } from 'mongodb';

// Use environment variable or fallback to localhost
const MONGODB_URI = process.env.VITE_MONGODB_URI || 'mongodb://localhost:27017';
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
    youtube_query: 'blinding lights the weeknd official',
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
    youtube_query: 'kala chashma baar baar dekho badshah official',
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
    youtube_query: 'brown munde ap dhillon official',
    created_at: new Date(),
    updated_at: new Date()
  }
];

async function setupAtlas() {
  console.log('🌐 Setting up MongoDB Atlas for Instam...');
  console.log(`📍 Connecting to: ${MONGODB_URI.split('@')[1]}`); // Hide credentials
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db(DB_NAME);
    
    // Create collections with indexes
    console.log('📁 Creating collections...');
    
    // Songs collection
    const songs = db.collection('songs');
    await songs.createIndex({ id: 1 }, { unique: true });
    await songs.createIndex({ language: 1 });
    await songs.createIndex({ play_count: -1 });
    await songs.createIndex({ is_trending: -1 });
    console.log('✅ Songs collection created with indexes');
    
    // User profiles collection
    const profiles = db.collection('user_profiles');
    await profiles.createIndex({ session_id: 1 }, { unique: true });
    console.log('✅ User profiles collection created with indexes');
    
    // Sessions collection
    const sessions = db.collection('recommendation_sessions');
    await sessions.createIndex({ session_id: 1 });
    await sessions.createIndex({ created_at: -1 });
    console.log('✅ Sessions collection created with indexes');
    
    // Feedback collection
    const feedback = db.collection('song_feedback');
    await feedback.createIndex({ session_id: 1 });
    await feedback.createIndex({ song_id: 1 });
    await feedback.createIndex({ created_at: -1 });
    console.log('✅ Feedback collection created with indexes');
    
    // Insert sample songs
    console.log('🎵 Inserting sample songs...');
    const existingCount = await songs.countDocuments();
    
    if (existingCount === 0) {
      await songs.insertMany(sampleSongs);
      console.log(`✅ Inserted ${sampleSongs.length} sample songs`);
    } else {
      console.log(`📝 Found ${existingCount} existing songs`);
    }
    
    // Create compound indexes
    console.log('🔍 Creating compound indexes...');
    await songs.createIndex({ language: 1, is_trending: -1 });
    await songs.createIndex({ mood_tags: 1, energy_level: -1 });
    await songs.createIndex({ genre: 1, play_count: -1 });
    console.log('✅ Compound indexes created');
    
    // Display stats
    console.log('\n📊 Atlas Database Statistics:');
    console.log(`   Database: ${DB_NAME}`);
    console.log(`   Songs: ${await songs.countDocuments()} documents`);
    console.log(`   Profiles: ${await profiles.countDocuments()} documents`);
    console.log(`   Sessions: ${await sessions.countDocuments()} documents`);
    console.log(`   Feedback: ${await feedback.countDocuments()} documents`);
    
    console.log('\n🎉 MongoDB Atlas setup completed successfully!');
    console.log('\n🚀 Your Instam app is now ready with cloud database!');
    console.log('💾 All data will be stored in MongoDB Atlas');
    console.log('🌍 Accessible from anywhere in the world');
    
  } catch (error) {
    console.error('❌ Atlas setup failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   • Check your MongoDB Atlas connection string');
    console.log('   • Ensure IP access is configured in Atlas');
    console.log('   • Verify database user permissions');
    console.log('   • Check network connectivity');
  } finally {
    await client.close();
  }
}

setupAtlas();
