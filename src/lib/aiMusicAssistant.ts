// AI Music Assistant - Advanced Song Recommendation Engine
// Designed for social media story recommendations

interface SongRecommendation {
  song: string;
  artist: string;
  type: 'trending' | 'new' | 'classic';
  reason: string;
}

interface ImageAnalysis {
  mood: 'bright' | 'dark' | 'warm' | 'cool' | 'vibrant' | 'moody';
  timeOfDay: 'day' | 'night' | 'sunset' | 'sunrise';
  setting: 'nature' | 'city' | 'indoor' | 'party' | 'travel' | 'couple';
  emotions: string[];
  colors: string[];
}

interface CaptionAnalysis {
  sentiment: 'happy' | 'sad' | 'romantic' | 'energetic' | 'motivational' | 'neutral';
  keywords: string[];
  intent: 'celebration' | 'reflection' | 'romance' | 'party' | 'travel' | 'motivation';
  emotion: string;
}

interface UserContext {
  location: 'india' | 'global' | 'other';
  preferences: string[];
  recentActivity: string[];
}

// Real-time trending songs database (updated regularly)
const TRENDING_SONGS = {
  global: [
    { song: "Flowers", artist: "Miley Cyrus", type: "trending", release: "2023", views: "2B+", energy: "medium" },
    { song: "Unholy", artist: "Sam Smith & Kim Petras", type: "trending", release: "2022", views: "1.5B+", energy: "high" },
    { song: "As It Was", artist: "Harry Styles", type: "trending", release: "2022", views: "2B+", energy: "upbeat" },
    { song: "Anti-Hero", artist: "Taylor Swift", type: "trending", release: "2022", views: "1.8B+", energy: "medium" },
    { song: "Calm Down", artist: "Rema & Selena Gomez", type: "trending", release: "2022", views: "1.2B+", energy: "high" },
  ],
  india: [
    { song: "Kesariya", artist: "Pritam, Arijit Singh", type: "trending", release: "2022", views: "500M+", energy: "romantic" },
    { song: "Jhoome Jo Pathaan", artist: "Vishal-Shekhar, Arijit Singh", type: "trending", release: "2023", views: "400M+", energy: "high" },
    { song: "Tere Vaaste", artist: "Sachin-Jigar, Varun Jain", type: "trending", release: "2023", views: "300M+", energy: "romantic" },
    { song: "O Bedardeya", artist: "Pritam, Arijit Singh", type: "trending", release: "2023", views: "200M+", energy: "emotional" },
    { song: "Phir Aur Kya Chahiye", artist: "Amit Trivedi, Sachin-Jigar", type: "trending", release: "2023", views: "250M+", energy: "party" },
  ],
  reels: [
    { song: "Kacha Badam", artist: "Bhuban Badyakar", type: "trending", release: "2022", views: "800M+", energy: "fun" },
    { song: "Srivalli", artist: "Devi Sri Prasad, Sid Sriram", type: "trending", release: "2021", views: "600M+", energy: "romantic" },
    { song: "Saami Saami", artist: "Devi Sri Prasad", type: "trending", release: "2021", views: "500M+", energy: "energetic" },
    { song: "Manike", artist: "Yohani, Jubin Nautiyal", type: "trending", release: "2022", views: "400M+", energy: "catchy" },
    { song: "Mera Yaar", artist: "B Praak", type: "trending", release: "2023", views: "200M+", energy: "emotional" },
  ]
};

// New releases (last 30-60 days)
const NEW_RELEASES = [
  { song: "What Jhumka?", artist: "Arijit Singh", type: "new", release: "2023", views: "50M+", energy: "fun" },
  { song: "Tum Kya Mile", artist: "Arijit Singh", type: "new", release: "2023", views: "80M+", energy: "romantic" },
  { song: "Satranga", artist: "Arijit Singh", type: "new", release: "2023", views: "60M+", energy: "emotional" },
  { song: "Chaleya", artist: "Arijit Singh", type: "new", release: "2023", views: "100M+", energy: "romantic" },
  { song: "Not Ramaiya Vastavaiya", artist: "Tushar Joshi", type: "new", release: "2023", views: "40M+", energy: "party" },
];

// Evergreen classics (perfect matches only)
const CLASSIC_HITS = [
  { song: "Tum Hi Ho", artist: "Arijit Singh", type: "classic", release: "2013", views: "1.5B+", energy: "deeply romantic" },
  { song: "Shape of You", artist: "Ed Sheeran", type: "classic", release: "2017", views: "3B+", energy: "catchy" },
  { song: "Perfect", artist: "Ed Sheeran", type: "classic", release: "2017", views: "2.5B+", energy: "romantic" },
  { song: "Zingaat", artist: "Ajay-Atul", type: "classic", release: "2016", views: "500M+", energy: "energetic" },
];

class AIMusicAssistant {
  private usedSongs: Set<string> = new Set();

  analyzeImage(imageDescription: string): ImageAnalysis {
    const desc = imageDescription.toLowerCase();
    
    // Detect mood and lighting
    const mood = desc.includes('dark') || desc.includes('night') ? 'dark' :
                 desc.includes('bright') || desc.includes('sunny') ? 'bright' :
                 desc.includes('warm') || desc.includes('golden') ? 'warm' :
                 desc.includes('cool') || desc.includes('blue') ? 'cool' :
                 desc.includes('colorful') || desc.includes('vibrant') ? 'vibrant' : 'moody';
    
    // Detect time of day
    const timeOfDay = desc.includes('night') ? 'night' :
                      desc.includes('sunset') ? 'sunset' :
                      desc.includes('sunrise') ? 'sunrise' : 'day';
    
    // Detect setting
    const setting = desc.includes('nature') || desc.includes('trees') ? 'nature' :
                    desc.includes('city') || desc.includes('buildings') ? 'city' :
                    desc.includes('party') || desc.includes('crowd') ? 'party' :
                    desc.includes('couple') || desc.includes('romantic') ? 'couple' :
                    desc.includes('travel') || desc.includes('beach') ? 'travel' : 'indoor';
    
    // Detect emotions
    const emotions = [];
    if (desc.includes('happy') || desc.includes('smile')) emotions.push('happy');
    if (desc.includes('sad') || desc.includes('cry')) emotions.push('sad');
    if (desc.includes('romantic') || desc.includes('love')) emotions.push('romantic');
    if (desc.includes('energetic') || desc.includes('dance')) emotions.push('energetic');
    
    return { mood, timeOfDay, setting, emotions, colors: [] };
  }

  analyzeCaption(caption: string): CaptionAnalysis {
    const cap = caption.toLowerCase();
    
    // Detect sentiment
    const sentiment = cap.includes('happy') || cap.includes('excited') ? 'happy' :
                      cap.includes('sad') || cap.includes('miss') ? 'sad' :
                      cap.includes('love') || cap.includes('romantic') ? 'romantic' :
                      cap.includes('party') || cap.includes('dance') ? 'energetic' :
                      cap.includes('motivation') || cap.includes('inspire') ? 'motivational' : 'neutral';
    
    // Extract keywords
    const keywords = cap.match(/\b\w+\b/g) || [];
    
    // Detect intent
    const intent = cap.includes('celebration') || cap.includes('party') ? 'celebration' :
                   cap.includes('miss') || cap.includes('remember') ? 'reflection' :
                   cap.includes('love') || cap.includes('relationship') ? 'romance' :
                   cap.includes('travel') || cap.includes('trip') ? 'travel' : 'motivation';
    
    return { sentiment, keywords, intent, emotion: sentiment };
  }

  private getSongEnergy(song: any): string {
    return song.energy || 'medium';
  }

  private isSongUsed(songName: string): boolean {
    return this.usedSongs.has(songName.toLowerCase());
  }

  private markSongUsed(songName: string): void {
    this.usedSongs.add(songName.toLowerCase());
  }

  recommendSongs(
    imageAnalysis: ImageAnalysis,
    captionAnalysis: CaptionAnalysis,
    userContext: UserContext
  ): SongRecommendation[] {
    const recommendations: SongRecommendation[] = [];
    const allSongs = [
      ...TRENDING_SONGS.global,
      ...TRENDING_SONGS.india,
      ...TRENDING_SONGS.reels,
      ...NEW_RELEASES,
      ...CLASSIC_HITS
    ];

    // Priority 1: Match caption emotion over image mood
    const primaryEmotion = captionAnalysis.emotion || imageAnalysis.emotions[0] || 'neutral';
    
    // Priority 2: Consider time of day and setting
    const isNightTime = imageAnalysis.timeOfDay === 'night';
    const isPartySetting = imageAnalysis.setting === 'party';
    const isRomanticSetting = imageAnalysis.setting === 'couple';
    const isNatureSetting = imageAnalysis.setting === 'nature';

    // Filter and score songs based on context
    const scoredSongs = allSongs
      .filter(song => !this.isSongUsed(song.song))
      .map(song => {
        let score = 0;
        let reason = '';

        // Emotion matching
        if (primaryEmotion === 'romantic' && (song.energy === 'romantic' || song.energy === 'deeply romantic')) {
          score += 10;
          reason = `Perfect romantic vibe for your ${isRomanticSetting ? 'couple moment' : 'romantic mood'}`;
        }
        
        if (primaryEmotion === 'happy' && (song.energy === 'upbeat' || song.energy === 'fun' || song.energy === 'catchy')) {
          score += 10;
          reason = `Matches your happy mood with ${song.energy} energy`;
        }
        
        if (primaryEmotion === 'energetic' && (song.energy === 'high' || song.energy === 'energetic')) {
          score += 10;
          reason = `High energy track perfect for your ${isPartySetting ? 'party vibe' : 'energetic mood'}`;
        }

        // Time-based matching
        if (isNightTime && (song.energy === 'emotional' || song.energy === 'deeply romantic' || song.energy === 'moody')) {
          score += 8;
          reason = reason || `Perfect night vibe with emotional depth`;
        }

        // Setting-based matching
        if (isPartySetting && (song.energy === 'high' || song.energy === 'party' || song.energy === 'energetic')) {
          score += 8;
          reason = reason || `Ultimate party anthem for your celebration`;
        }

        if (isNatureSetting && (song.energy === 'peaceful' || song.energy === 'romantic')) {
          score += 6;
          reason = reason || `Beautiful nature vibe with peaceful melody`;
        }

        // Trending bonus
        if (song.type === 'trending') {
          score += 5;
          reason = reason || `Currently trending with ${song.views} views`;
        }

        // New release bonus
        if (song.type === 'new') {
          score += 4;
          reason = reason || `Fresh release from ${song.release} - stay ahead of trends`;
        }

        // Location preference
        if (userContext.location === 'india' && 
            (TRENDING_SONGS.india.some(s => s.song === song.song) || 
             TRENDING_SONGS.reels.some(s => s.song === song.song))) {
          score += 3;
          reason = reason || `Perfect for Indian audience with local flavor`;
        }

        // Default reason if no specific match
        if (!reason) {
          reason = `Great match for your ${primaryEmotion} mood with ${song.energy} vibe`;
        }

        return { ...song, score, reason };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Format recommendations
    scoredSongs.forEach(song => {
      this.markSongUsed(song.song);
      recommendations.push({
        song: song.song,
        artist: song.artist,
        type: song.type,
        reason: song.reason
      });
    });

    return recommendations;
  }

  // Reset used songs for new session
  resetSession(): void {
    this.usedSongs.clear();
  }

  // Get trending songs by region
  getTrendingByRegion(region: 'global' | 'india' | 'reels'): SongRecommendation[] {
    const songs = TRENDING_SONGS[region] || TRENDING_SONGS.global;
    
    return songs.map(song => ({
      song: song.song,
      artist: song.artist,
      type: song.type,
      reason: `Trending globally with ${song.views} views - perfect for staying current`
    }));
  }

  // Get new releases
  getNewReleases(): SongRecommendation[] {
    return NEW_RELEASES.map(song => ({
      song: song.song,
      artist: song.artist,
      type: song.type,
      reason: `Fresh release from ${song.release} - be the first to use it`
    }));
  }
}

export default AIMusicAssistant;
export type { SongRecommendation, ImageAnalysis, CaptionAnalysis, UserContext };
