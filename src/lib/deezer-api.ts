// Deezer API Integration for Instam
// Free music search with no authentication required

export interface DeezerTrack {
  id: number;
  title: string;
  artist: {
    id: number;
    name: string;
  };
  album: {
    id: number;
    title: string;
    cover_medium: string;
  };
  duration: number;
  preview: string;
  link: string;
  rank: number;
  explicit_lyrics: boolean;
}

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
  source: 'deezer' | 'local';
}

export class DeezerAPI {
  private readonly BASE_URL = 'https://api.deezer.com';
  private static isAvailable: boolean | null = null;

  // Check if Deezer API is available
  static async checkAvailability(): Promise<boolean> {
    if (this.isAvailable !== null) {
      return this.isAvailable;
    }

    try {
      console.log('🔍 Checking Deezer API availability...');
      const response = await fetch('https://api.deezer.com/search/track?q=test&limit=1');
      this.isAvailable = response.ok;
      console.log(`✅ Deezer API availability: ${this.isAvailable ? 'Available' : 'Not Available'}`);
      return this.isAvailable;
    } catch (error) {
      console.error('❌ Deezer API not available:', error);
      this.isAvailable = false;
      return false;
    }
  }

  async searchTracks(query: string, limit: number = 20): Promise<DeezerTrack[]> {
    try {
      console.log(`🔍 Searching Deezer for: "${query}"`);
      
      const response = await fetch(
        `${this.BASE_URL}/search/track?q=${encodeURIComponent(query)}&limit=${limit}`
      );

      if (!response.ok) {
        console.error(`❌ Deezer API HTTP error: ${response.status} ${response.statusText}`);
        throw new Error(`Deezer API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || !data.data) {
        console.error('❌ Invalid Deezer API response structure');
        return [];
      }
      
      console.log(`✅ Deezer search successful: ${data.data.length} tracks found`);
      return data.data || [];
    } catch (error) {
      console.error('❌ Deezer search failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        query: query,
        limit: limit,
        url: `${this.BASE_URL}/search/track?q=${encodeURIComponent(query)}&limit=${limit}`
      });
      return [];
    }
  }

  async getTrack(trackId: number): Promise<DeezerTrack | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/track/${trackId}`);
      
      if (!response.ok) {
        throw new Error(`Deezer API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get track:', error);
      return null;
    }
  }

  convertToSong(deezerTrack: DeezerTrack, language: string = 'en'): Song {
    return {
      id: `deezer_${deezerTrack.id}`,
      title: deezerTrack.title,
      artist: deezerTrack.artist.name,
      album: deezerTrack.album.title,
      language: language,
      genre: this.detectGenre(deezerTrack),
      mood_tags: this.detectMoodTags(deezerTrack),
      scene_tags: this.detectSceneTags(deezerTrack),
      personality_tags: this.detectPersonalityTags(deezerTrack),
      color_tone_tags: this.detectColorToneTags(deezerTrack),
      energy_level: this.detectEnergyLevel(deezerTrack),
      is_trending: deezerTrack.rank > 500000,
      trend_region: 'Global',
      play_count: deezerTrack.rank,
      youtube_query: `${deezerTrack.title} ${deezerTrack.artist.name}`,
      preview_url: deezerTrack.preview,
      album_art: deezerTrack.album.cover_medium,
      duration: deezerTrack.duration,
      source: 'deezer'
    };
  }

  private detectGenre(track: DeezerTrack): string {
    const title = track.title.toLowerCase();
    const artist = track.artist.name.toLowerCase();
    
    // Simple genre detection based on keywords
    if (title.includes('romantic') || title.includes('love')) return 'Romantic';
    if (title.includes('party') || title.includes('dance')) return 'Pop';
    if (title.includes('sad') || title.includes('cry')) return 'Sad';
    if (title.includes('rock') || artist.includes('rock')) return 'Rock';
    if (title.includes('hip hop') || title.includes('rap')) return 'Hip Hop';
    
    return 'Pop'; // Default
  }

  private detectMoodTags(track: DeezerTrack): string[] {
    const title = track.title.toLowerCase();
    const moods: string[] = [];
    
    if (title.includes('happy') || title.includes('joy')) moods.push('happy');
    if (title.includes('love') || title.includes('romantic')) moods.push('romantic');
    if (title.includes('sad') || title.includes('cry')) moods.push('sad');
    if (title.includes('party') || title.includes('dance')) moods.push('energetic');
    if (title.includes('peace') || title.includes('calm')) moods.push('peaceful');
    
    return moods.length > 0 ? moods : ['neutral'];
  }

  private detectSceneTags(track: DeezerTrack): string[] {
    const title = track.title.toLowerCase();
    const scenes: string[] = [];
    
    if (title.includes('night') || title.includes('moon')) scenes.push('night');
    if (title.includes('rain') || title.includes('storm')) scenes.push('rain');
    if (title.includes('beach') || title.includes('ocean')) scenes.push('beach');
    if (title.includes('party') || title.includes('club')) scenes.push('party');
    if (title.includes('road') || title.includes('drive')) scenes.push('road');
    
    return scenes.length > 0 ? scenes : ['general'];
  }

  private detectPersonalityTags(track: DeezerTrack): string[] {
    const title = track.title.toLowerCase();
    const personalities: string[] = [];
    
    if (title.includes('confident') || title.includes('strong')) personalities.push('confident');
    if (title.includes('romantic') || title.includes('love')) personalities.push('romantic');
    if (title.includes('chill') || title.includes('relax')) personalities.push('chill');
    if (title.includes('party') || title.includes('social')) personalities.push('social');
    
    return personalities.length > 0 ? personalities : ['general'];
  }

  private detectColorToneTags(track: DeezerTrack): string[] {
    const title = track.title.toLowerCase();
    const colors: string[] = [];
    
    if (title.includes('golden') || title.includes('yellow')) colors.push('golden');
    if (title.includes('blue') || title.includes('ocean')) colors.push('blue');
    if (title.includes('red') || title.includes('love')) colors.push('red');
    if (title.includes('dark') || title.includes('black')) colors.push('dark');
    
    return colors.length > 0 ? colors : ['neutral'];
  }

  private detectEnergyLevel(track: DeezerTrack): number {
    const title = track.title.toLowerCase();
    
    if (title.includes('party') || title.includes('dance') || title.includes('energy')) return 9;
    if (title.includes('chill') || title.includes('relax') || title.includes('calm')) return 3;
    if (title.includes('romantic') || title.includes('love')) return 4;
    if (title.includes('rock') || title.includes('power')) return 8;
    
    return 5; // Default medium energy
  }
}

// Export singleton instance
export const deezerAPI = new DeezerAPI();
