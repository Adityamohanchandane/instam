// Test Deezer API Integration
import { deezerAPI } from './src/lib/deezer-api.js';

console.log('🎵 Testing Deezer API Integration...');

async function testDeezerAPI() {
  try {
    console.log('\n🔍 Test 1: Search for "Shape of You"');
    const results1 = await deezerAPI.searchTracks('shape of you', 5);
    console.log(`Found ${results1.length} results:`);
    results1.forEach((track, index) => {
      console.log(`${index + 1}. ${track.title} - ${track.artist.name}`);
    });

    console.log('\n🔍 Test 2: Search for "Tum Hi Ho"');
    const results2 = await deezerAPI.searchTracks('tum hi ho', 5);
    console.log(`Found ${results2.length} results:`);
    results2.forEach((track, index) => {
      console.log(`${index + 1}. ${track.title} - ${track.artist.name}`);
    });

    console.log('\n🔍 Test 3: Search for "Zingaat"');
    const results3 = await deezerAPI.searchTracks('zingaat', 5);
    console.log(`Found ${results3.length} results:`);
    results3.forEach((track, index) => {
      console.log(`${index + 1}. ${track.title} - ${track.artist.name}`);
    });

    console.log('\n🎵 Test 4: Convert to Song format');
    if (results1.length > 0) {
      const song = deezerAPI.convertToSong(results1[0], 'en');
      console.log('Converted song:');
      console.log(`- Title: ${song.title}`);
      console.log(`- Artist: ${song.artist}`);
      console.log(`- Genre: ${song.genre}`);
      console.log(`- Mood Tags: ${song.mood_tags.join(', ')}`);
      console.log(`- Energy Level: ${song.energy_level}`);
      console.log(`- Source: ${song.source}`);
    }

    console.log('\n✅ All Deezer API tests completed successfully!');

  } catch (error) {
    console.error('❌ Deezer API test failed:', error.message);
  }
}

testDeezerAPI();
