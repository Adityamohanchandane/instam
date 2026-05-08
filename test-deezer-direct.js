// Direct Deezer API Test
console.log('🎵 Testing Deezer API directly...\n');

async function testDeezerDirect() {
  try {
    // Test 1: Direct Deezer API call
    console.log('🔍 Test 1: Direct Deezer API call');
    const query = 'hello';
    const url = `https://api.deezer.com/search/track?q=${encodeURIComponent(query)}&limit=5`;
    console.log('URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('Response structure:', Object.keys(data));
    
    if (data.data && Array.isArray(data.data)) {
      console.log(`✅ Found ${data.data.length} tracks`);
      if (data.data.length > 0) {
        console.log('First track:', data.data[0].title, '-', data.data[0].artist.name);
      }
    } else {
      console.log('⚠️ No data array found');
      console.log('Full response:', JSON.stringify(data).slice(0, 200));
    }
    
    // Test 2: Server endpoint
    console.log('\n🔍 Test 2: Local server endpoint');
    const serverResponse = await fetch('http://localhost:3001/api/deezer/search?query=hello&limit=5');
    console.log('Server response status:', serverResponse.status);
    
    const serverData = await serverResponse.json();
    console.log(`Server returned ${serverData.length} results`);
    
    // Test 3: Status endpoint
    console.log('\n🔍 Test 3: Server status');
    const statusResponse = await fetch('http://localhost:3001/api/status');
    const status = await statusResponse.json();
    console.log('Status:', JSON.stringify(status, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDeezerDirect();
