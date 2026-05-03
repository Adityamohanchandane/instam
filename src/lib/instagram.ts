export interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  caption?: string;
  timestamp: string;
}

export interface InstagramMusicTrack {
  id: string;
  title: string;
  artist: string;
  cover_art_url: string;
  duration: number;
  preview_url?: string;
  is_explicit: boolean;
}

export class InstagramAPI {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getUserMedia(): Promise<InstagramMedia[]> {
    // Mock implementation for demo
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [];
  }

  async searchMusic(query: string): Promise<InstagramMusicTrack[]> {
    // Simulate API call with real working demo data
    await new Promise(resolve => setTimeout(resolve, 800));
    return this.getMockMusicTracks(query);
  }

  async getMusicTrack(trackId: string): Promise<InstagramMusicTrack | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.getMockMusicTracks('').find(t => t.id === trackId) || null;
  }

  private getMockMusicTracks(query: string): InstagramMusicTrack[] {
    // Real working demo tracks with actual audio URLs
    return [
      {
        id: 'inst_1',
        title: 'Summer Vibes',
        artist: 'The Weekend',
        cover_art_url: 'https://picsum.photos/300/300?random=1',
        duration: 180,
        preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3#t=0,30',
        is_explicit: false,
      },
      {
        id: 'inst_2',
        title: 'Dance Floor',
        artist: 'DJ Shadow',
        cover_art_url: 'https://picsum.photos/300/300?random=2',
        duration: 210,
        preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3#t=0,30',
        is_explicit: false,
      },
      {
        id: 'inst_3',
        title: 'Romantic Evening',
        artist: 'Love Songs',
        cover_art_url: 'https://picsum.photos/300/300?random=3',
        duration: 195,
        preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3#t=0,30',
        is_explicit: false,
      },
      {
        id: 'inst_4',
        title: 'Party Anthem',
        artist: 'Club Mix',
        cover_art_url: 'https://picsum.photos/300/300?random=4',
        duration: 240,
        preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3#t=0,30',
        is_explicit: false,
      },
      {
        id: 'inst_5',
        title: 'Chill Mode',
        artist: 'Relax Beats',
        cover_art_url: 'https://picsum.photos/300/300?random=5',
        duration: 165,
        preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3#t=0,30',
        is_explicit: false,
      },
    ];
  }
}

// Instagram App Configuration
export const INSTAGRAM_CONFIG = {
  APP_ID: 'YOUR_INSTAGRAM_APP_ID',
  APP_SECRET: 'YOUR_INSTAGRAM_APP_SECRET',
  REDIRECT_URI: `${window.location.origin}/instagram-callback`,
  SCOPES: ['user_profile', 'user_media'],
};
