// Debug Deezer API Test
console.log('🎵 Debugging Deezer API...\n');

async function testDeezerDebug() {
  try {
    // Test with different queries
    const queries = ['adele', 'hello', 'shape of you', 'taylor swift'];
    
    for (const query of queries) {
      console.log(`\n🔍 Testing query: "${query}"`);
      const url = `https://api.deezer.com/search/track?q=${encodeURIComponent(query)}&limit=3`;
      console.log('URL:', url);
      
      const response = await fetch(url);
      console.log('Status:', response.status);
      
      const data = await response.json();
      console.log('Total:', data.total);
      console.log('Data length:', data.data ? data.data.length : 0);
      
      if (data.data && data.data.length > 0) {
        console.log('✅ Found tracks!');
        console.log('First track:', data.data[0].title, '-', data.data[0].artist.name);
        break;
      } else {
        console.log('⚠️ No tracks found');
        console.log('Response preview:', JSON.stringify(data).slice(0, 300));
      }
    }
    
    // Try chart endpoint
    console.log('\n🔍 Testing chart endpoint');
    const chartUrl = 'https://api.deezer.com/chart/0/tracks?limit=5';
    const chartResponse = await fetch(chartUrl);
    const chartData = await chartResponse.json();
    console.log('Chart data length:', chartData.data ? chartData.data.length : 0);
    
    if (chartData.data && chartData.data.length > 0) {
      console.log('✅ Chart working!');
      console.log('First track:', chartData.data[0].title, '-', chartData.data[0].artist.name);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testDeezerDebug();
