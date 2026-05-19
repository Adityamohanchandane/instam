const RECENT_SONGS_KEY = "instam_recent_song_ids";
const MAX_RECENT = 40;

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
