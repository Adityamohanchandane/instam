// AI-Powered Recommendation Engine
// Advanced music recommendation using machine learning

import type { MoodType, SceneType, ColorTone, Song, UserProfile, SongWithReason, Genre } from './types';
import type { RealImageAnalysis } from './real-image-analyzer';

export interface AdvancedMoodAnalysis {
  primaryMood: string;
  confidence: number;
  emotions: {
    happy: number;
    sad: number;
    energetic: number;
    peaceful: number;
    romantic: number;
    aggressive: number;
    confident: number;
    nostalgic: number;
    lonely: number;
    party: number;
    attitude: number;
  };
  contextFactors: {
    timeOfDay: number;
    socialContext: number;
  };
  aiInsights: string[];
  recommendations: string[];
}

export interface AIRecommendation {
  song: Song;
  score: number;
  reasons: string[];
  aiInsights: string[];
  personalizedFactors: {
    moodMatch: number;
    genrePreference: number;
    languageMatch: number;
    energyAlignment: number;
    personalityFit: number;
    contextRelevance: number;
    artistSimilarity: number;
    trendingBoost: number;
  };
  confidence: number;
}

export interface UserBehaviorData {
  songId: string;
  action: 'play' | 'like' | 'skip' | 'share' | 'download';
  timestamp: number;
  sessionContext: {
    mood: string;
    timeOfDay: string;
    location?: string;
    socialContext?: string;
  };
}

export interface RecommendationInput {
  mood: MoodType;
  scene: SceneType;
  colorTone: ColorTone;
  userProfile: UserProfile;
  songs: Song[];
  skippedIds: Set<string>;
  imageAnalysis?: RealImageAnalysis;
}

export interface RecommendationOutput {
  songs: SongWithReason[];
  safeChoice: SongWithReason;
  uniquePick: SongWithReason;
}

export class AIRecommendationEngine {
  private userBehaviorHistory: UserBehaviorData[] = [];
  private learningModel: any = null;
  private isInitialized = false;

  // Artist similarity database (simplified - in production, use embeddings)
  private artistSimilarityMap: Map<string, string[]> = new Map([
    ['Ed Sheeran', ['Justin Bieber', 'Shawn Mendes', 'Charlie Puth', 'Lewis Capaldi']],
    ['Arijit Singh', ['Atif Aslam', 'Sonu Nigam', 'Pritam', 'Jubin Nautiyal']],
    ['Badshah', ['Diljit Dosanjh', 'Guru Randhawa', 'Raftaar', 'Honey Singh']],
    ['Taylor Swift', ['Ariana Grande', 'Selena Gomez', 'Katy Perry', 'Dua Lipa']],
    ['Drake', ['Travis Scott', 'Post Malone', 'The Weeknd', 'Kendrick Lamar']],
  ]);

  constructor() {
    this.initialize();
  }

  // Initialize the AI recommendation engine
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🧠 Initializing AI Recommendation Engine...');
      
      // Load user behavior history from localStorage
      const savedHistory = localStorage.getItem('instam_user_behavior');
      if (savedHistory) {
        this.userBehaviorHistory = JSON.parse(savedHistory);
      }

      // Initialize simple learning model
      this.learningModel = {
        weights: {
          moodMatch: 0.25,
          genrePreference: 0.2,
          languageMatch: 0.15,
          energyAlignment: 0.1,
          personalityFit: 0.1,
          artistSimilarity: 0.1,
          trendingBoost: 0.1
        },
        learningRate: 0.01,
        adaptationThreshold: 10 // Minimum interactions before adaptation
      };

      this.isInitialized = true;
      console.log('✅ AI Recommendation Engine initialized');
    } catch (error) {
      console.error('❌ Failed to initialize AI Recommendation Engine:', error);
    }
  }

  // Main recommendation method (instance method for easier integration)
  async getRecommendations(input: RecommendationInput): Promise<RecommendationOutput> {
    await this.initialize();

    const { mood, scene, colorTone, userProfile, songs, skippedIds, imageAnalysis } = input;

    try {
      console.log('🎯 Generating AI-powered recommendations...');

      // Analyze user behavior patterns
      const behaviorPatterns = this.analyzeUserBehavior();
      
      // Get contextual factors
      const contextFactors = this.getContextFactors();

      // Filter out skipped songs
      const availableSongs = songs.filter(s => !skippedIds.has(s.id));
      const songsToScore = availableSongs.length > 0 ? availableSongs : songs;

      // Score each song
      const scoredSongs = songsToScore.map(song => {
        const recommendation = this.scoreSong(
          song,
          userProfile,
          mood,
          scene,
          colorTone,
          behaviorPatterns,
          contextFactors,
          imageAnalysis
        );
        
        return recommendation;
      });

      // Sort by score
      scoredSongs.sort((a, b) => b.score - a.score);

      // Apply diversity filter
      const diverseRecommendations = this.applyDiversityFilter(scoredSongs);

      // Convert to SongWithReason format
      const songsWithReason: SongWithReason[] = diverseRecommendations.slice(0, 8).map(rec => ({
        ...rec.song,
        reason: rec.reasons.slice(0, 2).join(' · '),
        matchScore: rec.score,
        label: this.calculateLabel(rec, diverseRecommendations)
      }));

      // Find safe choice (highest score in preferred language)
      const safeOptions = songsWithReason.filter(s => 
        userProfile.preferred_languages?.some(l => 
          s.language.toLowerCase().includes(l.toLowerCase())
        )
      );
      const safeChoice = safeOptions[0] || songsWithReason[0];

      // Find unique pick (good score, different genre from safe choice)
      const uniqueOptions = songsWithReason.filter(s => 
        s.id !== safeChoice.id && s.genre !== safeChoice.genre
      );
      const uniquePick = uniqueOptions[0] || songsWithReason[1] || songsWithReason[0];

      // Update learning model
      this.updateLearningModel(diverseRecommendations);

      return {
        songs: songsWithReason,
        safeChoice: { ...safeChoice, label: 'safe' },
        uniquePick: { ...uniquePick, label: 'unique' }
      };
    } catch (error) {
      console.error('❌ AI recommendation generation failed:', error);
      return this.getFallbackRecommendations(songs, mood);
    }
  }

  // Calculate label for song
  private calculateLabel(rec: AIRecommendation, allRecs: AIRecommendation[]): 'safe' | 'unique' | 'trending' | undefined {
    const song = rec.song;
    
    // Trending
    if (song.is_trending && song.play_count > 1000000000) {
      return 'trending';
    }
    
    // Safe choice (high confidence, language match)
    if (rec.personalizedFactors.languageMatch > 0.8 && rec.confidence > 0.7) {
      return 'safe';
    }
    
    // Unique (different from top picks)
    const topGenres = allRecs.slice(0, 3).map(r => r.song.genre);
    if (!topGenres.includes(song.genre)) {
      return 'unique';
    }
    
    return undefined;
  }

  // Score individual song for recommendation (instance method)
  private scoreSong(
    song: Song,
    userProfile: UserProfile,
    mood: MoodType,
    scene: SceneType,
    colorTone: ColorTone,
    behaviorPatterns?: any,
    contextFactors?: any,
    imageAnalysis?: RealImageAnalysis
  ): AIRecommendation {
    // Calculate individual factors
    const moodMatch = this.calculateMoodMatch(song, mood, imageAnalysis);
    const genrePreference = this.calculateGenrePreference(song, userProfile, behaviorPatterns);
    const languageMatch = this.calculateLanguageMatch(song, userProfile, behaviorPatterns);
    const energyAlignment = this.calculateEnergyAlignment(song, mood, imageAnalysis);
    const personalityFit = this.calculatePersonalityFit(song, userProfile, behaviorPatterns);
    const contextRelevance = this.calculateContextRelevance(song, scene, colorTone, contextFactors);
    const artistSimilarity = this.calculateArtistSimilarity(song, userProfile);
    const trendingBoost = this.calculateTrendingBoost(song);

    // Apply learned weights
    const weights = this.learningModel?.weights || {
      moodMatch: 0.25,
      genrePreference: 0.2,
      languageMatch: 0.15,
      energyAlignment: 0.1,
      personalityFit: 0.1,
      artistSimilarity: 0.1,
      trendingBoost: 0.1
    };

    const personalizedFactors = {
      moodMatch,
      genrePreference,
      languageMatch,
      energyAlignment,
      personalityFit,
      contextRelevance,
      artistSimilarity,
      trendingBoost
    };

    // Calculate weighted score
    const score = Object.entries(personalizedFactors).reduce((total, [factor, value]) => {
      return total + (value * (weights[factor as keyof typeof weights] || 0));
    }, 0);

    // Generate reasons and insights
    const reasons = this.generateRecommendationReasons(
      song,
      personalizedFactors,
      mood,
      userProfile,
      scene,
      colorTone
    );

    const aiInsights = this.generateAIInsights(
      song,
      personalizedFactors,
      imageAnalysis,
      behaviorPatterns
    );

    // Calculate confidence
    const confidence = this.calculateConfidence(personalizedFactors, behaviorPatterns);

    return {
      song,
      score,
      reasons,
      aiInsights,
      personalizedFactors,
      confidence
    };
  }

  // Calculate mood match score (instance method)
  private calculateMoodMatch(
    song: Song,
    currentMood: MoodType,
    imageAnalysis?: RealImageAnalysis
  ): number {
    let score = 0;

    // Direct mood tag match
    if (song.mood_tags?.includes(currentMood)) {
      score += 0.8;
    }

    // Advanced mood analysis if available
    if (imageAnalysis) {
      const moodConfidence = imageAnalysis.mood.confidence;
      const energyMatch = Math.abs(imageAnalysis.mood.energy - song.energy_level) < 2 ? 0.2 : 0;
      score += moodConfidence * 0.2 + energyMatch;
    }

    // Energy level alignment
    const moodEnergyMap: Record<MoodType, number> = {
      energetic: 8, party: 8, confident: 7, happy: 6,
      romantic: 5, peaceful: 3, nostalgic: 4, sad: 2,
      lonely: 1, aggressive: 8, attitude: 7
    };

    const targetEnergy = moodEnergyMap[currentMood] || 5;
    const songEnergy = song.energy_level || 5;
    const energyDiff = Math.abs(targetEnergy - songEnergy);
    score += Math.max(0, (10 - energyDiff) / 10) * 0.2;

    return Math.min(score, 1);
  }

  // Calculate genre preference score (instance method)
  private calculateGenrePreference(
    song: Song,
    userProfile: UserProfile,
    behaviorPatterns?: any
  ): number {
    let score = 0;

    // Direct genre preference
    if (userProfile.favorite_genres?.includes(song.genre as Genre)) {
      score += 0.8;
    }

    // Behavior-based genre preference
    if (behaviorPatterns?.preferredGenres) {
      const genreScore = behaviorPatterns.preferredGenres[song.genre] || 0;
      score += genreScore * 0.2;
    }

    return Math.min(score, 1);
  }

  // Calculate language match score (instance method)
  private calculateLanguageMatch(
    song: Song,
    userProfile: UserProfile,
    behaviorPatterns?: any
  ): number {
    let score = 0;

    const preferredLanguages = userProfile.preferred_languages || [];
    if (preferredLanguages.length === 0) return 0.5;

    const songLang = song.language?.toLowerCase() || '';
    for (let i = 0; i < preferredLanguages.length; i++) {
      if (songLang.includes(preferredLanguages[i].toLowerCase())) {
        score += (10 - i * 2) / 10; // First preference gets highest score
        break;
      }
    }

    return Math.min(score, 1);
  }

  // Calculate energy alignment score (instance method)
  private calculateEnergyAlignment(
    song: Song,
    currentMood: MoodType,
    imageAnalysis?: RealImageAnalysis
  ): number {
    const songEnergy = song.energy_level || 5;
    
    // Base energy alignment with mood
    const moodEnergyMap: Record<MoodType, number> = {
      energetic: 8, party: 8, confident: 7, happy: 6,
      romantic: 5, peaceful: 3, nostalgic: 4, sad: 2,
      lonely: 1, aggressive: 8, attitude: 7
    };

    const targetEnergy = moodEnergyMap[currentMood] || 5;
    const energyDiff = Math.abs(targetEnergy - songEnergy);
    let score = Math.max(0, (10 - energyDiff) / 10);

    // Adjust based on image analysis confidence
    if (imageAnalysis && imageAnalysis.mood.confidence > 0.7) {
      score *= 1.2; // Boost score if mood analysis is confident
    }

    return Math.min(score, 1);
  }

  // Calculate personality fit score (instance method)
  private calculatePersonalityFit(
    song: Song,
    userProfile: UserProfile,
    behaviorPatterns?: any
  ): number {
    let score = 0;

    // Direct personality trait match
    if (userProfile.personality_traits?.some((trait: string) => 
      song.personality_tags?.includes(trait))) {
      score += 0.8;
    }

    // Behavior-based personality patterns
    if (behaviorPatterns?.personalityPatterns) {
      const patternScore = behaviorPatterns.personalityPatterns[song.genre] || 0;
      score += patternScore * 0.2;
    }

    return Math.min(score, 1);
  }

  // Calculate context relevance score (instance method)
  private calculateContextRelevance(
    song: Song,
    scene: SceneType,
    colorTone: ColorTone,
    contextFactors?: any
  ): number {
    let score = 0.5; // Base score

    // Scene tag match
    if (song.scene_tags?.includes(scene)) {
      score += 0.3;
    }

    // Color tone match
    if (song.color_tone_tags?.includes(colorTone)) {
      score += 0.2;
    }

    // Time-based relevance
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12 && song.energy_level > 6) {
      score += 0.1; // Morning = energetic
    } else if (hour >= 22 || hour < 6 && song.energy_level < 4) {
      score += 0.1; // Night = calm
    }

    return Math.min(score, 1);
  }

  // Calculate artist similarity score (new feature)
  private calculateArtistSimilarity(song: Song, userProfile: UserProfile): number {
    const favoriteArtists = userProfile.favorite_artists || [];
    if (favoriteArtists.length === 0) return 0;

    // Direct artist match
    if (favoriteArtists.includes(song.artist)) {
      return 1;
    }

    // Similar artist match
    for (const favArtist of favoriteArtists) {
      const similarArtists = this.artistSimilarityMap.get(favArtist) || [];
      if (similarArtists.includes(song.artist)) {
        return 0.7;
      }
    }

    // Genre-based similarity
    if (userProfile.favorite_genres?.includes(song.genre as Genre)) {
      return 0.5;
    }

    return 0;
  }

  // Calculate song similarity based on audio features and tags
  private calculateSongSimilarity(song1: Song, song2: Song): number {
    let similarity = 0;

    // Genre match
    if (song1.genre === song2.genre) similarity += 0.3;

    // Mood overlap
    const moodOverlap = song1.mood_tags.filter(m => song2.mood_tags.includes(m)).length;
    similarity += (moodOverlap / Math.max(song1.mood_tags.length, song2.mood_tags.length)) * 0.3;

    // Energy similarity
    const energyDiff = Math.abs(song1.energy_level - song2.energy_level);
    similarity += Math.max(0, (10 - energyDiff) / 10) * 0.2;

    // Language match
    if (song1.language === song2.language) similarity += 0.2;

    return similarity;
  }

  // Find similar songs to a given song
  findSimilarSongs(targetSong: Song, allSongs: Song[], limit: number = 10): Song[] {
    const similarities = allSongs
      .filter(s => s.id !== targetSong.id)
      .map(song => ({
        song,
        similarity: this.calculateSongSimilarity(targetSong, song)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities.map(s => s.song);
  }

  // Calculate trending boost score (new feature)
  private calculateTrendingBoost(song: Song): number {
    if (!song.is_trending) return 0;

    // Boost based on play count
    if (song.play_count > 1000000000) return 0.8; // 1B+ plays
    if (song.play_count > 500000000) return 0.6; // 500M+ plays
    if (song.play_count > 100000000) return 0.4; // 100M+ plays
    return 0.2;
  }

  // Generate recommendation reasons (instance method)
  private generateRecommendationReasons(
    song: Song,
    factors: any,
    currentMood: MoodType,
    userProfile: UserProfile,
    scene: SceneType,
    colorTone: ColorTone
  ): string[] {
    const reasons: string[] = [];

    // Mood-based reasons
    if (factors.moodMatch > 0.7) {
      reasons.push(`Perfect ${currentMood} vibe`);
    } else if (factors.moodMatch > 0.5) {
      reasons.push(`Great for ${currentMood} mood`);
    }

    // Genre-based reasons
    if (factors.genrePreference > 0.7) {
      reasons.push(`Your favorite ${song.genre} genre`);
    } else if (factors.genrePreference > 0.5) {
      reasons.push(`Popular ${song.genre} track`);
    }

    // Language-based reasons
    if (factors.languageMatch > 0.7) {
      reasons.push(`In your preferred ${song.language}`);
    }

    // Energy-based reasons
    if (factors.energyAlignment > 0.8) {
      reasons.push(`Perfect energy level for now`);
    }

    // Personality-based reasons
    if (factors.personalityFit > 0.7) {
      reasons.push(`Matches your personality`);
    }

    // Context-based reasons
    if (factors.contextRelevance > 0.7) {
      reasons.push(`Perfect for ${scene} moments`);
    }

    // Artist similarity reasons
    if (factors.artistSimilarity > 0.7) {
      reasons.push(`Similar to your favorite artists`);
    }

    // Trending reasons
    if (factors.trendingBoost > 0.5) {
      reasons.push(`Currently trending`);
    }

    return reasons.slice(0, 3); // Return top 3 reasons
  }

  // Generate AI insights (instance method)
  private generateAIInsights(
    song: Song,
    factors: any,
    imageAnalysis?: RealImageAnalysis,
    behaviorPatterns?: any
  ): string[] {
    const insights: string[] = [];

    // High-score insights
    if (factors.moodMatch > 0.8) {
      insights.push(`This song has exceptional mood alignment`);
    }

    if (factors.genrePreference > 0.8) {
      insights.push(`Based on your love for ${song.genre}`);
    }

    // Pattern-based insights
    if (behaviorPatterns?.discoveryPotential && behaviorPatterns.discoveryPotential[song.id]) {
      insights.push(`You might discover something new here`);
    }

    // Image analysis insights
    if (imageAnalysis && imageAnalysis.mood.confidence > 0.8) {
      insights.push(`AI-detected mood confirms this choice`);
    }

    // Energy insights
    if (factors.energyAlignment > 0.9) {
      insights.push(`Energy level perfectly matches your current state`);
    }

    return insights.slice(0, 2); // Return top 2 insights
  }

  // Calculate recommendation confidence (instance method)
  private calculateConfidence(
    factors: any,
    behaviorPatterns?: any
  ): number {
    const factorScores = Object.values(factors).filter((score): score is number => typeof score === 'number');
    const averageScore = factorScores.reduce((sum: number, score: number) => sum + score, 0) / factorScores.length;

    // Boost confidence if we have behavior data
    const behaviorBoost = behaviorPatterns ? 0.1 : 0;

    return Math.min(averageScore + behaviorBoost, 1);
  }

  // Apply diversity filter to recommendations (instance method)
  private applyDiversityFilter(recommendations: AIRecommendation[]): AIRecommendation[] {
    const filtered: AIRecommendation[] = [];
    const usedGenres = new Set<string>();
    const usedArtists = new Set<string>();
    const maxSameGenre = 3;
    const maxSameArtist = 2;

    recommendations.forEach(rec => {
      const genre = rec.song.genre;
      const artist = rec.song.artist;

      // Check diversity constraints
      const genreCount = filtered.filter(r => r.song.genre === genre).length;
      const artistCount = filtered.filter(r => r.song.artist === artist).length;

      if (genreCount < maxSameGenre && artistCount < maxSameArtist) {
        filtered.push(rec);
        usedGenres.add(genre);
        usedArtists.add(artist);
      }
    });

    return filtered;
  }

  // Analyze user behavior patterns (instance method)
  private analyzeUserBehavior(): any {
    if (this.userBehaviorHistory.length === 0) {
      return null;
    }

    const patterns = {
      preferredGenres: {} as Record<string, number>,
      preferredLanguages: {} as Record<string, number>,
      personalityPatterns: {} as Record<string, number>,
      discoveryPotential: {} as Record<string, number>
    };

    // Analyze recent interactions (last 50)
    const recentInteractions = this.userBehaviorHistory.slice(-50);

    recentInteractions.forEach(interaction => {
      // This would need song data to analyze properly
      // For now, return null as placeholder
    });

    return patterns;
  }

  // Get contextual factors (instance method)
  private getContextFactors(): any {
    const hour = new Date().getHours();
    return {
      timeOfDay: hour,
      isMorning: hour >= 6 && hour < 12,
      isAfternoon: hour >= 12 && hour < 18,
      isEvening: hour >= 18 && hour < 22,
      isNight: hour >= 22 || hour < 6
    };
  }

  // Update learning model (instance method)
  private updateLearningModel(recommendations: AIRecommendation[]): void {
    // Placeholder for learning model updates
    // In production, this would adjust weights based on user feedback
  }

  // Get fallback recommendations (instance method)
  private getFallbackRecommendations(songs: Song[], mood: MoodType): RecommendationOutput {
    // Simple fallback based on mood tags
    const moodMatches = songs.filter(s => s.mood_tags?.includes(mood));
    const fallbackSongs = moodMatches.length > 0 ? moodMatches : songs.slice(0, 8);

    const songsWithReason: SongWithReason[] = fallbackSongs.slice(0, 8).map(song => ({
      ...song,
      reason: `Matches ${mood} mood`,
      matchScore: 0.5,
      label: undefined
    }));

    return {
      songs: songsWithReason,
      safeChoice: songsWithReason[0],
      uniquePick: songsWithReason[1] || songsWithReason[0]
    };
  }

  // Record user behavior (static method for convenience)
  recordBehavior(behavior: UserBehaviorData): void {
    this.userBehaviorHistory.push(behavior);
    
    // Keep only last 1000 interactions
    if (this.userBehaviorHistory.length > 1000) {
      this.userBehaviorHistory = this.userBehaviorHistory.slice(-1000);
    }

    // Save to localStorage
    localStorage.setItem('instam_user_behavior', JSON.stringify(this.userBehaviorHistory));
  }

  // Get user behavior insights
  getUserInsights(): {
    totalInteractions: number;
    favoriteGenres: string[];
    favoriteMoods: string[];
    listeningPatterns: string[];
    discoveryRate: number;
  } {
    const totalInteractions = this.userBehaviorHistory.length;
    
    // This would analyze the behavior history
    // For now, return placeholder data
    return {
      totalInteractions,
      favoriteGenres: ['Pop', 'Rock', 'Hip-Hop'],
      favoriteMoods: ['Happy', 'Energetic', 'Peaceful'],
      listeningPatterns: ['Morning person', 'Evening listener'],
      discoveryRate: 0.3
    };
  }

  // Clear user behavior data
  clearBehaviorData(): void {
    this.userBehaviorHistory = [];
    localStorage.removeItem('instam_user_behavior');
  }
}

// Advanced human-like mood prediction
export class HumanLikeMoodPredictor {
  static predictUserMood(context: {
    timeOfDay: number;
    dayOfWeek: number;
    recentMoods: string[];
    weather?: string;
    location?: string;
    socialActivity?: string;
  }): {
    predictedMood: string;
    confidence: number;
    reasoning: string[];
    suggestions: string[];
  } {
    try {
      const { timeOfDay, dayOfWeek, recentMoods, weather, location, socialActivity } = context;

      // Human-like mood patterns based on psychology
      const timeMoodMap = {
        morning: ['energetic', 'happy', 'peaceful'],
        afternoon: ['confident', 'energetic', 'focused'],
        evening: ['romantic', 'peaceful', 'nostalgic'],
        night: ['lonely', 'romantic', 'attitude']
      };

      const dayMoodMap = {
        weekday: ['confident', 'energetic', 'focused'],
        weekend: ['happy', 'party', 'relaxed']
      };

      // Analyze recent mood patterns
      const moodFrequency: Record<string, number> = {};
      recentMoods.forEach(mood => {
        moodFrequency[mood] = (moodFrequency[mood] || 0) + 1;
      });

      // Determine time-based mood
      let timeMood = 'happy';
      if (timeOfDay >= 6 && timeOfDay < 12) timeMood = 'energetic';
      else if (timeOfDay >= 12 && timeOfDay < 18) timeMood = 'confident';
      else if (timeOfDay >= 18 && timeOfDay < 22) timeMood = 'romantic';
      else timeMood = 'peaceful';

      // Determine day-based mood
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayMood = isWeekend ? 'happy' : 'confident';

      // Weather influence (psychology-based)
      let weatherMood = 'neutral';
      if (weather?.includes('sunny') || weather?.includes('clear')) weatherMood = 'happy';
      else if (weather?.includes('rainy') || weather?.includes('stormy')) weatherMood = 'romantic';
      else if (weather?.includes('cloudy') || weather?.includes('overcast')) weatherMood = 'peaceful';
      else if (weather?.includes('snowy')) weatherMood = 'nostalgic';

      // Social context influence
      let socialMood = 'neutral';
      if (socialActivity?.includes('party') || socialActivity?.includes('celebration')) socialMood = 'party';
      else if (socialActivity?.includes('date') || socialActivity?.includes('romantic')) socialMood = 'romantic';
      else if (socialActivity?.includes('work') || socialActivity?.includes('meeting')) socialMood = 'confident';
      else if (socialActivity?.includes('alone') || socialActivity?.includes('relaxing')) socialMood = 'peaceful';

      // Location influence
      let locationMood = 'neutral';
      if (location?.includes('beach') || location?.includes('vacation')) locationMood = 'happy';
      else if (location?.includes('home') || location?.includes('cozy')) locationMood = 'peaceful';
      else if (location?.includes('city') || location?.includes('urban')) locationMood = 'energetic';

      // Combine all factors with human psychology weighting
      const moodScores: Record<string, number> = {};

      // Recent mood history (35% weight - habits matter)
      Object.entries(moodFrequency).forEach(([mood, count]) => {
        moodScores[mood] = (moodScores[mood] || 0) + (count / recentMoods.length) * 0.35;
      });

      // Time of day (25% weight - circadian rhythms)
      timeMoodMap[timeMood as keyof typeof timeMoodMap]?.forEach(mood => {
        moodScores[mood] = (moodScores[mood] || 0) + 0.25 / timeMoodMap[timeMood as keyof typeof timeMoodMap].length;
      });

      // Day of week (15% weight - weekly patterns)
      dayMoodMap[isWeekend ? 'weekend' : 'weekday' as keyof typeof dayMoodMap]?.forEach(mood => {
        moodScores[mood] = (moodScores[mood] || 0) + 0.15 / dayMoodMap[isWeekend ? 'weekend' : 'weekday' as keyof typeof dayMoodMap].length;
      });

      // Weather (10% weight - environmental psychology)
      if (weatherMood !== 'neutral') {
        moodScores[weatherMood] = (moodScores[weatherMood] || 0) + 0.1;
      }

      // Social context (10% weight - social psychology)
      if (socialMood !== 'neutral') {
        moodScores[socialMood] = (moodScores[socialMood] || 0) + 0.1;
      }

      // Location (5% weight - environmental context)
      if (locationMood !== 'neutral') {
        moodScores[locationMood] = (moodScores[locationMood] || 0) + 0.05;
      }

      // Find predicted mood
      const sortedMoods = Object.entries(moodScores).sort(([,a], [,b]) => b - a);
      const predictedMood = sortedMoods[0]?.[0] || 'happy';
      const confidence = Math.min(sortedMoods[0]?.[1] || 0, 1);

      // Generate human-like reasoning
      const reasoning: string[] = [];

      // Time-based reasoning
      if (timeOfDay >= 6 && timeOfDay < 12) {
        reasoning.push("🌅 Morning time - people naturally feel more energetic and positive");
      } else if (timeOfDay >= 12 && timeOfDay < 18) {
        reasoning.push("☀️ Afternoon energy - confidence and focus peak during this time");
      } else if (timeOfDay >= 18 && timeOfDay < 22) {
        reasoning.push("🌆 Evening vibes - romantic and relaxed feelings emerge");
      } else {
        reasoning.push("🌙 Late night - introspective and emotional moods surface");
      }

      // Day-based reasoning
      if (isWeekend) {
        reasoning.push("🎉 It's the weekend - time to feel carefree and happy!");
      } else {
        reasoning.push("💼 Weekday rhythm - focused and confident energy");
      }

      // Weather reasoning
      if (weather) {
        if (weather.includes('sunny')) {
          reasoning.push("☀️ Sunny weather naturally boosts happy feelings");
        } else if (weather.includes('rainy')) {
          reasoning.push("🌧️ Rainy days often bring romantic, nostalgic moods");
        }
      }

      // Recent mood reasoning
      if (recentMoods.length > 0) {
        const topRecentMood = Object.entries(moodFrequency).sort(([,a], [,b]) => b - a)[0]?.[0];
        if (topRecentMood) {
          reasoning.push(`📊 Based on your recent ${topRecentMood} moods`);
        }
      }

      // Social context reasoning
      if (socialActivity) {
        if (socialActivity.includes('party')) {
          reasoning.push("🎊 Party context suggests energetic, fun music");
        } else if (socialActivity.includes('date')) {
          reasoning.push("💕 Romantic setting calls for love songs");
        }
      }

      // Generate personalized suggestions
      const suggestions: string[] = [];
      if (predictedMood === 'energetic') {
        suggestions.push("🎵 High-energy beats to match your vibrant mood!");
        suggestions.push("💃 Dance music and upbeat pop anthems");
        suggestions.push("⚡ Songs that make you want to move and groove");
      } else if (predictedMood === 'romantic') {
        suggestions.push("💖 Soft, emotional ballads for romantic moments");
        suggestions.push("🌹 Love songs and heartfelt melodies");
        suggestions.push("😍 Music that captures the feeling of being in love");
      } else if (predictedMood === 'peaceful') {
        suggestions.push("🧘 Calming instrumental music for relaxation");
        suggestions.push("🌸 Gentle acoustic melodies and nature sounds");
        suggestions.push("😌 Songs that help you unwind and find peace");
      } else if (predictedMood === 'happy') {
        suggestions.push("😄 Cheerful, feel-good songs to boost your happiness!");
        suggestions.push("🎉 Fun pop hits and joyful anthems");
        suggestions.push("✨ Music that makes you smile and dance");
      } else if (predictedMood === 'confident') {
        suggestions.push("💪 Powerful, motivational tracks for confidence");
        suggestions.push("🚀 Upbeat songs that make you feel unstoppable");
        suggestions.push("💎 Music that matches your strong, confident vibe");
      } else if (predictedMood === 'nostalgic') {
        suggestions.push("🕰️ Classic hits that bring back fond memories");
        suggestions.push("📻 Timeless songs from your favorite eras");
        suggestions.push("💭 Melancholic yet beautiful melodies");
      } else if (predictedMood === 'party') {
        suggestions.push("🎊 Dance floor anthems and party starters!");
        suggestions.push("🥳 High-energy tracks for celebrations");
        suggestions.push("🎶 Songs that get everyone moving");
      } else if (predictedMood === 'attitude') {
        suggestions.push("😎 Bold, confident tracks with attitude");
        suggestions.push("💅 Fierce music that matches your vibe");
        suggestions.push("🔥 Songs that make you feel powerful");
      }

      return {
        predictedMood,
        confidence,
        reasoning,
        suggestions
      };
    } catch (error) {
      console.error('❌ Human-like mood prediction failed:', error);
      return {
        predictedMood: 'happy',
        confidence: 0.5,
        reasoning: ['🤔 Using default happy mood based on general positivity'],
        suggestions: ['🎵 General feel-good music recommendations']
      };
    }
  }

  // Get mood-based music therapy insights
  static getMoodTherapyInsights(mood: string): {
    therapy: string;
    benefits: string[];
    recommendedGenres: string[];
    activities: string[];
  } {
    const therapyMap: Record<string, any> = {
      happy: {
        therapy: "Celebrate and amplify your positive energy!",
        benefits: ["Boosts endorphins", "Enhances social connections", "Increases motivation"],
        recommendedGenres: ["Pop", "Dance", "Upbeat Electronic"],
        activities: ["Dance", "Sing along", "Share with friends"]
      },
      sad: {
        therapy: "Gentle emotional processing and comfort",
        benefits: ["Emotional release", "Comfort during difficult times", "Mood elevation"],
        recommendedGenres: ["Soft Pop", "Acoustic", "Indie Folk"],
        activities: ["Listen quietly", "Journal feelings", "Light exercise"]
      },
      energetic: {
        therapy: "Channel your energy productively",
        benefits: ["Stress relief", "Physical activity boost", "Creativity enhancement"],
        recommendedGenres: ["Electronic", "Rock", "Hip-Hop"],
        activities: ["Workout", "Dance", "Creative projects"]
      },
      romantic: {
        therapy: "Deepen emotional connections",
        benefits: ["Relationship bonding", "Emotional intimacy", "Stress reduction"],
        recommendedGenres: ["R&B", "Soft Rock", "Ballads"],
        activities: ["Quality time", "Romantic gestures", "Shared listening"]
      },
      peaceful: {
        therapy: "Mindfulness and relaxation",
        benefits: ["Stress reduction", "Better sleep", "Mental clarity"],
        recommendedGenres: ["Ambient", "Classical", "Lo-fi"],
        activities: ["Meditation", "Reading", "Nature walks"]
      },
      confident: {
        therapy: "Self-empowerment and motivation",
        benefits: ["Self-esteem boost", "Goal achievement", "Leadership qualities"],
        recommendedGenres: ["Motivational", "Rock", "Hip-Hop"],
        activities: ["Exercise", "Goal setting", "Positive affirmations"]
      },
      nostalgic: {
        therapy: "Emotional reflection and memory processing",
        benefits: ["Emotional healing", "Gratitude cultivation", "Life perspective"],
        recommendedGenres: ["Classic Rock", "80s/90s Pop", "Folk"],
        activities: ["Memory sharing", "Photo viewing", "Gratitude journaling"]
      },
      lonely: {
        therapy: "Connection and comfort seeking",
        benefits: ["Emotional comfort", "Social connection reminder", "Hope cultivation"],
        recommendedGenres: ["Singer-Songwriter", "Indie", "Alternative"],
        activities: ["Reach out to loved ones", "Self-care activities", "Creative expression"]
      },
      party: {
        therapy: "Social bonding and celebration",
        benefits: ["Social connection", "Joy amplification", "Memory creation"],
        recommendedGenres: ["Dance", "Pop", "Electronic"],
        activities: ["Dance parties", "Social gatherings", "Celebration rituals"]
      },
      attitude: {
        therapy: "Self-expression and confidence building",
        benefits: ["Self-expression", "Confidence building", "Empowerment"],
        recommendedGenres: ["Hip-Hop", "Rock", "R&B"],
        activities: ["Self-expression", "Style exploration", "Goal pursuit"]
      }
    };

    return therapyMap[mood] || therapyMap.happy;
  }
}
