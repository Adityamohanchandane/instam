// Advanced Photo Analyzer for Instam
// Analyzes photos for scene, mood, objects, and context to suggest perfect songs

export interface PhotoAnalysis {
  // Scene Analysis
  scene: {
    type: 'sunset' | 'sunrise' | 'night' | 'day' | 'indoor' | 'outdoor' | 'nature' | 'urban' | 'beach' | 'mountain' | 'party' | 'restaurant';
    lighting: 'bright' | 'dim' | 'natural' | 'artificial';
    colors: string[];
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  };
  
  // Object Detection
  objects: {
    people: number;
    faces: number;
    vehicles: Array<string>;
    nature: Array<string>;
    food: Array<string>;
    activities: Array<string>;
    emotions: Array<string>;
  };
  
  // Mood Analysis
  mood: {
    primary: string;
    secondary: string[];
    energy: number;
    valence: number;
    context: string;
  };
  
  // Music Suggestions
  music: {
    genres: string[];
    moods: string[];
    languages: string[];
    energy_level: number;
    personality_tags: string[];
  };
}

export class AdvancedPhotoAnalyzer {
  private model: any = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🧠 Loading AI models...');
      const tf = await import('@tensorflow/tfjs');
      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      
      await tf.ready();
      this.model = await cocoSsd.load();
      this.isInitialized = true;
      console.log('✅ AI models loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load AI models:', error);
      // Fallback to basic analysis
      this.isInitialized = true;
    }
  }

  async analyzePhoto(imageFile: File): Promise<PhotoAnalysis> {
    await this.initialize();

    try {
      // Create image element for analysis
      const img = await this.createImageElement(imageFile);
      
      // Analyze different aspects
      const [sceneAnalysis, objectDetection, moodAnalysis] = await Promise.all([
        this.analyzeScene(img),
        this.detectObjects(img),
        this.analyzeMood(img, imageFile)
      ]);

      // Generate music suggestions based on all analyses
      const musicSuggestions = this.generateMusicSuggestions(sceneAnalysis, objectDetection, moodAnalysis);

      return {
        scene: sceneAnalysis,
        objects: objectDetection,
        mood: moodAnalysis,
        music: musicSuggestions
      };

    } catch (error) {
      console.error('❌ Photo analysis failed:', error);
      return this.getFallbackAnalysis();
    }
  }

  private async createImageElement(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private async analyzeScene(img: HTMLImageElement): Promise<PhotoAnalysis['scene']> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Get image data for color analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const colors = this.extractColors(imageData);

    // Analyze lighting and time of day
    const brightness = this.calculateBrightness(imageData);
    const lighting = brightness > 0.6 ? 'bright' : brightness > 0.3 ? 'dim' : 'dark';
    
    // Detect scene type based on colors and brightness
    const sceneType = this.detectSceneType(colors, brightness);

    // Determine time of day
    const timeOfDay = this.detectTimeOfDay(colors, brightness);

    return {
      type: sceneType,
      lighting: lighting === 'dark' ? 'artificial' : lighting === 'bright' ? 'natural' : 'dim',
      colors,
      timeOfDay
    };
  }

  private async detectObjects(img: HTMLImageElement): Promise<PhotoAnalysis['objects']> {
    if (!this.model) {
      return this.getFallbackObjectDetection();
    }

    try {
      const predictions = await this.model.detect(img);
      
      const objects = {
        people: predictions.filter(p => p.class === 'person').length,
        faces: 0, // Would need face detection model
        vehicles: predictions.filter(p => ['car', 'truck', 'motorcycle', 'bicycle'].includes(p.class)).map(p => p.class),
        nature: predictions.filter(p => ['tree', 'flower', 'plant', 'animal'].includes(p.class)).map(p => p.class),
        food: predictions.filter(p => ['banana', 'apple', 'sandwich', 'pizza', 'cake'].includes(p.class)).map(p => p.class),
        activities: predictions.filter(p => ['sports ball', 'skateboard', 'surfboard'].includes(p.class)).map(p => p.class),
        emotions: [] // Would need emotion detection model
      };

      return objects;
    } catch (error) {
      console.error('Object detection failed:', error);
      return this.getFallbackObjectDetection();
    }
  }

  private async analyzeMood(img: HTMLImageElement, file: File): Promise<PhotoAnalysis['mood']> {
    // Analyze based on colors, composition, and metadata
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const colors = this.extractColors(imageData);
    const brightness = this.calculateBrightness(imageData);

    // Mood analysis based on colors and brightness
    let primaryMood = 'neutral';
    let secondaryMoods: string[] = [];
    let energy = 5;
    let valence = 5;
    let context = '';

    // Analyze color psychology
    if (colors.includes('warm_red') || colors.includes('orange')) {
      primaryMood = 'energetic';
      secondaryMoods.push('passionate', 'excited');
      energy = 8;
      valence = 7;
      context = 'vibrant and energetic';
    } else if (colors.includes('blue') || colors.includes('cool_blue')) {
      primaryMood = 'calm';
      secondaryMoods.push('peaceful', 'serene');
      energy = 3;
      valence = 6;
      context = 'peaceful and relaxing';
    } else if (colors.includes('purple') || colors.includes('pink')) {
      primaryMood = 'romantic';
      secondaryMoods.push('dreamy', 'creative');
      energy = 5;
      valence = 7;
      context = 'romantic and dreamy';
    } else if (brightness < 0.3) {
      primaryMood = 'melancholic';
      secondaryMoods.push('intimate', 'contemplative');
      energy = 2;
      valence = 3;
      context = 'intimate and thoughtful';
    } else if (colors.includes('yellow') || colors.includes('bright_green')) {
      primaryMood = 'happy';
      secondaryMoods.push('optimistic', 'joyful');
      energy = 7;
      valence = 9;
      context = 'happy and optimistic';
    }

    // Check file name for additional context
    const fileName = file.name.toLowerCase();
    if (fileName.includes('sunset') || fileName.includes('evening')) {
      primaryMood = 'romantic';
      context = 'beautiful sunset moment';
    } else if (fileName.includes('party') || fileName.includes('celebration')) {
      primaryMood = 'energetic';
      energy = 9;
      context = 'celebration and fun';
    }

    return {
      primary: primaryMood,
      secondary: secondaryMoods,
      energy,
      valence,
      context
    };
  }

  private generateMusicSuggestions(
    scene: PhotoAnalysis['scene'],
    objects: PhotoAnalysis['objects'],
    mood: PhotoAnalysis['mood']
  ): PhotoAnalysis['music'] {
    const genres: string[] = [];
    const moods: string[] = [];
    const languages: string[] = [];
    const personality_tags: string[] = [];

    // Genre suggestions based on scene
    switch (scene.type) {
      case 'sunset':
      case 'sunrise':
        genres.push('Romantic', 'Acoustic', 'Lo-fi');
        moods.push('romantic', 'peaceful', 'dreamy');
        languages.push('Hindi', 'English');
        personality_tags.push('romantic', 'thoughtful', 'sensitive');
        break;
      
      case 'party':
      case 'night':
        genres.push('Pop', 'EDM', 'Hip-Hop');
        moods.push('energetic', 'party', 'upbeat');
        languages.push('Hindi', 'English', 'Punjabi');
        personality_tags.push('social', 'energetic', 'confident');
        break;
      
      case 'nature':
      case 'beach':
      case 'mountain':
        genres.push('Folk', 'Classical', 'Ambient');
        moods.push('peaceful', 'natural', 'calm');
        languages.push('Marathi', 'Hindi', 'Tamil');
        personality_tags.push('nature-loving', 'calm', 'spiritual');
        break;
      
      case 'urban':
        genres.push('Hip-Hop', 'R&B', 'Pop');
        moods.push('cool', 'urban', 'confident');
        languages.push('English', 'Hindi');
        personality_tags.push('modern', 'trendy', 'confident');
        break;
      
      case 'indoor':
        if (objects.food.length > 0) {
          genres.push('Jazz', 'Lo-fi', 'Café Music');
          moods.push('cozy', 'relaxed', 'comfortable');
          personality_tags.push('comfort-loving', 'cozy', 'relaxed');
        } else {
          genres.push('Pop', 'R&B');
          moods.push('personal', 'intimate');
          personality_tags.push('personal', 'intimate', 'thoughtful');
        }
        break;
    }

    // Add mood-based suggestions
    if (mood.primary === 'happy') {
      genres.push('Pop', 'Dance', 'Bollywood');
      moods.push('upbeat', 'joyful', 'celebratory');
    } else if (mood.primary === 'romantic') {
      genres.push('Romantic', 'Ballads', 'Ghazals');
      moods.push('love', 'intimate', 'emotional');
    } else if (mood.primary === 'energetic') {
      genres.push('Rock', 'EDM', 'Bhangra');
      moods.push('powerful', 'motivational', 'intense');
    }

    // People-based adjustments
    if (objects.people > 2) {
      genres.push('Party', 'Bollywood', 'Pop');
      moods.push('social', 'celebratory');
      personality_tags.push('social', 'extroverted');
    } else if (objects.people === 1) {
      genres.push('Acoustic', 'Ballads', 'Indie');
      moods.push('personal', 'introspective');
      personality_tags.push('introverted', 'thoughtful');
    }

    // Time-based adjustments
    switch (scene.timeOfDay) {
      case 'morning':
        genres.push('Classical', 'Spiritual', 'Morning Ragas');
        moods.push('fresh', 'optimistic', 'peaceful');
        break;
      case 'evening':
        genres.push('Romantic', 'Jazz', 'Lo-fi');
        moods.push('relaxing', 'romantic', 'cozy');
        break;
      case 'night':
        genres.push('EDM', 'Party', 'Club');
        moods.push('energetic', 'mysterious', 'party');
        break;
    }

    return {
      genres: [...new Set(genres)], // Remove duplicates
      moods: [...new Set(moods)],
      languages: [...new Set(languages)],
      energy_level: mood.energy,
      personality_tags: [...new Set(personality_tags)]
    };
  }

  // Helper methods
  private extractColors(imageData: ImageData): string[] {
    const data = imageData.data;
    const colors: string[] = [];
    
    // Sample every 10th pixel for performance
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const color = this.classifyColor(r, g, b);
      if (!colors.includes(color)) {
        colors.push(color);
      }
    }
    
    return colors.slice(0, 5); // Return top 5 colors
  }

  private classifyColor(r: number, g: number, b: number): string {
    const brightness = (r + g + b) / 3;
    const warmth = r - b;
    
    if (brightness > 200) return 'white';
    if (brightness < 50) return 'black';
    
    if (warmth > 50) return 'warm_red';
    if (warmth > 20) return 'orange';
    if (warmth < -50) return 'cool_blue';
    if (warmth < -20) return 'blue';
    
    if (g > Math.max(r, b) + 30) return 'bright_green';
    if (r > Math.max(g, b) + 30) return 'red';
    if (b > Math.max(r, g) + 30) return 'purple';
    
    if (r > 150 && g > 100 && b < 100) return 'yellow';
    if (r > 150 && g < 100 && b > 100) return 'pink';
    
    return 'neutral';
  }

  private calculateBrightness(imageData: ImageData): number {
    const data = imageData.data;
    let totalBrightness = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;
    }
    
    return totalBrightness / (data.length / 4) / 255;
  }

  private detectSceneType(colors: string[], brightness: number): PhotoAnalysis['scene']['type'] {
    const hasBlue = colors.includes('blue') || colors.includes('cool_blue');
    const hasWarm = colors.includes('warm_red') || colors.includes('orange') || colors.includes('yellow');
    const hasGreen = colors.includes('bright_green');
    
    if (hasWarm && brightness < 0.5) {
      return 'sunset';
    } else if (hasWarm && brightness > 0.8) {
      return 'sunrise';
    } else if (brightness < 0.3) {
      return 'night';
    } else if (hasBlue && hasGreen) {
      return 'nature';
    } else if (hasBlue && !hasGreen) {
      return 'beach';
    } else if (hasGreen && !hasBlue) {
      return 'mountain';
    } else if (brightness > 0.7) {
      return 'day';
    } else {
      return 'indoor';
    }
  }

  private detectTimeOfDay(colors: string[], brightness: number): PhotoAnalysis['scene']['timeOfDay'] {
    const hasWarm = colors.includes('warm_red') || colors.includes('orange');
    const hasBlue = colors.includes('cool_blue');
    
    if (hasWarm && brightness < 0.6) return 'evening';
    if (hasWarm && brightness > 0.8) return 'morning';
    if (hasBlue && brightness < 0.4) return 'night';
    if (brightness > 0.7) return 'afternoon';
    
    return 'afternoon'; // Default
  }

  private getFallbackObjectDetection(): PhotoAnalysis['objects'] {
    return {
      people: 1, // Assume at least one person
      faces: 1,
      vehicles: [],
      nature: [],
      food: [],
      activities: [],
      emotions: ['happy', 'neutral']
    };
  }

  private getFallbackAnalysis(): PhotoAnalysis {
    return {
      scene: {
        type: 'indoor',
        lighting: 'natural',
        colors: ['neutral'],
        timeOfDay: 'afternoon'
      },
      objects: {
        people: 1,
        faces: 1,
        vehicles: [],
        nature: [],
        food: [],
        activities: [],
        emotions: ['happy']
      },
      mood: {
        primary: 'happy',
        secondary: ['positive'],
        energy: 5,
        valence: 7,
        context: 'positive moment'
      },
      music: {
        genres: ['Pop', 'Happy'],
        moods: ['happy', 'upbeat'],
        languages: ['Hindi', 'English'],
        energy_level: 5,
        personality_tags: ['happy', 'positive']
      }
    };
  }
}

// Export singleton instance
export const photoAnalyzer = new AdvancedPhotoAnalyzer();

// Helper function for quick analysis
export async function analyzePhotoForMusic(imageFile: File): Promise<PhotoAnalysis> {
  return await photoAnalyzer.analyzePhoto(imageFile);
}
