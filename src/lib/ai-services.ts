// AI Services for Instam Project
// Advanced AI features for music and image analysis

import * as tf from '@tensorflow/tfjs';

// Simple NLP implementation to avoid Natural library issues
class SimpleTokenizer {
  tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }
}

class SimpleSentimentAnalyzer {
  private positiveWords = [
    'good', 'great', 'amazing', 'love', 'happy', 'excellent', 'wonderful',
    'fantastic', 'awesome', 'perfect', 'best', 'beautiful', 'nice', 'brilliant'
  ];
  
  private negativeWords = [
    'bad', 'terrible', 'hate', 'sad', 'angry', 'awful', 'horrible',
    'worst', 'ugly', 'disgusting', 'disappointing', 'annoying', 'frustrating'
  ];

  getSentiment(tokens: string[]): number {
    if (!tokens || tokens.length === 0) return 0;
    
    let score = 0;
    tokens.forEach(token => {
      if (this.positiveWords.includes(token)) score += 1;
      if (this.negativeWords.includes(token)) score -= 1;
    });
    
    return score / tokens.length;
  }
}

// Initialize NLP tools
const tokenizer = new SimpleTokenizer();
const sentiment = new SimpleSentimentAnalyzer();

export class AIServices {
  private static model: tf.LayersModel | null = null;
  private static isInitialized = false;

  // Initialize AI models
  static async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🤖 Initializing AI Services...');
      
      // Check if TensorFlow is available
      if (typeof tf === 'undefined') {
        console.log('⚠️ TensorFlow not available, using fallback mode');
        this.isInitialized = true;
        return;
      }

      // Load pre-trained model for emotion detection
      // For now, we'll create a simple model
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [10], units: 32, activation: 'relu' }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 8, activation: 'softmax' })
        ]
      });

      this.model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.isInitialized = true;
      console.log('✅ AI Services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI Services:', error);
      console.log('⚠️ Continuing with limited AI functionality');
      this.isInitialized = true; // Allow basic functionality even if TensorFlow fails
    }
  }

  // Analyze text sentiment (for captions, descriptions)
  static analyzeSentiment(text: string): {
    score: number;
    comparative: number;
    positive: string[];
    negative: string[];
  } {
    try {
      console.log('🧠 Analyzing sentiment for:', text);
      
      if (!text || typeof text !== 'string') {
        console.log('⚠️ Invalid text input for sentiment analysis');
        return { score: 0, comparative: 0, positive: [], negative: [] };
      }

      const tokens = tokenizer.tokenize(text);
      console.log('📝 Tokenized text:', tokens);
      
      if (!tokens || tokens.length === 0) {
        console.log('⚠️ No tokens found in text');
        return { score: 0, comparative: 0, positive: [], negative: [] };
      }

      const score = sentiment.getSentiment(tokens);
      console.log('📊 Sentiment score:', score);
      
      // Extract positive and negative words
      const positiveWords = tokens.filter(word => 
        ['good', 'great', 'amazing', 'love', 'happy', 'excellent', 'wonderful', 
         'fantastic', 'awesome', 'perfect', 'best', 'beautiful', 'nice', 'brilliant',
         'excellent', 'great', 'wonderful', 'fantastic', 'awesome'].includes(word)
      );
      
      const negativeWords = tokens.filter(word => 
        ['bad', 'terrible', 'hate', 'sad', 'angry', 'awful', 'horrible',
         'worst', 'ugly', 'disgusting', 'disappointing', 'annoying', 'frustrating'].includes(word)
      );

      const result = {
        score,
        comparative: score / tokens.length,
        positive: positiveWords,
        negative: negativeWords
      };

      console.log('✅ Sentiment analysis result:', result);
      return result;
    } catch (error) {
      console.error('❌ Sentiment analysis failed:', error);
      return { score: 0, comparative: 0, positive: [], negative: [] };
    }
  }

  // Analyze mood from multiple factors
  static analyzeMood(inputs: {
    imageMood?: string;
    textSentiment?: number;
    userPreference?: string[];
    timeOfDay?: string;
  }): {
    primaryMood: string;
    confidence: number;
    secondaryMoods: string[];
    analysis: {
      image: number;
      text: number;
      preference: number;
      context: number;
    };
  } {
    try {
      const moodWeights = {
        happy: 0,
        sad: 0,
        energetic: 0,
        peaceful: 0,
        romantic: 0,
        aggressive: 0,
        confident: 0,
        nostalgic: 0,
        lonely: 0,
        party: 0,
        attitude: 0
      };

      // Image mood contribution (40%)
      if (inputs.imageMood) {
        moodWeights[inputs.imageMood as keyof typeof moodWeights] += 0.4;
      }

      // Text sentiment contribution (25%)
      if (inputs.textSentiment !== undefined) {
        if (inputs.textSentiment > 0.3) {
          moodWeights.happy += 0.25;
          moodWeights.confident += 0.15;
        } else if (inputs.textSentiment < -0.3) {
          moodWeights.sad += 0.25;
          moodWeights.lonely += 0.15;
        }
      }

      // User preference contribution (25%)
      if (inputs.userPreference) {
        inputs.userPreference.forEach(pref => {
          if (moodWeights.hasOwnProperty(pref)) {
            moodWeights[pref as keyof typeof moodWeights] += 0.25 / inputs.userPreference!.length;
          }
        });
      }

      // Time of day contribution (10%)
      if (inputs.timeOfDay) {
        const hour = parseInt(inputs.timeOfDay.split(':')[0]);
        if (hour >= 6 && hour < 12) {
          moodWeights.energetic += 0.1;
          moodWeights.peaceful += 0.05;
        } else if (hour >= 12 && hour < 18) {
          moodWeights.happy += 0.1;
          moodWeights.confident += 0.05;
        } else if (hour >= 18 && hour < 22) {
          moodWeights.party += 0.1;
          moodWeights.romantic += 0.05;
        } else {
          moodWeights.peaceful += 0.05;
          moodWeights.lonely += 0.05;
        }
      }

      // Find primary mood
      const sortedMoods = Object.entries(moodWeights)
        .sort(([, a], [, b]) => b - a);

      const primaryMood = sortedMoods[0][0];
      const confidence = Math.min(sortedMoods[0][1] * 2, 1); // Normalize to 0-1
      const secondaryMoods = sortedMoods
        .slice(1, 4)
        .filter(([, weight]) => weight > 0.1)
        .map(([mood]) => mood);

      return {
        primaryMood,
        confidence,
        secondaryMoods,
        analysis: {
          image: inputs.imageMood ? 0.4 : 0,
          text: inputs.textSentiment !== undefined ? 0.25 : 0,
          preference: inputs.userPreference ? 0.25 : 0,
          context: inputs.timeOfDay ? 0.1 : 0
        }
      };
    } catch (error) {
      console.error('❌ Mood analysis failed:', error);
      return {
        primaryMood: 'happy',
        confidence: 0.5,
        secondaryMoods: [],
        analysis: { image: 0, text: 0, preference: 0, context: 0 }
      };
    }
  }

  // Generate music recommendations using AI
  static generateAIRecommendations(songs: any[], userProfile: any, currentMood: string): any[] {
    try {
      console.log('🤖 Generating AI recommendations for mood:', currentMood);

      // Score songs based on multiple factors
      const scoredSongs = songs.map(song => {
        let score = 0;

        // Mood matching (40%)
        if (song.mood_tags?.includes(currentMood)) {
          score += 0.4;
        }

        // Genre preference (25%)
        if (userProfile.favorite_genres?.includes(song.genre)) {
          score += 0.25;
        }

        // Language preference (20%)
        if (userProfile.preferred_languages?.includes(song.language)) {
          score += 0.2;
        }

        // Energy level matching (15%)
        const energyMatch = this.calculateEnergyMatch(currentMood, song.energy || 5);
        score += energyMatch * 0.15;

        // Personality trait matching (bonus)
        if (userProfile.personality_traits?.some((trait: string) => 
          song.personality_tags?.includes(trait))) {
          score += 0.1;
        }

        return {
          ...song,
          aiScore: score,
          aiReason: this.generateRecommendationReason(song, currentMood, userProfile)
        };
      });

      // Sort by AI score and return top recommendations
      return scoredSongs
        .sort((a, b) => b.aiScore - a.aiScore)
        .slice(0, 20);
    } catch (error) {
      console.error('❌ AI recommendation generation failed:', error);
      return songs.slice(0, 20); // Fallback to first 20 songs
    }
  }

  // Calculate energy level match between mood and song
  private static calculateEnergyMatch(mood: string, songEnergy: number): number {
    const moodEnergyMap: Record<string, number> = {
      energetic: 9,
      party: 8,
      confident: 7,
      happy: 6,
      romantic: 5,
      peaceful: 3,
      nostalgic: 4,
      sad: 2,
      lonely: 1,
      aggressive: 8,
      attitude: 7
    };

    const targetEnergy = moodEnergyMap[mood] || 5;
    const difference = Math.abs(targetEnergy - songEnergy);
    return Math.max(0, 1 - (difference / 10));
  }

  // Generate human-readable recommendation reason
  private static generateRecommendationReason(song: any, mood: string, profile: any): string {
    const reasons = [];

    if (song.mood_tags?.includes(mood)) {
      reasons.push(`perfect ${mood} vibe`);
    }

    if (profile.favorite_genres?.includes(song.genre)) {
      reasons.push(`your favorite ${song.genre} genre`);
    }

    if (profile.preferred_languages?.includes(song.language)) {
      reasons.push(`in ${song.language}`);
    }

    if (profile.personality_traits?.some((trait: string) => 
      song.personality_tags?.includes(trait))) {
      reasons.push(`matches your ${profile.personality_traits.find((trait: string) => 
        song.personality_tags?.includes(trait))} personality`);
    }

    return reasons.length > 0 
      ? reasons.slice(0, 2).join(' · ')
      : `great choice for ${mood} mood`;
  }

  // Analyze song compatibility with user profile
  static analyzeSongCompatibility(song: any, userProfile: any): {
    overallScore: number;
    factors: {
      genre: number;
      language: number;
      mood: number;
      personality: number;
      energy: number;
    };
    recommendation: string;
  } {
    try {
      const factors = {
        genre: userProfile.favorite_genres?.includes(song.genre) ? 1 : 0.3,
        language: userProfile.preferred_languages?.includes(song.language) ? 1 : 0.5,
        mood: song.mood_tags?.some((mood: string) => 
          userProfile.personality_traits?.includes(mood)) ? 1 : 0.6,
        personality: song.personality_tags?.some((trait: string) => 
          userProfile.personality_traits?.includes(trait)) ? 1 : 0.4,
        energy: this.calculateEnergyMatch(
          userProfile.personality_traits?.[0] || 'happy', 
          song.energy || 5
        )
      };

      const overallScore = Object.values(factors).reduce((a, b) => a + b, 0) / 5;

      let recommendation = '';
      if (overallScore >= 0.8) {
        recommendation = 'Perfect match! Highly recommended';
      } else if (overallScore >= 0.6) {
        recommendation = 'Great choice for your taste';
      } else if (overallScore >= 0.4) {
        recommendation = 'Good option, worth trying';
      } else {
        recommendation = 'Might not be your style';
      }

      return {
        overallScore,
        factors,
        recommendation
      };
    } catch (error) {
      console.error('❌ Song compatibility analysis failed:', error);
      return {
        overallScore: 0.5,
        factors: { genre: 0.5, language: 0.5, mood: 0.5, personality: 0.5, energy: 0.5 },
        recommendation: 'Analysis unavailable'
      };
    }
  }

  // Predict user preferences based on behavior
  static predictUserPreferences(userHistory: any[]): {
    likelyGenres: string[];
    likelyMoods: string[];
    personalityInsights: string[];
    recommendations: string[];
  } {
    try {
      console.log('🤖 Analyzing user preferences from history...');

      // Analyze patterns in user history
      const genreCounts: Record<string, number> = {};
      const moodCounts: Record<string, number> = {};
      const personalityCounts: Record<string, number> = {};

      userHistory.forEach(item => {
        if (item.genre) {
          genreCounts[item.genre] = (genreCounts[item.genre] || 0) + 1;
        }
        if (item.mood) {
          moodCounts[item.mood] = (moodCounts[item.mood] || 0) + 1;
        }
        if (item.personality) {
          personalityCounts[item.personality] = (personalityCounts[item.personality] || 0) + 1;
        }
      });

      // Sort by frequency and get top recommendations
      const likelyGenres = Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([genre]) => genre);

      const likelyMoods = Object.entries(moodCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([mood]) => mood);

      const personalityInsights = Object.entries(personalityCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([personality]) => personality);

      // Generate recommendations based on patterns
      const recommendations = [];
      if (likelyGenres.length > 0) {
        recommendations.push(`You seem to love ${likelyGenres[0]} music`);
      }
      if (likelyMoods.length > 0) {
        recommendations.push(`${likelyMoods[0]} vibes work best for you`);
      }
      if (personalityInsights.includes('energetic')) {
        recommendations.push('Try high-energy workout playlists');
      }
      if (personalityInsights.includes('peaceful')) {
        recommendations.push('Consider meditation and chill music');
      }

      return {
        likelyGenres,
        likelyMoods,
        personalityInsights,
        recommendations
      };
    } catch (error) {
      console.error('❌ User preference prediction failed:', error);
      return {
        likelyGenres: [],
        likelyMoods: [],
        personalityInsights: [],
        recommendations: []
      };
    }
  }

  // Clean up resources
  static dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isInitialized = false;
  }
}

// Initialize AI services on import
AIServices.initialize().catch(console.error);
