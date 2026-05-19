import axios from "axios";

const BASE_URL = "http://localhost:3001";

console.log("🧪 Testing API Connections...\n");

// Test OpenAI
async function testOpenAI() {
  try {
    const response = await axios.post(`${BASE_URL}/api/ai/openai`, {
      message: "Hello, say 'OpenAI is working!'"
    });
    console.log("✅ OpenAI API:", response.data.response);
  } catch (error) {
    console.log("❌ OpenAI API:", error.response?.data?.error || error.message);
  }
}

// Test Claude
async function testClaude() {
  try {
    const response = await axios.post(`${BASE_URL}/api/ai/claude`, {
      message: "Hello, say 'Claude is working!'"
    });
    console.log("✅ Claude API:", response.data.response);
  } catch (error) {
    console.log("❌ Claude API:", error.response?.data?.error || error.message);
  }
}

// Test Gemini
async function testGemini() {
  try {
    const response = await axios.post(`${BASE_URL}/api/ai/gemini`, {
      message: "Hello, say 'Gemini is working!'"
    });
    console.log("✅ Gemini API:", response.data.response);
  } catch (error) {
    console.log("❌ Gemini API:", error.response?.data?.error || error.message);
  }
}

// Test Spotify Auth URL
async function testSpotify() {
  try {
    const response = await axios.get(`${BASE_URL}/auth/spotify/login`);
    console.log("✅ Spotify Auth: URL generated successfully");
    console.log("   Auth URL:", response.data.auth_url.substring(0, 80) + "...");
  } catch (error) {
    console.log("❌ Spotify Auth:", error.response?.data?.error || error.message);
  }
}

// Test YouTube Auth URL
async function testYouTube() {
  try {
    const response = await axios.get(`${BASE_URL}/auth/youtube/login`);
    console.log("✅ YouTube Auth: URL generated successfully");
    console.log("   Auth URL:", response.data.auth_url.substring(0, 80) + "...");
  } catch (error) {
    console.log("❌ YouTube Auth:", error.response?.data?.error || error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testOpenAI();
  await testClaude();
  await testGemini();
  await testSpotify();
  await testYouTube();
  console.log("\n✨ API Testing Complete!");
}

runAllTests();
