// Multi-API Music Service for Instam
// Combines Spotify, YouTube, and Last.fm for best results
// With smart caching to minimize API calls

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  language: string;
  genre: string;
  mood_tags: string[];
  scene_tags: string[];
  personality_tags: string[];
  color_tone_tags: string[];
  energy_level: number;
  is_trending: boolean;
  trend_region: string;
  play_count: number;
  youtube_query: string;
  preview_url?: string;
  album_art?: string;
  duration?: number;
  source: 'spotify' | 'youtube' | 'lastfm' | 'local' | 'cached';
}

// Cache Manager using localStorage (fallback to memory)
class SongCache {
  private cache: Map<string, Song[]> = new Map();
  private readonly CACHE_PREFIX = 'instam_songs_';
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  get(key: string): Song[] | null {
    // Try memory cache first
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // Try localStorage
    const cached = localStorage.getItem(this.CACHE_PREFIX + key);
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < this.CACHE_DURATION) {
        this.cache.set(key, data.songs);
        return data.songs;
      }
    }

    return null;
  }

  set(key: string, songs: Song[]) {
    this.cache.set(key, songs);
    localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify({
      songs,
      timestamp: Date.now()
    }));
  }

  clear() {
    this.cache.clear();
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.CACHE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  }
}

// YouTube Data API - Best for Indian/Bollywood songs
class YouTubeMusicAPI {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_YOUTUBE_API_KEY || '';
  }

  async searchSongs(query: string, limit: number = 10, language?: string): Promise<Song[]> {
    if (!this.apiKey) {
      console.log('⚠️ YouTube API key not configured');
      return [];
    }

    try {
      // Add language filter
      const searchQuery = language ? `${query} ${language} song` : `${query} song`;
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoCategoryId=10&maxResults=${limit}&key=${this.apiKey}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`YouTube API error: ${response.status}`);

      const data = await response.json();
      
      return data.items.map((item: any, index: number) => ({
        id: `yt_${item.id.videoId}`,
        title: item.snippet.title.split(' - ')[0]?.split(' | ')[0] || item.snippet.title,
        artist: item.snippet.title.split(' - ')[1] || item.snippet.channelTitle,
        album: item.snippet.title,
        language: language || this.detectLanguage(item.snippet.title),
        genre: this.detectGenre(item.snippet.title),
        mood_tags: this.extractMoodTags(item.snippet.title),
        scene_tags: [],
        personality_tags: [],
        color_tone_tags: [],
        energy_level: this.detectEnergyLevel(item.snippet.title),
        is_trending: index < 3,
        trend_region: 'Global',
        play_count: 0,
        youtube_query: item.id.videoId,
        preview_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        album_art: item.snippet.thumbnails?.medium?.url,
        duration: 0,
        source: 'youtube'
      }));
    } catch (error) {
      console.error('❌ YouTube API error:', error);
      return [];
    }
  }

  private detectLanguage(title: string): string {
    const lower = title.toLowerCase();
    if (/[\u0900-\u097F]/.test(title) || lower.includes('hindi')) return 'Hindi';
    if (/[\u0C00-\u0C7F]/.test(title) || lower.includes('marathi')) return 'Marathi';
    if (/[\u0B80-\u0BFF]/.test(title) || lower.includes('tamil')) return 'Tamil';
    if (/[\u0C80-\u0CFF]/.test(title) || lower.includes('telugu')) return 'Telugu';
    if (/[\u0A80-\u0AFF]/.test(title) || lower.includes('gujarati')) return 'Gujarati';
    if (/[\u0A00-\u0A7F]/.test(title) || lower.includes('punjabi')) return 'Punjabi';
    if (lower.includes('english') || /^[a-zA-Z\s\-0-9]+$/.test(title)) return 'English';
    return 'Other';
  }

  private detectGenre(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('romantic') || lower.includes('love')) return 'Romantic';
    if (lower.includes('party') || lower.includes('dance')) return 'Pop';
    if (lower.includes('sad') || lower.includes('emotional')) return 'Sad';
    if (lower.includes('rock')) return 'Rock';
    if (lower.includes('classical') || lower.includes('ghazal')) return 'Classical';
    if (lower.includes('edm') || lower.includes('electronic')) return 'Electronic';
    if (lower.includes('folk') || lower.includes('lokgeet')) return 'Folk';
    return 'Pop';
  }

  private extractMoodTags(title: string): string[] {
    const lower = title.toLowerCase();
    const moods: string[] = [];
    
    if (lower.includes('love') || lower.includes('romantic') || lower.includes('dil')) moods.push('romantic');
    if (lower.includes('happy') || lower.includes('joy') || lower.includes('fun')) moods.push('happy');
    if (lower.includes('sad') || lower.includes('cry') || lower.includes('tears')) moods.push('sad');
    if (lower.includes('party') || lower.includes('dance') || lower.includes('club')) moods.push('energetic');
    if (lower.includes('peace') || lower.includes('calm') || lower.includes('relax')) moods.push('peaceful');
    if (lower.includes('energy') || lower.includes('power')) moods.push('energetic');
    
    return moods.length > 0 ? moods : ['neutral'];
  }

  private detectEnergyLevel(title: string): number {
    const lower = title.toLowerCase();
    if (lower.includes('party') || lower.includes('dance') || lower.includes('dj')) return 9;
    if (lower.includes('energy') || lower.includes('power') || lower.includes('rock')) return 8;
    if (lower.includes('romantic') || lower.includes('love') || lower.includes('melody')) return 5;
    if (lower.includes('sad') || lower.includes('emotional') || lower.includes('slow')) return 3;
    return 6;
  }
}

// Last.fm API - Best for recommendations
class LastFMAPI {
  private apiKey: string;
  private readonly BASE_URL = 'http://ws.audioscrobbler.com/2.0/';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_LASTFM_API_KEY || '';
  }

  async getSimilarArtists(artist: string, limit: number = 10): Promise<Song[]> {
    if (!this.apiKey) return [];

    try {
      const url = `${this.BASE_URL}?method=artist.getsimilar&artist=${encodeURIComponent(artist)}&api_key=${this.apiKey}&format=json&limit=${limit}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.similarartists?.artist) return [];

      return data.similarartists.artist.map((a: any) => ({
        id: `lfm_artist_${a.name}`,
        title: `${a.name} - Popular Tracks`,
        artist: a.name,
        album: 'Similar Artist',
        language: 'Unknown',
        genre: a.genre || 'Pop',
        mood_tags: [],
        scene_tags: [],
        personality_tags: [],
        color_tone_tags: [],
        energy_level: 5,
        is_trending: false,
        trend_region: 'Global',
        play_count: parseInt(a.playcount) || 0,
        youtube_query: `${a.name} popular song`,
        source: 'lastfm'
      }));
    } catch (error) {
      console.error('❌ Last.fm API error:', error);
      return [];
    }
  }

  async searchTracks(query: string, limit: number = 10): Promise<Song[]> {
    if (!this.apiKey) return [];

    try {
      const url = `${this.BASE_URL}?method=track.search&track=${encodeURIComponent(query)}&api_key=${this.apiKey}&format=json&limit=${limit}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.results?.trackmatches?.track) return [];

      const tracks = Array.isArray(data.results.trackmatches.track) 
        ? data.results.trackmatches.track 
        : [data.results.trackmatches.track];

      return tracks.map((t: any) => ({
        id: `lfm_${t.mbid || t.name}`,
        title: t.name,
        artist: t.artist,
        album: t.name,
        language: 'Unknown',
        genre: 'Unknown',
        mood_tags: [],
        scene_tags: [],
        personality_tags: [],
        color_tone_tags: [],
        energy_level: 5,
        is_trending: false,
        trend_region: 'Global',
        play_count: parseInt(t.playcount) || 0,
        youtube_query: `${t.name} ${t.artist}`,
        source: 'lastfm'
      }));
    } catch (error) {
      console.error('❌ Last.fm search error:', error);
      return [];
    }
  }

  async getTopTracks(tag: string, limit: number = 10): Promise<Song[]> {
    if (!this.apiKey) return [];

    try {
      const url = `${this.BASE_URL}?method=tag.gettoptracks&tag=${encodeURIComponent(tag)}&api_key=${this.apiKey}&format=json&limit=${limit}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.tracks?.track) return [];

      const tracks = Array.isArray(data.tracks.track) ? data.tracks.track : [data.tracks.track];

      return tracks.map((t: any) => ({
        id: `lfm_top_${t.name}`,
        title: t.name,
        artist: t.artist.name,
        album: t.name,
        language: 'Unknown',
        genre: tag,
        mood_tags: [tag.toLowerCase()],
        scene_tags: [],
        personality_tags: [],
        color_tone_tags: [],
        energy_level: 6,
        is_trending: true,
        trend_region: 'Global',
        play_count: parseInt(t.playcount) || 0,
        youtube_query: `${t.name} ${t.artist.name}`,
        source: 'lastfm'
      }));
    } catch (error) {
      console.error('❌ Last.fm top tracks error:', error);
      return [];
    }
  }
}

// Main Music API Service
export class MusicAPIService {
  private cache: SongCache;
  private youtube: YouTubeMusicAPI;
  private lastfm: LastFMAPI;

  constructor() {
    this.cache = new SongCache();
    this.youtube = new YouTubeMusicAPI();
    this.lastfm = new LastFMAPI();
  }

  async searchSongs(
    query: string, 
    options: {
      limit?: number;
      language?: string;
      mood?: string;
      genre?: string;
      useCache?: boolean;
    } = {}
  ): Promise<Song[]> {
    const { limit = 10, language, mood, genre, useCache = true } = options;
    
    // Create cache key
    const cacheKey = `search_${query}_${language}_${mood}_${genre}`;
    
    // Check cache
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log(`✅ Cache hit for "${query}"`);
        return cached;
      }
    }

    console.log(`🔍 Searching for "${query}" across multiple APIs...`);

    // Parallel API calls for speed
    const [youtubeResults, lastfmResults] = await Promise.all([
      this.youtube.searchSongs(query, limit, language).catch(() => []),
      this.lastfm.searchTracks(query, limit).catch(() => [])
    ]);

    // Combine and deduplicate
    const allSongs = [...youtubeResults, ...lastfmResults];
    const uniqueSongs = this.deduplicateSongs(allSongs);

    // Filter by mood/genre if specified
    let filteredSongs = uniqueSongs;
    if (mood) {
      filteredSongs = filteredSongs.filter(s => 
        s.mood_tags.some(m => m.toLowerCase().includes(mood.toLowerCase()))
      );
    }
    if (genre) {
      filteredSongs = filteredSongs.filter(s => 
        s.genre.toLowerCase().includes(genre.toLowerCase())
      );
    }

    // Limit results
    const results = filteredSongs.slice(0, limit);

    // Cache results
    if (useCache && results.length > 0) {
      this.cache.set(cacheKey, results);
    }

    console.log(`✅ Found ${results.length} songs for "${query}"`);
    return results;
  }

  async getRecommendations(
    artist: string,
    mood: string,
    language?: string,
    limit: number = 10
  ): Promise<Song[]> {
    const cacheKey = `rec_${artist}_${mood}_${language}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    console.log(`🎯 Getting recommendations for ${artist} (${mood})...`);

    // Get similar artists from Last.fm
    const similarArtists = await this.lastfm.getSimilarArtists(artist, 5);
    
    // Get top tracks for the mood
    const moodTracks = await this.lastfm.getTopTracks(mood, limit);

    // Search YouTube for more variety
    const youtubeResults = await this.youtube.searchSongs(
      `${artist} ${mood}`, 
      limit / 2,
      language
    );

    // Combine all sources
    const allSongs = [...similarArtists, ...moodTracks, ...youtubeResults];
    const uniqueSongs = this.deduplicateSongs(allSongs);

    // Prioritize songs matching mood
    const prioritized = uniqueSongs.sort((a, b) => {
      const aMatch = a.mood_tags.some(m => m.toLowerCase() === mood.toLowerCase()) ? 1 : 0;
      const bMatch = b.mood_tags.some(m => m.toLowerCase() === mood.toLowerCase()) ? 1 : 0;
      return bMatch - aMatch;
    });

    const results = prioritized.slice(0, limit);
    
    if (results.length > 0) {
      this.cache.set(cacheKey, results);
    }

    return results;
  }

  async getTrendingSongs(language?: string, limit: number = 20): Promise<Song[]> {
    const cacheKey = `trending_${language}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const queries = language 
      ? [`${language} trending songs 2025`, `${language} new songs`, `${language} hits`]
      : ['trending songs 2025', 'viral music 2025', 'top hits'];

    const allSongs: Song[] = [];
    
    for (const query of queries) {
      const results = await this.youtube.searchSongs(query, 10, language);
      allSongs.push(...results);
    }

    const unique = this.deduplicateSongs(allSongs).slice(0, limit);
    unique.forEach(s => s.is_trending = true);
    
    this.cache.set(cacheKey, unique);
    return unique;
  }

  private deduplicateSongs(songs: Song[]): Song[] {
    const seen = new Set<string>();
    return songs.filter(song => {
      const key = `${song.title.toLowerCase()}_${song.artist.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    const keys = Object.keys(localStorage)
      .filter(k => k.startsWith('instam_songs_'))
      .map(k => k.replace('instam_songs_', ''));
    
    return {
      size: keys.length,
      keys
    };
  }
}

// Export singleton instance
export const musicAPI = new MusicAPIService();

// Helper function for quick searches
export async function searchMusic(
  query: string, 
  options?: {
    limit?: number;
    language?: string;
    mood?: string;
  }
): Promise<Song[]> {
  return musicAPI.searchSongs(query, options);
}

// Helper for recommendations
export async function getMusicRecommendations(
  artist: string,
  mood: string,
  language?: string
): Promise<Song[]> {
  return musicAPI.getRecommendations(artist, mood, language);
}
