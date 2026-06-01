/**
 * Spotify Web API service — server-side only. Never log tokens or secrets.
 */
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getEnv } from "./env.js";
import { withRetry } from "./retry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";
const TOKEN_STORE = path.join(__dirname, "data", "spotify-tokens.json");

const DEFAULT_REDIRECTS = [
  "http://localhost:5173/auth/spotify/callback",
  "http://127.0.0.1:5173/auth/spotify/callback",
];

const SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-top-read",
  "playlist-read-private",
].join(" ");

export function getAllowedRedirectUris() {
  const fromEnv = getEnv("SPOTIFY_REDIRECT_URIS") || getEnv("SPOTIFY_REDIRECT_URI");
  if (!fromEnv) return DEFAULT_REDIRECTS;
  return fromEnv.split(",").map((u) => u.trim()).filter(Boolean);
}

function resolveRedirectUri(requested) {
  const allowed = getAllowedRedirectUris();
  if (requested && allowed.includes(requested)) return requested;
  return allowed[0];
}

export class SpotifyService {
  constructor() {
    this.clientId = getEnv("SPOTIFY_CLIENT_ID");
    this.clientSecret = getEnv("SPOTIFY_CLIENT_SECRET");
    this.defaultRedirect = resolveRedirectUri();
    this.appToken = null;
    this.appTokenExpiry = 0;
    /** @type {Map<string, { access_token: string, refresh_token?: string, expires_at: number }>} */
    this.userTokens = new Map();
    this.loadTokenStore();
  }

  isConfigured() {
    return Boolean(this.clientId && this.clientSecret);
  }

  loadTokenStore() {
    try {
      if (!fs.existsSync(TOKEN_STORE)) return;
      const raw = JSON.parse(fs.readFileSync(TOKEN_STORE, "utf8"));
      for (const [sessionId, data] of Object.entries(raw)) {
        this.userTokens.set(sessionId, data);
      }
    } catch {
      /* ignore corrupt store */
    }
  }

  persistTokenStore() {
    try {
      const dir = path.dirname(TOKEN_STORE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const obj = Object.fromEntries(this.userTokens);
      fs.writeFileSync(TOKEN_STORE, JSON.stringify(obj, null, 2), "utf8");
    } catch (err) {
      console.warn("Could not persist Spotify tokens:", err.message);
    }
  }

  getLoginUrl(redirectUri, state = "") {
    if (!this.clientId) throw new Error("Spotify client ID not configured");
    const uri = resolveRedirectUri(redirectUri);
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      redirect_uri: uri,
      scope: SCOPES,
      show_dialog: "true",
    });
    if (state) params.set("state", state);
    return `https://accounts.spotify.com/authorize?${params}`;
  }

  async getAppAccessToken() {
    if (!this.isConfigured()) {
      throw new Error("Spotify credentials not configured");
    }
    if (this.appToken && Date.now() < this.appTokenExpiry - 60_000) {
      return this.appToken;
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
    });
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      "base64",
    );

    const res = await withRetry(
      () =>
        axios.post(TOKEN_URL, body, {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 15000,
        }),
      { maxRetries: 2 },
    );

    this.appToken = res.data.access_token;
    this.appTokenExpiry = Date.now() + (res.data.expires_in || 3600) * 1000;
    return this.appToken;
  }

  async exchangeCode(code, redirectUri, sessionId = "default") {
    const uri = resolveRedirectUri(redirectUri);
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: uri,
    });
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      "base64",
    );

    const res = await axios.post(TOKEN_URL, body, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 15000,
    });

    const entry = {
      access_token: res.data.access_token,
      refresh_token: res.data.refresh_token,
      expires_at: Date.now() + (res.data.expires_in || 3600) * 1000,
    };
    this.userTokens.set(sessionId, entry);
    this.persistTokenStore();
    return { sessionId, expires_in: res.data.expires_in };
  }

  async refreshUserToken(sessionId) {
    const entry = this.userTokens.get(sessionId);
    if (!entry?.refresh_token) return null;

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: entry.refresh_token,
    });
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      "base64",
    );

    const res = await axios.post(TOKEN_URL, body, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 15000,
    });

    entry.access_token = res.data.access_token;
    if (res.data.refresh_token) entry.refresh_token = res.data.refresh_token;
    entry.expires_at = Date.now() + (res.data.expires_in || 3600) * 1000;
    this.userTokens.set(sessionId, entry);
    this.persistTokenStore();
    return entry.access_token;
  }

  async getAccessToken(sessionId) {
    if (sessionId && this.userTokens.has(sessionId)) {
      const entry = this.userTokens.get(sessionId);
      if (Date.now() < entry.expires_at - 60_000) {
        return entry.access_token;
      }
      const refreshed = await this.refreshUserToken(sessionId);
      if (refreshed) return refreshed;
    }
    return this.getAppAccessToken();
  }

  async apiGet(path, params = {}, sessionId) {
    const token = await this.getAccessToken(sessionId);
    const res = await withRetry(
      () =>
        axios.get(`${API_BASE}${path}`, {
          params,
          headers: { Authorization: `Bearer ${token}` },
          timeout: 20000,
        }),
      { maxRetries: 2 },
    );
    return res.data;
  }

  async searchTracks(query, limit = 20, sessionId) {
    const data = await this.apiGet(
      "/search",
      { q: query, type: "track", limit: Math.min(limit, 50) },
      sessionId,
    );
    return (data.tracks?.items || []).map(mapSpotifyTrack);
  }

  async getAudioFeatures(trackIds, sessionId) {
    const ids = trackIds.filter(Boolean).slice(0, 100);
    if (ids.length === 0) return [];
    const data = await this.apiGet(
      "/audio-features",
      { ids: ids.join(",") },
      sessionId,
    );
    return data.audio_features || [];
  }

  async getRecommendations({
    seedGenres = [],
    seedTracks = [],
    seedArtists = [],
    targetEnergy,
    targetValence,
    targetDanceability,
    targetTempo,
    minTempo,
    maxTempo,
    limit = 20,
    sessionId,
  }) {
    const params = {
      limit: Math.min(limit, 50),
      seed_genres: seedGenres.length ? seedGenres.slice(0, 2) : ["pop"],
      seed_tracks: seedTracks.slice(0, 3),
      seed_artists: seedArtists.slice(0, 2),
    };
    if (targetEnergy != null) params.target_energy = targetEnergy;
    if (targetValence != null) params.target_valence = targetValence;
    if (targetDanceability != null) params.target_danceability = targetDanceability;
    if (targetTempo != null) params.target_tempo = targetTempo;
    if (minTempo != null) params.min_tempo = minTempo;
    if (maxTempo != null) params.max_tempo = maxTempo;

    const token = await this.getAccessToken(sessionId);
    const res = await withRetry(
      () =>
        axios.get(`${API_BASE}/recommendations`, {
          params,
          headers: { Authorization: `Bearer ${token}` },
          timeout: 20000,
          paramsSerializer: {
            indexes: null,
          },
        }),
      { maxRetries: 2 },
    );

    return (res.data.tracks || []).map(mapSpotifyTrack);
  }

  async getFeaturedTracks(limit = 20, sessionId) {
    try {
      const featured = await this.apiGet("/browse/featured-playlists", { limit: 5 }, sessionId);
      const playlist = featured.playlists?.items?.[0];
      if (!playlist?.id) return [];
      const tracks = await this.apiGet(
        `/playlists/${playlist.id}/tracks`,
        { limit: Math.min(limit, 50), market: "US" },
        sessionId,
      );
      return (tracks.items || [])
        .map((item) => item.track)
        .filter(Boolean)
        .map(mapSpotifyTrack);
    } catch {
      return [];
    }
  }

  async getNewReleases(limit = 20, sessionId) {
    try {
      const data = await this.apiGet(
        "/browse/new-releases",
        { limit: Math.min(limit, 20) },
        sessionId,
      );
      const album = data.albums?.items?.[0];
      if (!album?.id) return this.getFeaturedTracks(limit, sessionId);
      const tracks = await this.apiGet(`/albums/${album.id}/tracks`, { limit: 20 }, sessionId);
      return (tracks.items || []).map((t) => ({
        ...mapSpotifyTrack({
          id: t.id,
          name: t.name,
          artists: t.artists,
          album: { images: album.images, name: album.name },
          preview_url: null,
          popularity: album.popularity || 70,
          external_urls: t.external_urls,
        }),
        is_trending: true,
      }));
    } catch {
      return [];
    }
  }

  async getSimilarArtists(artistId, limit = 10, sessionId) {
    const data = await this.apiGet(
      `/artists/${artistId}/related-artists`,
      {},
      sessionId,
    );
    return (data.artists || []).slice(0, limit).map((a) => ({
      id: a.id,
      name: a.name,
      genres: a.genres || [],
      popularity: a.popularity,
      image: a.images?.[0]?.url,
    }));
  }

  async searchArtist(name, sessionId) {
    const data = await this.apiGet(
      "/search",
      { q: name, type: "artist", limit: 1 },
      sessionId,
    );
    return data.artists?.items?.[0] || null;
  }
}

export function mapSpotifyTrack(track) {
  const spotifyId = track.id;
  const artistNames = (track.artists || []).map((a) => a.name).join(", ");
  const genreGuess = inferGenreFromTrack(track);
  return {
    id: `spotify_${spotifyId}`,
    spotify_id: spotifyId,
    title: track.name,
    artist: artistNames || "Unknown",
    language: "English",
    genre: genreGuess,
    mood_tags: [],
    scene_tags: [],
    personality_tags: [],
    color_tone_tags: [],
    energy_level: Math.round((track.popularity || 50) / 10),
    is_trending: (track.popularity || 0) >= 75,
    trend_region: "Global",
    play_count: (track.popularity || 0) * 1_000_000,
    youtube_query: `${track.name} ${artistNames}`,
    preview_url: track.preview_url || undefined,
    album_art: track.album?.images?.[0]?.url,
    album: track.album?.name,
    duration: track.duration_ms ? Math.round(track.duration_ms / 1000) : undefined,
    source: "spotify",
    spotify_url: track.external_urls?.spotify,
  };
}

function inferGenreFromTrack(track) {
  const text = `${track.name} ${(track.artists || []).map((a) => a.name).join(" ")}`.toLowerCase();
  if (text.includes("remix") || text.includes("club")) return "Dance";
  if (text.includes("acoustic") || text.includes("unplugged")) return "Indie";
  if (text.includes("love") || text.includes("heart")) return "Romantic";
  return "Pop";
}

export const spotifyService = new SpotifyService();
