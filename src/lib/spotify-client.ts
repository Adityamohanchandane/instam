import type { UserProfile, Song, RecommendationResult, MoodType, SceneType, ColorTone } from "./types";
import type { RealImageAnalysis } from "./real-image-analyzer";

const API_BASE = import.meta.env.DEV ? "http://localhost:3001/api" : "/api";

export interface SpotifyRecommendRequest {
  mood: MoodType;
  scene: SceneType;
  colorTone: ColorTone;
  userProfile: UserProfile;
  imageAnalysis?: RealImageAnalysis | null;
  recentSongIds?: string[];
  skippedIds?: string[];
  imageSeed?: string;
  session_id?: string;
  limit?: number;
}

export async function fetchSpotifyRecommendations(
  req: SpotifyRecommendRequest,
): Promise<RecommendationResult | null> {
  try {
    const response = await fetch(`${API_BASE}/spotify/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood: req.mood,
        scene: req.scene,
        colorTone: req.colorTone,
        userProfile: req.userProfile,
        imageAnalysis: req.imageAnalysis,
        recentSongIds: [...(req.recentSongIds || [])],
        skippedIds: [...(req.skippedIds || [])],
        imageSeed: req.imageSeed,
        session_id: req.session_id || req.userProfile.session_id,
        limit: req.limit ?? 12,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.warn("Spotify recommend failed:", err.error || response.statusText);
      return null;
    }

    const data = await response.json();
    if (!data.songs?.length) return null;

    return {
      songs: data.songs,
      safeChoice: data.safeChoice || data.songs[0],
      uniquePick: data.uniquePick || data.songs[1] || data.songs[0],
    };
  } catch (error) {
    console.warn("Spotify recommend error:", error);
    return null;
  }
}

export async function searchSpotifyTracks(
  query: string,
  limit = 15,
  sessionId?: string,
): Promise<Song[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (sessionId) params.set("session_id", sessionId);
  const response = await fetch(`${API_BASE}/spotify/search?${params}`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.tracks || [];
}

export async function getSpotifyLoginUrl(
  redirectUri?: string,
  sessionId?: string,
): Promise<string | null> {
  const params = new URLSearchParams();
  if (redirectUri) params.set("redirect_uri", redirectUri);
  if (sessionId) params.set("state", sessionId);
  const response = await fetch(`${API_BASE}/spotify/login?${params}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.auth_url || null;
}

export async function connectSpotifyCallback(
  code: string,
  redirectUri: string,
  sessionId?: string,
): Promise<boolean> {
  const params = new URLSearchParams({
    code,
    redirect_uri: redirectUri,
  });
  if (sessionId) params.set("state", sessionId);
  const response = await fetch(`${API_BASE}/spotify/callback?${params}`);
  return response.ok;
}
