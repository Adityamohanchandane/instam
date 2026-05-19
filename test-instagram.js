import axios from "axios";

const BASE_URL = "http://localhost:3001";

console.log("🧪 Testing Instagram API Connections...\n");

// Test Instagram Login URL
async function testInstagramLogin() {
  try {
    const response = await axios.get(`${BASE_URL}/auth/instagram/login`);
    console.log("✅ Instagram Login: URL generated successfully");
    console.log("   Auth URL:", response.data.auth_url.substring(0, 80) + "...");
  } catch (error) {
    console.log("❌ Instagram Login:", error.response?.data?.error || error.message);
  }
}

// Run test
async function runTest() {
  await testInstagramLogin();
  console.log("\n✨ Instagram API Testing Complete!");
  console.log("\n📝 Note: Full OAuth flow requires user interaction.");
  console.log("   The login URL is ready for user authentication.");
}

runTest();
