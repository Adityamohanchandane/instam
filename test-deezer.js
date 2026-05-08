// Test Deezer API Integration via Server
// This tests the server-side Deezer API proxy

const SERVER_URL = 'http://localhost:3001';

console.log('🎵 Testing Deezer API Integration via Server...');
console.log(`📡 Server URL: ${SERVER_URL}`);

async function testDeezerAPI() {
  try {
    // First check if server is running
    console.log('\n🔍 Checking server health...');
    const healthResponse = await fetch(`${SERVER_URL}/api/health`);
    if (!healthResponse.ok) {
      console.error('❌ Server is not running! Please start with: npm run server');
      process.exit(1);
    }
    console.log('✅ Server is running');

    console.log('\n🔍 Test 1: Search for "Shape of You"');
    const response1 = await fetch(`${SERVER_URL}/api/deezer/search?query=${encodeURIComponent('shape of you')}&limit=5`);
    const results1 = await response1.json();
    console.log(`Found ${results1.length} results:`);
    results1.forEach((track, index) => {
      console.log(`${index + 1}. ${track.title} - ${track.artist}`);
    });

    console.log('\n🔍 Test 2: Search for "Tum Hi Ho"');
    const response2 = await fetch(`${SERVER_URL}/api/deezer/search?query=${encodeURIComponent('tum hi ho')}&limit=5`);
    const results2 = await response2.json();
    console.log(`Found ${results2.length} results:`);
    results2.forEach((track, index) => {
      console.log(`${index + 1}. ${track.title} - ${track.artist}`);
    });

    console.log('\n🔍 Test 3: Search for "Zingaat"');
    const response3 = await fetch(`${SERVER_URL}/api/deezer/search?query=${encodeURIComponent('zingaat')}&limit=5`);
    const results3 = await response3.json();
    console.log(`Found ${results3.length} results:`);
    results3.forEach((track, index) => {
      console.log(`${index + 1}. ${track.title} - ${track.artist}`);
    });

    console.log('\n🎵 Test 4: First song details');
    if (results1.length > 0) {
      const song = results1[0];
      console.log('Song details:');
      console.log(`- Title: ${song.title}`);
      console.log(`- Artist: ${song.artist}`);
      console.log(`- Genre: ${song.genre}`);
      console.log(`- Mood Tags: ${song.mood_tags?.join(', ') || 'N/A'}`);
      console.log(`- Energy Level: ${song.energy_level}`);
      console.log(`- Source: ${song.source}`);
    }

    console.log('\n✅ All Deezer API tests completed successfully!');

  } catch (error) {
    console.error('❌ Deezer API test failed:', error.message);
    console.log('\n💡 Make sure server is running: npm run server');
  }
}

testDeezerAPI();
