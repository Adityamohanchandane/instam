// Real AI Image Analyzer for Instam
// Production-grade computer vision pipeline using TensorFlow.js

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { imageAnalysisCache } from './smart-cache';
import type { MoodType, SceneType, ColorTone } from './types';

export interface DetectedObject {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export interface FaceAnalysis {
  detected: boolean;
  count: number;
  gender?: 'male' | 'female' | 'unknown';
  ageRange?: string;
  emotion?: 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral' | 'fear' | 'disgust';
  confidence: number;
}

export interface SceneAnalysis {
  type: SceneType;
  confidence: number;
  lighting: 'bright' | 'dim' | 'dark' | 'natural';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  environment: 'indoor' | 'outdoor' | 'unknown';
}

export interface ColorAnalysis {
  dominantColors: string[];
  colorTone: ColorTone;
  warmth: number; // 0-1, higher = warmer
  brightness: number; // 0-1
  saturation: number; // 0-1
}

export interface MoodAnalysis {
  primary: MoodType;
  secondary: MoodType[];
  confidence: number;
  energy: number; // 1-10
  valence: number; // 0-1, positive/negative
  reasoning: string[];
}

export interface RealImageAnalysis {
  objects: DetectedObject[];
  faces: FaceAnalysis;
  scene: SceneAnalysis;
  colors: ColorAnalysis;
  mood: MoodAnalysis;
  timestamp: number;
  processingTime: number;
  aiProvider: 'tensorflow' | 'fallback';
}

export class RealImageAnalyzer {
  private cocoModel: cocoSsd.ObjectDetection | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      console.log('🧠 Loading TensorFlow.js models...');
      
      // Initialize TensorFlow.js backend
      await tf.ready();
      console.log('✅ TensorFlow.js backend ready');

      // Load COCO-SSD model for object detection
      console.log('📦 Loading COCO-SSD model...');
      this.cocoModel = await cocoSsd.load();
      console.log('✅ COCO-SSD model loaded');

      this.isInitialized = true;
      console.log('✅ Real Image Analyzer initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI models:', error);
      console.log('⚠️ Will use fallback analysis');
      this.isInitialized = true; // Allow fallback mode
    }
  }

  async analyzeImage(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<RealImageAnalysis> {
    const startTime = performance.now();
    
    await this.initialize();

    // Generate cache key based on image data
    const cacheKey = await this.generateImageCacheKey(imageElement);
    
    // Check cache
    const cached = imageAnalysisCache.get<RealImageAnalysis>(cacheKey);
    if (cached) {
      console.log('✅ Image analysis cache hit');
      return cached;
    }

    try {
      // Run all analyses in parallel where possible
      const [objectDetection, sceneAnalysis, colorAnalysis] = await Promise.all([
        this.detectObjects(imageElement),
        this.analyzeScene(imageElement),
        this.analyzeColors(imageElement)
      ]);

      // Face analysis (simplified - would need face-api.js for full implementation)
      const faceAnalysis = this.analyzeFacesFromObjects(objectDetection);

      // Mood analysis based on all factors
      const moodAnalysis = this.analyzeMood(sceneAnalysis, colorAnalysis, objectDetection, faceAnalysis);

      const processingTime = performance.now() - startTime;

      const result = {
        objects: objectDetection,
        faces: faceAnalysis,
        scene: sceneAnalysis,
        colors: colorAnalysis,
        mood: moodAnalysis,
        timestamp: Date.now(),
        processingTime,
        aiProvider: (this.cocoModel ? 'tensorflow' : 'fallback') as RealImageAnalysis['aiProvider']
      };

      // Cache the result
      imageAnalysisCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('❌ Image analysis failed:', error);
      return this.getFallbackAnalysis(imageElement);
    }
  }

  // Generate cache key from image
  private async generateImageCacheKey(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return `analysis:${Date.now()}`;
    }

    canvas.width = 32; // Small size for fingerprint
    canvas.height = 32;
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simple hash of pixel data
    let hash = 0;
    for (let i = 0; i < data.length; i += 4) {
      hash = ((hash << 5) - hash) + data[i];
      hash |= 0;
    }

    return `analysis:${Math.abs(hash)}`;
  }

  private async detectObjects(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<DetectedObject[]> {
    if (!this.cocoModel) {
      return [];
    }

    try {
      const predictions = await this.cocoModel.detect(imageElement);
      
      // Filter and format predictions
      return predictions
        .filter(pred => pred.score > 0.5) // Only high-confidence detections
        .map(pred => ({
          class: pred.class,
          score: pred.score,
          bbox: pred.bbox as [number, number, number, number]
        }));
    } catch (error) {
      console.error('Object detection failed:', error);
      return [];
    }
  }

  private analyzeFacesFromObjects(objects: DetectedObject[]): FaceAnalysis {
    const personDetections = objects.filter(obj => obj.class === 'person');
    
    if (personDetections.length === 0) {
      return {
        detected: false,
        count: 0,
        confidence: 0
      };
    }

    // Simplified face analysis (real implementation would use face-api.js)
    const avgConfidence = personDetections.reduce((sum, obj) => sum + obj.score, 0) / personDetections.length;

    return {
      detected: true,
      count: personDetections.length,
      gender: 'unknown', // Would require face-api.js
      ageRange: 'unknown', // Would require face-api.js
      emotion: 'neutral', // Would require face-api.js
      confidence: avgConfidence
    };
  }

  private async analyzeScene(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<SceneAnalysis> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return this.getDefaultScene();
    }

    canvas.width = 300; // Resize for performance
    canvas.height = 300;
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const colorAnalysis = this.analyzeColorData(imageData);

    // Determine scene type based on colors and detected objects
    const sceneType = this.classifyScene(colorAnalysis);
    
    // Determine lighting
    const lighting = this.classifyLighting(colorAnalysis.brightness);
    
    // Determine time of day
    const timeOfDay = this.classifyTimeOfDay(colorAnalysis);
    
    // Determine environment
    const environment = this.classifyEnvironment(colorAnalysis, sceneType);

    return {
      type: sceneType,
      confidence: 0.7, // Base confidence, would be higher with ML model
      lighting,
      timeOfDay,
      environment
    };
  }

  private async analyzeColors(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<ColorAnalysis> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return this.getDefaultColors();
    }

    canvas.width = 100; // Small size for color analysis
    canvas.height = 100;
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const colorData = this.analyzeColorData(imageData);

    return {
      dominantColors: colorData.dominantColors,
      colorTone: this.classifyColorTone(colorData),
      warmth: colorData.warmth,
      brightness: colorData.brightness,
      saturation: colorData.saturation
    };
  }

  private analyzeColorData(imageData: ImageData): {
    dominantColors: string[];
    brightness: number;
    warmth: number;
    saturation: number;
  } {
    const data = imageData.data;
    let totalBrightness = 0;
    let totalWarmth = 0;
    let totalSaturation = 0;
    const colorCounts: Record<string, number> = {};
    let pixelCount = 0;

    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Brightness
      const brightness = (r + g + b) / 3 / 255;
      totalBrightness += brightness;

      // Warmth (red - blue)
      const warmth = (r - b) / 255;
      totalWarmth += warmth;

      // Saturation
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      totalSaturation += saturation;

      // Color classification
      const color = this.classifyPixelColor(r, g, b);
      colorCounts[color] = (colorCounts[color] || 0) + 1;

      pixelCount++;
    }

    // Get dominant colors
    const sortedColors = Object.entries(colorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([color]) => color);

    return {
      dominantColors: sortedColors,
      brightness: totalBrightness / pixelCount,
      warmth: (totalWarmth / pixelCount + 1) / 2, // Normalize to 0-1
      saturation: totalSaturation / pixelCount
    };
  }

  private classifyPixelColor(r: number, g: number, b: number): string {
    const brightness = (r + g + b) / 3;
    const warmth = r - b;

    if (brightness > 230) return 'white';
    if (brightness < 30) return 'black';
    
    if (warmth > 80) return 'red';
    if (warmth > 40) return 'orange';
    if (warmth < -80) return 'blue';
    if (warmth < -40) return 'cool_blue';
    
    if (g > Math.max(r, b) + 30) return 'green';
    if (r > Math.max(g, b) + 30) return 'red';
    if (b > Math.max(r, g) + 30) return 'purple';
    
    if (r > 180 && g > 140 && b < 100) return 'yellow';
    if (r > 180 && g < 100 && b > 100) return 'pink';
    
    return 'neutral';
  }

  private classifyScene(colorData: { brightness: number; warmth: number; dominantColors: string[] }): SceneType {
    const { brightness, warmth, dominantColors } = colorData;
    
    const hasBlue = dominantColors.some(c => c.includes('blue'));
    const hasWarm = dominantColors.some(c => ['red', 'orange', 'yellow'].includes(c));
    const hasGreen = dominantColors.some(c => c.includes('green'));
    const hasPink = dominantColors.some(c => c.includes('pink'));

    // Scene classification logic
    if (hasWarm && brightness < 0.5 && warmth > 0.3) return 'beach'; // Sunset
    if (hasWarm && brightness > 0.7) return 'morning'; // Sunrise/bright
    if (brightness < 0.3) return 'night';
    if (hasBlue && hasGreen) return 'nature';
    if (hasBlue && !hasGreen) return 'beach';
    if (hasGreen && !hasBlue) return 'nature';
    if (hasPink && brightness > 0.5) return 'couple'; // Romantic tones
    if (brightness > 0.7 && !hasGreen) return 'city'; // Bright urban
    if (brightness < 0.5 && warmth < 0.3) return 'rain'; // Moody/cool
    
    return 'selfie'; // Default
  }

  private classifyLighting(brightness: number): 'bright' | 'dim' | 'dark' | 'natural' {
    if (brightness > 0.7) return 'bright';
    if (brightness > 0.4) return 'natural';
    if (brightness > 0.2) return 'dim';
    return 'dark';
  }

  private classifyTimeOfDay(colorData: { brightness: number; warmth: number }): 'morning' | 'afternoon' | 'evening' | 'night' {
    const { brightness, warmth } = colorData;
    
    if (warmth > 0.4 && brightness < 0.6) return 'evening'; // Warm + dim
    if (warmth > 0.4 && brightness > 0.7) return 'morning'; // Warm + bright
    if (brightness < 0.3) return 'night';
    return 'afternoon';
  }

  private classifyEnvironment(colorData: { brightness: number; dominantColors: string[] }, sceneType: SceneType): 'indoor' | 'outdoor' | 'unknown' {
    const { brightness, dominantColors } = colorData;
    
    // Outdoor scenes
    if (['nature', 'beach', 'city', 'travel', 'morning'].includes(sceneType)) {
      return 'outdoor';
    }
    
    // Indoor indicators
    if (brightness < 0.5 && dominantColors.includes('neutral')) {
      return 'indoor';
    }
    
    return 'unknown';
  }

  private classifyColorTone(colorData: { brightness: number; warmth: number; saturation: number }): ColorTone {
    const { brightness, warmth, saturation } = colorData;
    
    if (brightness < 0.3) return 'dark';
    if (saturation > 0.6 && warmth < 0.4) return 'neon';
    if (saturation > 0.5) return 'vibrant';
    if (warmth > 0.6 && brightness > 0.5) return 'golden';
    if (warmth < 0.4) return 'cool';
    if (brightness < 0.5) return 'moody';
    return 'warm';
  }

  private analyzeMood(
    scene: SceneAnalysis,
    colors: ColorAnalysis,
    objects: DetectedObject[],
    faces: FaceAnalysis
  ): MoodAnalysis {
    const reasoning: string[] = [];
    const moodScores: Record<MoodType, number> = {
      happy: 0,
      sad: 0,
      attitude: 0,
      romantic: 0,
      energetic: 0,
      peaceful: 0,
      nostalgic: 0,
      aggressive: 0,
      confident: 0,
      lonely: 0,
      party: 0
    };

    // Scene-based mood
    switch (scene.type) {
      case 'beach':
        moodScores.peaceful += 0.4;
        moodScores.happy += 0.3;
        moodScores.romantic += 0.3;
        reasoning.push('Beach scene suggests peaceful, happy vibes');
        break;
      case 'night':
        moodScores.attitude += 0.4;
        moodScores.lonely += 0.3;
        moodScores.romantic += 0.3;
        reasoning.push('Night scene suggests attitude or romantic mood');
        break;
      case 'party':
        moodScores.party += 0.5;
        moodScores.energetic += 0.5;
        reasoning.push('Party scene detected - high energy mood');
        break;
      case 'nature':
        moodScores.peaceful += 0.5;
        moodScores.happy += 0.3;
        moodScores.nostalgic += 0.2;
        reasoning.push('Nature scene suggests peaceful, nostalgic mood');
        break;
      case 'couple':
        moodScores.romantic += 0.6;
        moodScores.happy += 0.4;
        reasoning.push('Couple scene indicates romantic mood');
        break;
      case 'city':
        moodScores.confident += 0.4;
        moodScores.energetic += 0.3;
        moodScores.attitude += 0.3;
        reasoning.push('Urban scene suggests confident, energetic mood');
        break;
      case 'gym':
        moodScores.energetic += 0.6;
        moodScores.confident += 0.4;
        reasoning.push('Gym/fitness scene indicates high energy');
        break;
      case 'rain':
        moodScores.nostalgic += 0.4;
        moodScores.sad += 0.3;
        moodScores.romantic += 0.3;
        reasoning.push('Rain scene suggests nostalgic, romantic mood');
        break;
      default:
        moodScores.happy += 0.5;
        moodScores.peaceful += 0.3;
        reasoning.push('General scene suggests positive mood');
    }

    // Color-based mood
    if (colors.colorTone === 'dark' || colors.colorTone === 'moody') {
      moodScores.attitude += 0.3;
      moodScores.lonely += 0.2;
      reasoning.push('Dark/moody tones suggest attitude or lonely mood');
    }
    if (colors.colorTone === 'golden') {
      moodScores.romantic += 0.3;
      moodScores.peaceful += 0.3;
      reasoning.push('Golden tones indicate romantic, peaceful mood');
    }
    if (colors.colorTone === 'vibrant' || colors.colorTone === 'neon') {
      moodScores.energetic += 0.4;
      moodScores.party += 0.3;
      reasoning.push('Vibrant colors suggest energetic, party mood');
    }
    if (colors.colorTone === 'cool') {
      moodScores.peaceful += 0.3;
      moodScores.sad += 0.2;
      reasoning.push('Cool tones suggest peaceful or sad mood');
    }

    // Object-based mood
    const personCount = objects.filter(o => o.class === 'person').length;
    if (personCount > 2) {
      moodScores.party += 0.3;
      moodScores.happy += 0.2;
      reasoning.push('Multiple people detected - social, party mood');
    } else if (personCount === 1) {
      moodScores.confident += 0.2;
      moodScores.lonely += 0.1;
      reasoning.push('Single person detected - confident or introspective mood');
    }

    // Find primary and secondary moods
    const sortedMoods = Object.entries(moodScores)
      .sort(([, a], [, b]) => b - a);
    
    const primaryMood = sortedMoods[0][0] as MoodType;
    const primaryScore = sortedMoods[0][1];
    const secondaryMoods = sortedMoods
      .slice(1, 4)
      .filter(([, score]) => score > 0.2)
      .map(([mood]) => mood as MoodType);

    // Calculate energy and valence
    const energyMap: Record<MoodType, number> = {
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

    const valenceMap: Record<MoodType, number> = {
      happy: 0.9,
      peaceful: 0.7,
      romantic: 0.8,
      confident: 0.8,
      energetic: 0.7,
      party: 0.8,
      nostalgic: 0.4,
      sad: 0.2,
      lonely: 0.3,
      attitude: 0.6,
      aggressive: 0.3
    };

    const energy = energyMap[primaryMood] || 5;
    const valence = valenceMap[primaryMood] || 0.5;

    return {
      primary: primaryMood,
      secondary: secondaryMoods,
      confidence: Math.min(primaryScore, 1),
      energy,
      valence,
      reasoning: reasoning.slice(0, 3)
    };
  }

  private getDefaultScene(): SceneAnalysis {
    return {
      type: 'selfie',
      confidence: 0.3,
      lighting: 'natural',
      timeOfDay: 'afternoon',
      environment: 'unknown'
    };
  }

  private getDefaultColors(): ColorAnalysis {
    return {
      dominantColors: ['neutral'],
      colorTone: 'warm',
      warmth: 0.5,
      brightness: 0.5,
      saturation: 0.5
    };
  }

  private getFallbackAnalysis(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): RealImageAnalysis {
    console.log('⚠️ Using fallback analysis');
    
    return {
      objects: [],
      faces: {
        detected: false,
        count: 0,
        confidence: 0
      },
      scene: this.getDefaultScene(),
      colors: this.getDefaultColors(),
      mood: {
        primary: 'happy',
        secondary: ['peaceful'],
        confidence: 0.3,
        energy: 5,
        valence: 0.7,
        reasoning: ['Using fallback analysis - AI models not available']
      },
      timestamp: Date.now(),
      processingTime: 0,
      aiProvider: 'fallback'
    };
  }
}

// Export singleton instance
export const realImageAnalyzer = new RealImageAnalyzer();

// Helper function for quick analysis from file
export async function analyzeImageFile(file: File): Promise<RealImageAnalysis> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const analysis = await realImageAnalyzer.analyzeImage(img);
        resolve(analysis);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Helper function for quick analysis from URL
export async function analyzeImageUrl(url: string): Promise<RealImageAnalysis> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        const analysis = await realImageAnalyzer.analyzeImage(img);
        resolve(analysis);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}
