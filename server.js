// MongoDB API Server for Instam
// Run this server to enable MongoDB Atlas connection

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import axios from "axios";
import crypto from "crypto";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || process.env.VITE_SPOTIFY_CLIENT_SECRET;
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || process.env.VITE_YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || process.env.VITE_YOUTUBE_CLIENT_SECRET;
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID || process.env.VITE_INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET || process.env.VITE_INSTAGRAM_APP_SECRET;

// Initialize Express App
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// MongoDB Connection (optional)
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log("✅ MongoDB connected successfully");
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err);
    });
} else {
  console.warn("⚠️  MONGODB_URI not configured. MongoDB features disabled.");
}

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is healthy", timestamp: new Date() });
});

// Status Endpoint
app.get("/api/status", (req, res) => {
  res.status(200).json({
    status: "running",
    port: 3001,
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// OpenAI Endpoint
app.post("/api/ai/openai", async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user",
            content: req.body.message || "Hello",
          },
        ],
      },
      {
        headers: {
          Authorization: "Bearer " + OPENAI_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    res.status(200).json({
      response: response.data.choices[0].message.content,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("OpenAI error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Claude Endpoint
app.post("/api/ai/claude", async (req, res) => {
  try {
    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ error: "Claude API key not configured" });
    }
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: req.body.message || "Hello",
          },
        ],
      },
      {
        headers: {
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );
    res.status(200).json({
      response: response.data.content[0].text,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Claude error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Gemini Endpoint
app.post("/api/ai/gemini", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY;
    const response = await axios.post(url, {
      contents: [{
        parts: [{
          text: req.body.message || "Hello"
        }]
      }]
    }, {
      headers: { "Content-Type": "application/json" }
    });
    res.status(200).json({
      response: response.data.candidates[0].content.parts[0].text,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Gemini error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Spotify OAuth Login Endpoint
app.get("/auth/spotify/login", (req, res) => {
  try {
    if (!SPOTIFY_CLIENT_ID) {
      return res.status(500).json({ error: "Spotify client ID not configured" });
    }
    const redirectUri = encodeURIComponent("http://localhost:5173/auth/spotify/callback");
    const scope = encodeURIComponent("user-read-private user-read-email");
    const authUrl = "https://accounts.spotify.com/authorize?client_id=" + SPOTIFY_CLIENT_ID + "&response_type=code&redirect_uri=" + redirectUri + "&scope=" + scope;
    res.status(200).json({ auth_url: authUrl, timestamp: new Date() });
  } catch (error) {
    console.error("Spotify login error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// YouTube OAuth Login Endpoint
app.get("/auth/youtube/login", (req, res) => {
  try {
    if (!YOUTUBE_CLIENT_ID) {
      return res.status(500).json({ error: "YouTube client ID not configured" });
    }
    const redirectUri = encodeURIComponent("http://localhost:5173/auth/youtube/callback");
    const scope = encodeURIComponent("https://www.googleapis.com/auth/youtube.readonly");
    const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?client_id=" + YOUTUBE_CLIENT_ID + "&response_type=code&redirect_uri=" + redirectUri + "&scope=" + scope;
    res.status(200).json({ auth_url: authUrl, timestamp: new Date() });
  } catch (error) {
    console.error("YouTube login error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Instagram OAuth Login Endpoint
app.get("/auth/instagram/login", (req, res) => {
  try {
    if (!INSTAGRAM_APP_ID) {
      return res.status(500).json({ error: "Instagram app ID not configured" });
    }
    const redirectUri = encodeURIComponent("http://localhost:5173/auth/instagram/callback");
    const scope = encodeURIComponent("user_profile,user_media");
    const authUrl = "https://api.instagram.com/oauth/authorize?client_id=" + INSTAGRAM_APP_ID + "&redirect_uri=" + redirectUri + "&scope=" + scope + "&response_type=code";
    res.status(200).json({ auth_url: authUrl, timestamp: new Date() });
  } catch (error) {
    console.error("Instagram login error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Instagram OAuth Callback Endpoint
app.get("/auth/instagram/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: "Authorization code not provided" });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post("https://api.instagram.com/oauth/access_token", {
      client_id: INSTAGRAM_APP_ID,
      client_secret: INSTAGRAM_APP_SECRET,
      grant_type: "authorization_code",
      redirect_uri: "http://localhost:5173/auth/instagram/callback",
      code: code
    });

    const accessToken = tokenResponse.data.access_token;
    const userId = tokenResponse.data.user_id;

    // Get user profile
    const userResponse = await axios.get(`https://graph.instagram.com/${userId}?fields=id,username,account_type,media_count&access_token=${accessToken}`);

    res.status(200).json({
      access_token: accessToken,
      user_id: userId,
      user_data: userResponse.data,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Instagram callback error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Instagram User Media Endpoint
app.get("/api/instagram/media", async (req, res) => {
  try {
    const { access_token } = req.query;
    if (!access_token) {
      return res.status(400).json({ error: "Access token not provided" });
    }

    const response = await axios.get(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${access_token}`);
    
    res.status(200).json({
      media: response.data.data,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Instagram media error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Instagram User Profile Endpoint
app.get("/api/instagram/profile", async (req, res) => {
  try {
    const { access_token } = req.query;
    if (!access_token) {
      return res.status(400).json({ error: "Access token not provided" });
    }

    const response = await axios.get(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${access_token}`);
    
    res.status(200).json({
      profile: response.data,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Instagram profile error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 404 Error Handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global error:", err.message);
  res.status(500).json({ error: "Internal Server Error", timestamp: new Date() });
});

// Start Server
const PORT = Number(process.env.PORT) || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other process or set PORT in .env.`,
    );
    process.exit(1);
  }
  throw err;
});
