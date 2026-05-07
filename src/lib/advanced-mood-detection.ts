// Advanced Mood Detection with AI
// Enhanced mood analysis using multiple AI techniques

import { AIServices } from './ai-services';

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
    weather: number;
    location: number;
    socialContext: number;
  };
  aiInsights: string[];
  recommendations: string[];
}

export class AdvancedMoodDetection {
  private static emotionWeights = {
    happy: { energy: 0.7, valence: 0.9, arousal: 0.6 },
    sad: { energy: 0.2, valence: 0.1, arousal: 0.3 },
    energetic: { energy: 0.9, valence: 0.7, arousal: 0.9 },
    peaceful: { energy: 0.3, valence: 0.6, arousal: 0.2 },
    romantic: { energy: 0.5, valence: 0.8, arousal: 0.4 },
    aggressive: { energy: 0.8, valence: 0.2, arousal: 0.9 },
    confident: { energy: 0.7, valence: 0.8, arousal: 0.6 },
    nostalgic: { energy: 0.4, valence: 0.5, arousal: 0.3 },
    lonely: { energy: 0.2, valence: 0.2, arousal: 0.2 },
    party: { energy: 0.9, valence: 0.8, arousal: 0.9 },
    attitude: { energy: 0.6, valence: 0.4, arousal: 0.7 }
  };

  // Analyze mood from image with advanced AI
  static async analyzeImageMood(imageData: {
    colors: string[];
    brightness: number;
    contrast: number;
    faces: number;
    scene: string;
    objects: string[];
  }): Promise<AdvancedMoodAnalysis> {
    try {
      console.log('🧠 Analyzing image mood with advanced AI...');

      // Color-based mood analysis
      const colorMood = this.analyzeColorMood(imageData.colors);
      
      // Scene-based mood analysis
      const sceneMood = this.analyzeSceneMood(imageData.scene);
      
      // Face detection mood analysis
      const faceMood = this.analyzeFaceMood(imageData.faces);
      
      // Object-based mood analysis
      const objectMood = this.analyzeObjectMood(imageData.objects);
      
      // Lighting mood analysis
      const lightingMood = this.analyzeLightingMood(imageData.brightness, imageData.contrast);

      // Combine all mood analyses
      const combinedEmotions = this.combineMoodAnalyses({
        colorMood,
        sceneMood,
        faceMood,
        objectMood,
        lightingMood
      });

      // Get context factors
      const contextFactors = this.getContextFactors();

      // Generate AI insights
      const aiInsights = this.generateAIInsights(combinedEmotions, imageData, contextFactors);
      
      // Generate recommendations
      const recommendations = this.generateMoodRecommendations(combinedEmotions, contextFactors);

      // Determine primary mood and confidence
      const sortedEmotions = Object.entries(combinedEmotions)
        .sort(([, a], [, b]) => b - a);
      
      const primaryMood = sortedEmotions[0][0];
      const confidence = Math.min(sortedEmotions[0][1], 1);

      return {
        primaryMood,
        confidence,
        emotions: combinedEmotions,
        contextFactors,
        aiInsights,
        recommendations
      };
    } catch (error) {
      console.error('❌ Advanced mood analysis failed:', error);
      return this.getDefaultMoodAnalysis();
    }
  }

  // Analyze mood based on colors in image
  private static analyzeColorMood(colors: string[]): Record<string, number> {
    const emotions: Record<string, number> = {};
    
    colors.forEach(color => {
      // Color psychology mappings
      if (color.includes('red') || color.includes('orange')) {
        emotions.energetic = (emotions.energetic || 0) + 0.3;
        emotions.aggressive = (emotions.aggressive || 0) + 0.2;
        emotions.confident = (emotions.confident || 0) + 0.2;
        emotions.romantic = (emotions.romantic || 0) + 0.1;
      }
      if (color.includes('blue') || color.includes('green')) {
        emotions.peaceful = (emotions.peaceful || 0) + 0.3;
        emotions.happy = (emotions.happy || 0) + 0.2;
        emotions.confident = (emotions.confident || 0) + 0.1;
      }
      if (color.includes('yellow') || color.includes('bright')) {
        emotions.happy = (emotions.happy || 0) + 0.4;
        emotions.energetic = (emotions.energetic || 0) + 0.3;
        emotions.party = (emotions.party || 0) + 0.2;
      }
      if (color.includes('purple') || color.includes('pink')) {
        emotions.romantic = (emotions.romantic || 0) + 0.4;
        emotions.nostalgic = (emotions.nostalgic || 0) + 0.2;
        emotions.peaceful = (emotions.peaceful || 0) + 0.1;
      }
      if (color.includes('black') || color.includes('dark')) {
        emotions.lonely = (emotions.lonely || 0) + 0.3;
        emotions.sad = (emotions.sad || 0) + 0.2;
        emotions.attitude = (emotions.attitude || 0) + 0.2;
        emotions.confident = (emotions.confident || 0) + 0.1;
      }
    });

    // Normalize emotions
    const total = Object.values(emotions).reduce((a, b) => a + b, 0);
    if (total > 0) {
      Object.keys(emotions).forEach(key => {
        emotions[key] = emotions[key] / total;
      });
    }

    return emotions;
  }

  // Analyze mood based on scene type
  private static analyzeSceneMood(scene: string): Record<string, number> {
    const emotions: Record<string, number> = {};

    const sceneMoodMap: Record<string, Record<string, number>> = {
      beach: { happy: 0.4, peaceful: 0.3, romantic: 0.2, energetic: 0.1 },
      party: { party: 0.5, energetic: 0.3, happy: 0.2 },
      nature: { peaceful: 0.4, happy: 0.3, nostalgic: 0.2, energetic: 0.1 },
      city: { energetic: 0.3, confident: 0.3, lonely: 0.2, attitude: 0.2 },
      home: { peaceful: 0.4, nostalgic: 0.3, happy: 0.2, lonely: 0.1 },
      gym: { energetic: 0.5, confident: 0.3, aggressive: 0.2 },
      restaurant: { happy: 0.3, romantic: 0.3, peaceful: 0.2, confident: 0.2 },
      travel: { happy: 0.3, energetic: 0.3, nostalgic: 0.2, confident: 0.2 },
      work: { confident: 0.4, energetic: 0.3, attitude: 0.2, peaceful: 0.1 },
      social: { happy: 0.4, party: 0.3, confident: 0.2, energetic: 0.1 }
    };

    return sceneMoodMap[scene] || { happy: 0.5, peaceful: 0.5 };
  }

  // Analyze mood based on face detection
  private static analyzeFaceMood(faceCount: number): Record<string, number> {
    const emotions: Record<string, number> = {};

    if (faceCount === 0) {
      emotions.lonely = 0.4;
      emotions.peaceful = 0.3;
      emotions.nostalgic = 0.3;
    } else if (faceCount === 1) {
      emotions.confident = 0.3;
      emotions.happy = 0.3;
      emotions.peaceful = 0.2;
      emotions.romantic = 0.2;
    } else if (faceCount <= 3) {
      emotions.happy = 0.4;
      emotions.party = 0.3;
      emotions.energetic = 0.2;
      emotions.confident = 0.1;
    } else {
      emotions.party = 0.5;
      emotions.energetic = 0.3;
      emotions.happy = 0.2;
    }

    return emotions;
  }

  // Analyze mood based on objects in image
  private static analyzeObjectMood(objects: string[]): Record<string, number> {
    const emotions: Record<string, number> = {};

    objects.forEach(object => {
      const objectLower = object.toLowerCase();
      
      // Object-based mood mappings
      if (objectLower.includes('food') || objectLower.includes('drink')) {
        emotions.happy = (emotions.happy || 0) + 0.2;
        emotions.peaceful = (emotions.peaceful || 0) + 0.1;
      }
      if (objectLower.includes('car') || objectLower.includes('vehicle')) {
        emotions.confident = (emotions.confident || 0) + 0.2;
        emotions.energetic = (emotions.energetic || 0) + 0.1;
      }
      if (objectLower.includes('book') || objectLower.includes('laptop')) {
        emotions.peaceful = (emotions.peaceful || 0) + 0.2;
        emotions.confident = (emotions.confident || 0) + 0.1;
      }
      if (objectLower.includes('music') || objectLower.includes('instrument')) {
        emotions.happy = (emotions.happy || 0) + 0.3;
        emotions.energetic = (emotions.energetic || 0) + 0.2;
      }
      if (objectLower.includes('sport') || objectLower.includes('exercise')) {
        emotions.energetic = (emotions.energetic || 0) + 0.4;
        emotions.confident = (emotions.confident || 0) + 0.2;
      }
    });

    // Normalize emotions
    const total = Object.values(emotions).reduce((a, b) => a + b, 0);
    if (total > 0) {
      Object.keys(emotions).forEach(key => {
        emotions[key] = emotions[key] / total;
      });
    }

    return emotions;
  }

  // Analyze mood based on lighting
  private static analyzeLightingMood(brightness: number, contrast: number): Record<string, number> {
    const emotions: Record<string, number> = {};

    if (brightness > 0.7) {
      emotions.happy = 0.4;
      emotions.energetic = 0.3;
      emotions.confident = 0.3;
    } else if (brightness > 0.4) {
      emotions.peaceful = 0.3;
      emotions.happy = 0.3;
      emotions.confident = 0.2;
      emotions.romantic = 0.2;
    } else {
      emotions.lonely = 0.3;
      emotions.nostalgic = 0.3;
      emotions.peaceful = 0.2;
      emotions.sad = 0.2;
    }

    if (contrast > 0.7) {
      emotions.attitude = (emotions.attitude || 0) + 0.2;
      emotions.confident = (emotions.confident || 0) + 0.2;
      emotions.aggressive = (emotions.aggressive || 0) + 0.1;
    }

    return emotions;
  }

  // Combine multiple mood analyses
  private static combineMoodAnalyses(analyses: {
    colorMood: Record<string, number>;
    sceneMood: Record<string, number>;
    faceMood: Record<string, number>;
    objectMood: Record<string, number>;
    lightingMood: Record<string, number>;
  }): Record<string, number> {
    const combined: Record<string, number> = {};

    // Weight different analyses
    const weights = {
      colorMood: 0.25,
      sceneMood: 0.20,
      faceMood: 0.20,
      objectMood: 0.15,
      lightingMood: 0.20
    };

    Object.entries(weights).forEach(([analysis, weight]) => {
      const moodData = analyses[analysis as keyof typeof analyses];
      Object.entries(moodData).forEach(([mood, value]) => {
        combined[mood] = (combined[mood] || 0) + (value * weight);
      });
    });

    return combined;
  }

  // Get context factors
  private static getContextFactors(): {
    timeOfDay: number;
    weather: number;
    location: number;
    socialContext: number;
  } {
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay = 0.5; // Neutral
    if (hour >= 6 && hour < 12) timeOfDay = 0.8; // Morning
    else if (hour >= 12 && hour < 18) timeOfDay = 0.7; // Afternoon
    else if (hour >= 18 && hour < 22) timeOfDay = 0.6; // Evening
    else timeOfDay = 0.3; // Night

    return {
      timeOfDay,
      weather: 0.5, // Could be enhanced with weather API
      location: 0.5, // Could be enhanced with geolocation
      socialContext: 0.5 // Could be enhanced with calendar/social data
    };
  }

  // Generate AI insights
  private static generateAIInsights(
    emotions: Record<string, number>,
    imageData: any,
    context: any
  ): string[] {
    const insights: string[] = [];

    const sortedEmotions = Object.entries(emotions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Generate insights based on dominant emotions
    sortedEmotions.forEach(([emotion, score]) => {
      if (score > 0.3) {
        switch (emotion) {
          case 'happy':
            insights.push('You seem to be in a great mood! Perfect for upbeat music.');
            break;
          case 'energetic':
            insights.push('High energy detected! Let\'s find some motivating tracks.');
            break;
          case 'peaceful':
            insights.push('Calm and peaceful vibes. Chill music would complement this mood.');
            break;
          case 'romantic':
            insights.push('Romantic atmosphere detected. Love songs would be perfect.');
            break;
          case 'confident':
            insights.push('Confidence shining through! Power songs recommended.');
            break;
          case 'nostalgic':
            insights.push('Feeling nostalgic? Classic hits might hit the spot.');
            break;
        }
      }
    });

    // Context-based insights
    if (context.timeOfDay > 0.7) {
      insights.push('Great morning mood! Start your day with energetic tracks.');
    } else if (context.timeOfDay < 0.4) {
      insights.push('Late night vibes. Chill or introspective music recommended.');
    }

    return insights.slice(0, 3); // Return top 3 insights
  }

  // Generate mood-based recommendations
  private static generateMoodRecommendations(
    emotions: Record<string, number>,
    context: any
  ): string[] {
    const recommendations: string[] = [];

    const primaryEmotion = Object.entries(emotions)
      .sort(([, a], [, b]) => b - a)[0][0];

    // Music recommendations based on mood
    const musicRecommendations: Record<string, string[]> = {
      happy: ['Upbeat pop hits', 'Feel-good classics', 'Dance anthems'],
      energetic: ['High-energy workout', 'Electronic dance music', 'Rock anthems'],
      peaceful: ['Chill lo-fi', 'Acoustic sessions', 'Meditation music'],
      romantic: ['Love ballads', 'Romantic classics', 'Smooth jazz'],
      confident: ['Power anthems', 'Hip-hop hits', 'Rock classics'],
      nostalgic: ['Classic hits', 'Throwback favorites', 'Timeless classics'],
      sad: ['Emotional ballads', 'Comforting classics', 'Reflective music'],
      party: ['Party hits', 'Dance floor favorites', 'Club anthems'],
      aggressive: ['Heavy metal', 'Hard rock', 'Intense electronic'],
      lonely: ['Solo piano', 'Acoustic ballads', 'Intimate sessions'],
      attitude: ['Hip-hop', 'R&B hits', 'Urban favorites']
    };

    recommendations.push(...(musicRecommendations[primaryEmotion] || ['Mixed genres']));

    // Activity recommendations
    if (primaryEmotion === 'energetic') {
      recommendations.push('Perfect for workout or outdoor activities');
    } else if (primaryEmotion === 'peaceful') {
      recommendations.push('Great for studying or relaxation');
    } else if (primaryEmotion === 'party') {
      recommendations.push('Ideal for social gatherings and celebrations');
    } else if (primaryEmotion === 'romantic') {
      recommendations.push('Perfect for date nights or intimate moments');
    }

    return recommendations.slice(0, 4);
  }

  // Get default mood analysis
  private static getDefaultMoodAnalysis(): AdvancedMoodAnalysis {
    return {
      primaryMood: 'happy',
      confidence: 0.5,
      emotions: {
        happy: 0.5,
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
      },
      contextFactors: {
        timeOfDay: 0.5,
        weather: 0.5,
        location: 0.5,
        socialContext: 0.5
      },
      aiInsights: ['AI analysis temporarily unavailable'],
      recommendations: ['Try uploading a different photo for better recommendations']
    };
  }
}
