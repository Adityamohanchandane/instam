/**
 * Spotify API routes — mount at /api/spotify
 */
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { spotifyService } from "./spotify.js";
import {
  buildTargetsFromContext,
  buildSearchQueries,
  rankSpotifyTracks,
} from "./spotify-ranking.js";

const router = Router();

const spotifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  message: { error: "Too many Spotify requests — try again later" },
});

router.use(spotifyLimiter);

function safeError(error) {
  const status = error?.response?.status;
  if (status === 401 || status === 403) return "Spotify authentication failed";
  if (status === 429) return "Spotify rate limit — try again shortly";
  if (status >= 500) return "Spotify service error";
  return error?.message || "Spotify request failed";
}

router.get("/login", (req, res) => {
  try {
    if (!spotifyService.isConfigured()) {
      return res.status(503).json({ error: "Spotify not configured" });
    }
    const redirectUri = req.query.redirect_uri;
    const state = String(req.query.state || req.query.session_id || "");
    const auth_url = spotifyService.getLoginUrl(redirectUri, state);
    res.json({ auth_url, timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ error: safeError(error) });
  }
});

router.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({ error: "Authorization code missing" });
    }
    const redirectUri = req.query.redirect_uri;
    const sessionId = String(req.query.state || req.query.session_id || "default");
    const result = await spotifyService.exchangeCode(code, redirectUri, sessionId);
    res.json({
      success: true,
      session_id: result.sessionId,
      message: "Spotify connected",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Spotify callback error:", safeError(error));
    res.status(500).json({ error: safeError(error) });
  }
});

router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || req.query.query || "").trim();
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    if (!q) return res.status(400).json({ error: "q is required" });
    if (!spotifyService.isConfigured()) {
      return res.status(503).json({ error: "Spotify not configured" });
    }
    const sessionId = req.query.session_id;
    const tracks = await spotifyService.searchTracks(q, limit, sessionId);
    res.json({ tracks, count: tracks.length });
  } catch (error) {
    console.error("Spotify search error:", safeError(error));
    res.status(502).json({ error: safeError(error) });
  }
});

router.get("/trending", async (req, res) => {
  try {
    if (!spotifyService.isConfigured()) {
      return res.status(503).json({ error: "Spotify not configured" });
    }
    const limit = Math.min(Number(req.query.limit) || 20, 30);
    const sessionId = req.query.session_id;
    let tracks = await spotifyService.getNewReleases(limit, sessionId);
    if (tracks.length < 5) {
      tracks = await spotifyService.getFeaturedTracks(limit, sessionId);
    }
    res.json({ tracks, count: tracks.length });
  } catch (error) {
    res.status(502).json({ error: safeError(error) });
  }
});

router.get("/similar-artists", async (req, res) => {
  try {
    const artistId = req.query.artist_id;
    const artistName = req.query.artist_name;
    if (!artistId && !artistName) {
      return res.status(400).json({ error: "artist_id or artist_name required" });
    }
    const sessionId = req.query.session_id;
    let id = artistId;
    if (!id && artistName) {
      const artist = await spotifyService.searchArtist(artistName, sessionId);
      id = artist?.id;
    }
    if (!id) return res.status(404).json({ error: "Artist not found" });
    const artists = await spotifyService.getSimilarArtists(id, 10, sessionId);
    res.json({ artists });
  } catch (error) {
    res.status(502).json({ error: safeError(error) });
  }
});

router.post("/audio-features", async (req, res) => {
  try {
    const ids = req.body?.ids || req.body?.track_ids || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array required" });
    }
    const clean = ids.map((id) => String(id).replace(/^spotify_/, ""));
    const features = await spotifyService.getAudioFeatures(
      clean,
      req.body?.session_id,
    );
    res.json({ features });
  } catch (error) {
    res.status(502).json({ error: safeError(error) });
  }
});

router.post("/recommend", async (req, res) => {
  try {
    if (!spotifyService.isConfigured()) {
      return res.status(503).json({ error: "Spotify not configured", fallback: true });
    }

    const body = req.body || {};
    const mood = body.mood || "happy";
    const scene = body.scene || "selfie";
    const colorTone = body.colorTone || body.color_tone || "warm";
    const userProfile = body.userProfile || {};
    const imageAnalysis = body.imageAnalysis;
    const recentSongIds = body.recentSongIds || [];
    const skippedIds = body.skippedIds || [];
    const imageSeed = body.imageSeed || "";
    const sessionId = body.session_id;
    const limit = Math.min(Number(body.limit) || 20, 30);

    const ctx = { mood, scene, colorTone, imageAnalysis, userProfile };
    const { targets, genres } = buildTargetsFromContext(ctx);

    const queries = buildSearchQueries(ctx);
    const seedTrackIds = [];
    const seedArtistIds = [];

    for (const q of queries) {
      if (seedTrackIds.length >= 3) break;
      const found = await spotifyService.searchTracks(q, 3, sessionId);
      for (const t of found) {
        const sid = t.spotify_id || t.id.replace(/^spotify_/, "");
        if (!seedTrackIds.includes(sid)) seedTrackIds.push(sid);
      }
    }

    if (userProfile.favorite_artists?.[0]) {
      const artist = await spotifyService.searchArtist(
        userProfile.favorite_artists[0],
        sessionId,
      );
      if (artist?.id) seedArtistIds.push(artist.id);
    }

    let candidates = await spotifyService.getRecommendations({
      seedGenres: genres,
      seedTracks: seedTrackIds,
      seedArtists: seedArtistIds,
      targetEnergy: targets.energy,
      targetValence: targets.valence,
      targetDanceability: targets.danceability,
      targetTempo: targets.tempo,
      minTempo: targets.min_tempo,
      maxTempo: targets.max_tempo,
      limit: Math.max(limit, 25),
      sessionId,
    });

    if (candidates.length < 8) {
      const trending = await spotifyService.getNewReleases(15, sessionId);
      const seen = new Set(candidates.map((c) => c.id));
      for (const t of trending) {
        if (!seen.has(t.id)) candidates.push(t);
      }
    }

    for (const q of queries.slice(0, 2)) {
      const found = await spotifyService.searchTracks(q, 8, sessionId);
      const seen = new Set(candidates.map((c) => c.id));
      for (const t of found) {
        if (!seen.has(t.id)) candidates.push(t);
      }
    }

    const spotifyIds = candidates
      .map((t) => t.spotify_id || t.id.replace(/^spotify_/, ""))
      .filter(Boolean);
    const featuresList = await spotifyService.getAudioFeatures(spotifyIds, sessionId);
    const featuresById = {};
    for (const f of featuresList) {
      if (f?.id) featuresById[f.id] = f;
    }

    const ranked = rankSpotifyTracks(candidates, featuresById, ctx, {
      recentSongIds,
      skippedIds,
      imageSeed,
      limit,
    });

    const songs = ranked.songs;
    const safeChoice = songs[0];
    const uniquePick =
      songs.find((s) => s.genre !== safeChoice?.genre && s.id !== safeChoice?.id) ||
      songs[1] ||
      safeChoice;

    res.json({
      songs: songs.slice(0, limit),
      safeChoice: safeChoice ? { ...safeChoice, label: "safe" } : null,
      uniquePick: uniquePick ? { ...uniquePick, label: "unique" } : null,
      targets: ranked.targets,
      provider: "spotify",
      count: songs.length,
    });
  } catch (error) {
    console.error("Spotify recommend error:", safeError(error));
    res.status(502).json({ error: safeError(error), fallback: true });
  }
});

export default router;
