const RECENT_SONGS_KEY = "instam_recent_song_ids";
const SKIPPED_SONGS_KEY = "instam_skipped_song_ids";
const MAX_RECENT = 40;

interface SkippedSong {
  id: string;
  timestamp: number;
}

export function getRecentSongIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(RECENT_SONGS_KEY);
    if (!raw) return new Set();
    const ids: string[] = JSON.parse(raw);
    return new Set(ids);
  } catch {
    return new Set();
  }
}

export function addRecentSongIds(ids: string[]): void {
  if (ids.length === 0) return;
  const current = [...getRecentSongIds()];
  for (const id of ids) {
    const idx = current.indexOf(id);
    if (idx !== -1) current.splice(idx, 1);
    current.push(id);
  }
  const trimmed = current.slice(-MAX_RECENT);
  sessionStorage.setItem(RECENT_SONGS_KEY, JSON.stringify(trimmed));
}

export function getSkippedSongs(): Map<string, SkippedSong> {
  try {
    const raw = sessionStorage.getItem(SKIPPED_SONGS_KEY);
    if (!raw) return new Map();
    const data: SkippedSong[] = JSON.parse(raw);
    return new Map(data.map(s => [s.id, s]));
  } catch {
    return new Map();
  }
}

export function addSkippedSong(id: string): void {
  const current = getSkippedSongs();
  current.set(id, { id, timestamp: Date.now() });
  sessionStorage.setItem(SKIPPED_SONGS_KEY, JSON.stringify(Array.from(current.values())));
}

export function getSkipPenalty(songId: string): number {
  const skipped = getSkippedSongs();
  const song = skipped.get(songId);
  if (!song) return 0;

  const hoursAgo = (Date.now() - song.timestamp) / (1000 * 60 * 60);

  if (hoursAgo < 1) return 0.99;
  if (hoursAgo < 8) return 0.80;
  if (hoursAgo < 24) return 0.40;
  if (hoursAgo < 48) return 0.05;
  return 0;
}

export function clearExpiredSkippedSongs(): void {
  const skipped = getSkippedSongs();
  const now = Date.now();
  const TwoDaysMs = 48 * 60 * 60 * 1000;

  for (const [id, song] of skipped.entries()) {
    if (now - song.timestamp > TwoDaysMs) {
      skipped.delete(id);
    }
  }

  if (skipped.size > 0) {
    sessionStorage.setItem(SKIPPED_SONGS_KEY, JSON.stringify(Array.from(skipped.values())));
  } else {
    sessionStorage.removeItem(SKIPPED_SONGS_KEY);
  }
}

export function buildImageRecSeed(analysis?: {
  objects?: { class: string }[];
  mood?: { primary: string };
  scene?: { type: string };
  timestamp?: number;
}): string {
  if (!analysis) return `default:${Date.now()}`;
  const objects = (analysis.objects || [])
    .map((o) => o.class)
    .sort()
    .join(",");
  return `${analysis.mood?.primary || "mood"}:${analysis.scene?.type || "scene"}:${objects}`;
}

export function getRecentSongsTimestamps(): Map<string, number> {
  try {
    const raw = sessionStorage.getItem(RECENT_SONGS_KEY + "_ts");
    if (!raw) return new Map();
    const data: [string, number][] = JSON.parse(raw);
    return new Map(data);
  } catch {
    return new Map();
  }
}

export function addRecentSongWithTimestamp(id: string): void {
  const timestamps = getRecentSongsTimestamps();
  timestamps.set(id, Date.now());
  sessionStorage.setItem(RECENT_SONGS_KEY + "_ts", JSON.stringify(Array.from(timestamps.entries())));
}

export function getRecentSongPenalty(songId: string): number {
  const timestamps = getRecentSongsTimestamps();
  const timestamp = timestamps.get(songId);
  if (!timestamp) return 0;

  const hoursAgo = (Date.now() - timestamp) / (1000 * 60 * 60);
  const daysAgo = hoursAgo / 24;

  if (daysAgo < 0.042) return 0.95; // played today
  if (daysAgo < 1) return 0.70; // played yesterday
  if (daysAgo < 3) return 0.20; // played 3 days ago
  return 0;
}
