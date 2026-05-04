// Test MongoDB Connection Script
import { MongoClient } from 'mongodb';

const connectionString = 'mongodb+srv://instam:instam2007@cluster.t0hdrjh.mongodb.net/?appName=Cluster';

console.log('🔍 Testing MongoDB Connection...');
console.log('📡 Connection String:', connectionString);
console.log('');

async function testConnection() {
  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    
    const client = new MongoClient(connectionString);
    await client.connect();
    
    console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
    
    // Test database operations
    const db = client.db('instam');
    const collections = await db.listCollections().toArray();
    console.log('📁 Available Collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('🔌 Connection closed successfully');
    
  } catch (error) {
    console.error('❌ FAILED: Connection failed');
    console.error('🔍 Error Details:', error.message);
    console.error('📊 Error Code:', error.code);
    console.error('🏷️  Error Name:', error.codeName);
    
    if (error.codeName === 'AtlasError') {
      console.log('');
      console.log('💡 Possible Solutions:');
      console.log('1. Check username/password in MongoDB Atlas');
      console.log('2. Verify user has correct permissions');
      console.log('3. Ensure IP address is whitelisted');
      console.log('4. Check if cluster name is correct');
    }
  }
}

testConnection();
