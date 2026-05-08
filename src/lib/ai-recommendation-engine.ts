// AI-Powered Recommendation Engine
// Advanced music recommendation using machine learning

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
  song: any;
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

export class AIRecommendationEngine {
  private static userBehaviorHistory: UserBehaviorData[] = [];
  private static learningModel: any = null;
  private static isInitialized = false;

  // Initialize the AI recommendation engine
  static async initialize() {
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
          moodMatch: 0.3,
          genrePreference: 0.25,
          languageMatch: 0.2,
          energyAlignment: 0.15,
          personalityFit: 0.1
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

  // Generate personalized recommendations
  static async generateRecommendations(
    songs: any[],
    userProfile: any,
    currentMood: string,
    moodAnalysis?: AdvancedMoodAnalysis
  ): Promise<AIRecommendation[]> {
    try {
      console.log('🎯 Generating AI-powered recommendations...');

      // Analyze user behavior patterns
      const behaviorPatterns = this.analyzeUserBehavior();
      
      // Get contextual factors
      const contextFactors = this.getContextFactors();

      // Score each song
      const scoredSongs = songs.map(song => {
        const recommendation = this.scoreSong(
          song,
          userProfile,
          currentMood,
          moodAnalysis,
          behaviorPatterns,
          contextFactors
        );
        
        return recommendation;
      });

      // Sort by score and apply diversity filter
      const diverseRecommendations = this.applyDiversityFilter(
        scoredSongs.sort((a, b) => b.score - a.score)
      );

      // Update learning model based on this recommendation session
      this.updateLearningModel(diverseRecommendations);

      return diverseRecommendations.slice(0, 20); // Return top 20
    } catch (error) {
      console.error('❌ AI recommendation generation failed:', error);
      return this.getFallbackRecommendations(songs, currentMood);
    }
  }

  // Score individual song for recommendation
  private static scoreSong(
    song: any,
    userProfile: any,
    currentMood: string,
    moodAnalysis?: AdvancedMoodAnalysis,
    behaviorPatterns?: any,
    contextFactors?: any
  ): AIRecommendation {
    // Calculate individual factors
    const moodMatch = this.calculateMoodMatch(song, currentMood, moodAnalysis);
    const genrePreference = this.calculateGenrePreference(song, userProfile, behaviorPatterns);
    const languageMatch = this.calculateLanguageMatch(song, userProfile, behaviorPatterns);
    const energyAlignment = this.calculateEnergyAlignment(song, currentMood, moodAnalysis);
    const personalityFit = this.calculatePersonalityFit(song, userProfile, behaviorPatterns);
    const contextRelevance = this.calculateContextRelevance(song, contextFactors);

    // Apply learned weights
    const weights = this.learningModel?.weights || {
      moodMatch: 0.3,
      genrePreference: 0.25,
      languageMatch: 0.2,
      energyAlignment: 0.15,
      personalityFit: 0.1
    };

    const personalizedFactors = {
      moodMatch,
      genrePreference,
      languageMatch,
      energyAlignment,
      personalityFit,
      contextRelevance
    };

    // Calculate weighted score
    const score = Object.entries(personalizedFactors).reduce((total, [factor, value]) => {
      return total + (value * (weights[factor as keyof typeof weights] || 0));
    }, 0);

    // Generate reasons and insights
    const reasons = this.generateRecommendationReasons(
      song,
      personalizedFactors,
      currentMood,
      userProfile
    );

    const aiInsights = this.generateAIInsights(
      song,
      personalizedFactors,
      moodAnalysis,
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

  // Calculate mood match score
  private static calculateMoodMatch(
    song: any,
    currentMood: string,
    moodAnalysis?: AdvancedMoodAnalysis
  ): number {
    let score = 0;

    // Direct mood tag match
    if (song.mood_tags?.includes(currentMood)) {
      score += 0.8;
    }

    // Advanced mood analysis if available
    if (moodAnalysis) {
      const emotionScore = moodAnalysis.emotions[currentMood as keyof typeof moodAnalysis.emotions] || 0;
      score += emotionScore * 0.2;
    }

    // Energy level alignment
    const moodEnergyMap: Record<string, number> = {
      energetic: 8, party: 8, confident: 7, happy: 6,
      romantic: 5, peaceful: 3, nostalgic: 4, sad: 2,
      lonely: 1, aggressive: 8, attitude: 7
    };

    const targetEnergy = moodEnergyMap[currentMood] || 5;
    const songEnergy = song.energy || 5;
    const energyDiff = Math.abs(targetEnergy - songEnergy);
    score += Math.max(0, (10 - energyDiff) / 10) * 0.2;

    return Math.min(score, 1);
  }

  // Calculate genre preference score
  private static calculateGenrePreference(
    song: any,
    userProfile: any,
    behaviorPatterns?: any
  ): number {
    let score = 0;

    // Direct genre preference
    if (userProfile.favorite_genres?.includes(song.genre)) {
      score += 0.8;
    }

    // Behavior-based genre preference
    if (behaviorPatterns?.preferredGenres) {
      const genreScore = behaviorPatterns.preferredGenres[song.genre] || 0;
      score += genreScore * 0.2;
    }

    return Math.min(score, 1);
  }

  // Calculate language match score
  private static calculateLanguageMatch(
    song: any,
    userProfile: any,
    behaviorPatterns?: any
  ): number {
    let score = 0;

    // Direct language preference
    if (userProfile.preferred_languages?.includes(song.language)) {
      score += 0.8;
    }

    // Behavior-based language preference
    if (behaviorPatterns?.preferredLanguages) {
      const langScore = behaviorPatterns.preferredLanguages[song.language] || 0;
      score += langScore * 0.2;
    }

    return Math.min(score, 1);
  }

  // Calculate energy alignment score
  private static calculateEnergyAlignment(
    song: any,
    currentMood: string,
    moodAnalysis?: AdvancedMoodAnalysis
  ): number {
    const songEnergy = song.energy || 5;
    
    // Base energy alignment with mood
    const moodEnergyMap: Record<string, number> = {
      energetic: 8, party: 8, confident: 7, happy: 6,
      romantic: 5, peaceful: 3, nostalgic: 4, sad: 2,
      lonely: 1, aggressive: 8, attitude: 7
    };

    const targetEnergy = moodEnergyMap[currentMood] || 5;
    const energyDiff = Math.abs(targetEnergy - songEnergy);
    let score = Math.max(0, (10 - energyDiff) / 10);

    // Adjust based on mood analysis confidence
    if (moodAnalysis && moodAnalysis.confidence > 0.7) {
      score *= 1.2; // Boost score if mood analysis is confident
    }

    return Math.min(score, 1);
  }

  // Calculate personality fit score
  private static calculatePersonalityFit(
    song: any,
    userProfile: any,
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

  // Calculate context relevance score
  private static calculateContextRelevance(song: any, contextFactors?: any): number {
    if (!contextFactors) return 0.5;

    let score = 0.5; // Base score

    // Time-based relevance
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12 && song.energy > 6) {
      score += 0.2; // Morning = energetic
    } else if (hour >= 22 || hour < 6 && song.energy < 4) {
      score += 0.2; // Night = calm
    }

    return Math.min(score, 1);
  }

  // Generate recommendation reasons
  private static generateRecommendationReasons(
    song: any,
    factors: any,
    currentMood: string,
    userProfile: any
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
      reasons.push(`Perfect for this time of day`);
    }

    return reasons.slice(0, 3); // Return top 3 reasons
  }

  // Generate AI insights
  private static generateAIInsights(
    song: any,
    factors: any,
    moodAnalysis?: AdvancedMoodAnalysis,
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

    // Mood analysis insights
    if (moodAnalysis && moodAnalysis.confidence > 0.8) {
      insights.push(`AI-detected mood confirms this choice`);
    }

    // Energy insights
    if (factors.energyAlignment > 0.9) {
      insights.push(`Energy level perfectly matches your current state`);
    }

    return insights.slice(0, 2); // Return top 2 insights
  }

  // Calculate recommendation confidence
  private static calculateConfidence(
    factors: any,
    behaviorPatterns?: any
  ): number {
    const factorScores = Object.values(factors).filter((score): score is number => typeof score === 'number');
    const averageScore = factorScores.reduce((sum: number, score: number) => sum + score, 0) / factorScores.length;

    // Boost confidence if we have behavior data
    const behaviorBoost = behaviorPatterns ? 0.1 : 0;

    return Math.min(averageScore + behaviorBoost, 1);
  }

  // Apply diversity filter to recommendations
  private static applyDiversityFilter(recommendations: AIRecommendation[]): AIRecommendation[] {
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

  // Analyze user behavior patterns
  private static analyzeUserBehavior(): any {
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
      // Genre preferences
      if (interaction.songId) {
        // This would need to be expanded to fetch song details
        // For now, we'll use placeholder logic
      }
    });

    return patterns;
  }

  // Get context factors
  private static getContextFactors(): any {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    return {
      timeOfDay: hour,
      dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      season: Math.floor(now.getMonth() / 3) // 0: Winter, 1: Spring, etc.
    };
  }

  // Update learning model
  private static updateLearningModel(recommendations: AIRecommendation[]): void {
    // This would implement reinforcement learning
    // For now, it's a placeholder for future enhancement
    console.log('📚 Updating learning model with new recommendations...');
  }

  // Get fallback recommendations
  private static getFallbackRecommendations(songs: any[], currentMood: string): AIRecommendation[] {
    return songs.slice(0, 20).map(song => ({
      song,
      score: Math.random(),
      reasons: ['Basic recommendation'],
      aiInsights: ['AI features temporarily unavailable'],
      personalizedFactors: {
        moodMatch: 0.5,
        genrePreference: 0.5,
        languageMatch: 0.5,
        energyAlignment: 0.5,
        personalityFit: 0.5,
        contextRelevance: 0.5
      },
      confidence: 0.3
    }));
  }

  // Record user behavior
  static recordBehavior(behavior: UserBehaviorData): void {
    this.userBehaviorHistory.push(behavior);
    
    // Keep only last 1000 interactions
    if (this.userBehaviorHistory.length > 1000) {
      this.userBehaviorHistory = this.userBehaviorHistory.slice(-1000);
    }

    // Save to localStorage
    localStorage.setItem('instam_user_behavior', JSON.stringify(this.userBehaviorHistory));
  }

  // Get user behavior insights
  static getUserInsights(): {
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
  static clearBehaviorData(): void {
    this.userBehaviorHistory = [];
    localStorage.removeItem('instam_user_behavior');
  }
}

// Initialize on import
AIRecommendationEngine.initialize().catch(console.error);

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
