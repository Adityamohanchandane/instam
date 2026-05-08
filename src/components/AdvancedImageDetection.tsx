// Advanced Image Detection Component
// Real-time object detection with AI-powered song recommendations

import React, { useState, useRef, useCallback } from 'react';

interface DetectedObject {
  class: string;
  score: number;
  bbox: [number, number, number, number];
  emoji: string;
  musicThemes: string[];
}

interface ImageAnalysisResult {
  objects: DetectedObject[];
  scene: string;
  mood: string;
  recommendations: string[];
  confidence: number;
  analysis: string;
}

export default function AdvancedImageDetection() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Object to emoji mapping
  const objectEmojis: Record<string, string> = {
    'person': '👤',
    'car': '🚗',
    'dog': '🐕',
    'cat': '🐈',
    'bird': '🐦',
    'horse': '🐴',
    'cow': '🐄',
    'sheep': '🐑',
    'elephant': '🐘',
    'bear': '🐻',
    'zebra': '🦓',
    'giraffe': '🦒',
    'lion': '🦁',
    'tiger': '🐅',
    'deer': '🦌',
    'monkey': '🐵',
    'bicycle': '🚲',
    'motorcycle': '🏍️',
    'airplane': '✈️',
    'bus': '🚌',
    'train': '🚂',
    'truck': '🚚',
    'boat': '⛵',
    'traffic light': '🚦',
    'fire hydrant': '🚨',
    'stop sign': '🛑',
    'parking meter': '🅿️',
    'bench': '🪑',
    'chair': '💺',
    'couch': '🛋️',
    'potted plant': '🪴',
    'bed': '🛏️',
    'dining table': '🍽️',
    'toilet': '🚽',
    'tv': '📺',
    'laptop': '💻',
    'mouse': '🖱️',
    'remote': '🎮',
    'keyboard': '⌨️',
    'cell phone': '📱',
    'microwave': '📦',
    'oven': '🔥',
    'toaster': '🍞',
    'sink': '🚰',
    'refrigerator': '❄️',
    'book': '📚',
    'clock': '🕰️',
    'vase': '🏺',
    'scissors': '✂️',
    'teddy bear': '🧸',
    'hair drier': '💨',
    'toothbrush': '🪥',
    'sun': '☀️',
    'moon': '🌙',
    'mountain': '⛰️',
    'tree': '🌳',
    'flower': '🌸',
    'beach': '🏖️',
    'ocean': '🌊',
    'building': '🏢',
    'house': '🏠',
    'bridge': '🌉',
    'road': '🛣️'
  };

  // Object to music themes mapping
  const objectMusicThemes: Record<string, string[]> = {
    'person': ['pop', 'romantic', 'party', 'dance'],
    'car': ['road trip', 'driving', 'rock', 'electronic'],
    'dog': ['happy', 'upbeat', 'family', 'playful'],
    'cat': ['chill', 'relaxing', 'jazz', 'ambient'],
    'bird': ['nature', 'peaceful', 'classical', 'morning'],
    'horse': ['country', 'folk', 'adventure', 'freedom'],
    'sun': ['happy', 'energetic', 'summer', 'tropical'],
    'moon': ['night', 'romantic', 'peaceful', 'ambient'],
    'mountain': ['adventure', 'epic', 'classical', 'nature'],
    'beach': ['summer', 'tropical', 'relaxing', 'party'],
    'ocean': ['peaceful', 'ambient', 'nature', 'meditation'],
    'tree': ['nature', 'peaceful', 'folk', 'acoustic'],
    'flower': ['romantic', 'peaceful', 'spring', 'happy'],
    'building': ['urban', 'electronic', 'modern', 'architectural'],
    'house': ['cozy', 'family', 'warm', 'comfort'],
    'bicycle': ['energetic', 'outdoor', 'adventure', 'fitness'],
    'airplane': ['travel', 'adventure', 'uplifting', 'discovery'],
    'book': ['study', 'focus', 'classical', 'instrumental'],
    'tv': ['entertainment', 'pop', 'drama', 'soundtrack'],
    'laptop': ['electronic', 'focus', 'productivity', 'ambient'],
    'phone': ['communication', 'social', 'pop', 'trending']
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setUploadedImage(imageUrl);
        analyzeImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageUrl: string) => {
    try {
      setIsAnalyzing(true);
      setError('');
      setResult(null);
      
      console.log('🔍 Analyzing image with AI...');

      // Load COCO-SSD model for object detection
      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      const model = await cocoSsd.load();
      
      // Create image element
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Detect objects
      const predictions = await model.detect(img);
      console.log('🎯 Detected objects:', predictions);

      // Process detected objects
      const detectedObjects: DetectedObject[] = predictions.map(prediction => ({
        class: prediction.class,
        score: prediction.score,
        bbox: prediction.bbox,
        emoji: objectEmojis[prediction.class] || '📷',
        musicThemes: objectMusicThemes[prediction.class] || ['general']
      }));

      // Analyze scene and mood
      const analysis = analyzeSceneAndMood(detectedObjects);
      
      // Generate recommendations
      const recommendations = generateRecommendations(detectedObjects, analysis);

      const result: ImageAnalysisResult = {
        objects: detectedObjects,
        scene: analysis.scene,
        mood: analysis.mood,
        recommendations,
        confidence: calculateOverallConfidence(detectedObjects),
        analysis: generateAnalysisText(detectedObjects, analysis)
      };

      setResult(result);
      
      // Draw detections on canvas
      drawDetections(img, detectedObjects);
      
      setIsAnalyzing(false);
      console.log('✅ Image analysis complete:', result);
    } catch (error) {
      console.error('❌ Error analyzing image:', error);
      setError('Failed to analyze image. Please try another image.');
      setIsAnalyzing(false);
    }
  };

  const analyzeSceneAndMood = (objects: DetectedObject[]) => {
    let scene = 'general';
    let mood = 'neutral';

    // Scene detection based on objects
    if (objects.some(obj => ['sun', 'beach', 'ocean'].includes(obj.class))) {
      scene = 'beach/nature';
      mood = 'happy/energetic';
    } else if (objects.some(obj => ['mountain', 'tree', 'flower'].includes(obj.class))) {
      scene = 'nature';
      mood = 'peaceful';
    } else if (objects.some(obj => ['building', 'car', 'road'].includes(obj.class))) {
      scene = 'urban';
      mood = 'energetic/modern';
    } else if (objects.some(obj => ['house', 'couch', 'bed'].includes(obj.class))) {
      scene = 'indoor';
      mood = 'cozy/comfortable';
    } else if (objects.some(obj => ['person', 'dog', 'cat'].includes(obj.class))) {
      scene = 'social';
      mood = 'friendly/warm';
    } else if (objects.some(obj => ['book', 'laptop', 'tv'].includes(obj.class))) {
      scene = 'entertainment';
      mood = 'focused/relaxed';
    }

    return { scene, mood };
  };

  const generateRecommendations = (objects: DetectedObject[], analysis: { scene: string; mood: string }): string[] => {
    const recommendations: string[] = [];
    const allThemes = new Set<string>();

    // Collect all music themes from detected objects
    objects.forEach(obj => {
      obj.musicThemes.forEach(theme => allThemes.add(theme));
    });

    // Generate recommendations based on themes
    if (allThemes.has('happy')) {
      recommendations.push('☀️ Happy upbeat tracks to match your mood');
    }
    if (allThemes.has('peaceful')) {
      recommendations.push('🧘 Peaceful melodies for relaxation');
    }
    if (allThemes.has('energetic')) {
      recommendations.push('⚡ High-energy songs for motivation');
    }
    if (allThemes.has('romantic')) {
      recommendations.push('💕 Romantic tunes for special moments');
    }
    if (allThemes.has('nature')) {
      recommendations.push('🌿 Nature-inspired sounds and melodies');
    }
    if (allThemes.has('urban')) {
      recommendations.push('🏙️ Urban beats and modern tracks');
    }
    if (allThemes.has('adventure')) {
      recommendations.push('🗺️ Adventure-themed music for exploration');
    }

    // Add scene-specific recommendations
    if (analysis.scene === 'beach/nature') {
      recommendations.push('🏖️ Perfect beach vibes and summer hits');
    } else if (analysis.scene === 'urban') {
      recommendations.push('🌆 City life soundtrack - urban beats');
    } else if (analysis.scene === 'indoor') {
      recommendations.push('🏠 Cozy home vibes and comfort music');
    }

    return recommendations.slice(0, 6);
  };

  const calculateOverallConfidence = (objects: DetectedObject[]): number => {
    if (objects.length === 0) return 0;
    const totalConfidence = objects.reduce((sum, obj) => sum + obj.score, 0);
    return totalConfidence / objects.length;
  };

  const generateAnalysisText = (objects: DetectedObject[], analysis: { scene: string; mood: string }): string => {
    const objectNames = objects.map(obj => `${obj.emoji} ${obj.class}`).join(', ');
    const confidence = calculateOverallConfidence(objects);
    
    return `I detected ${objects.length} object${objects.length !== 1 ? 's' : ''}: ${objectNames}. 
    This appears to be a ${analysis.scene} scene with a ${analysis.mood} mood. 
    Based on these elements, I've selected music that perfectly matches your environment and emotions! 
    (Confidence: ${Math.round(confidence * 100)}%)`;
  };

  const drawDetections = (img: HTMLImageElement, objects: DetectedObject[]) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Draw bounding boxes and labels
    objects.forEach(obj => {
      const [x, y, width, height] = obj.bbox;
      
      // Draw bounding box
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // Draw label background
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x, y - 25, 150, 25);

      // Draw label text
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.fillText(`${obj.emoji} ${obj.class} (${Math.round(obj.score * 100)}%)`, x + 5, y - 8);
    });
  };

  const resetAnalysis = () => {
    setUploadedImage('');
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="advanced-image-detection p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">🖼️ Advanced Image Detection</h2>
        <p className="text-gray-600">Upload an image and AI will detect objects to find perfect music!</p>
      </div>

      {/* Upload Section */}
      <div className="upload-section mb-6">
        <div className="flex justify-center">
          <label className="cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              📷 Upload Image for Analysis
            </div>
          </label>
        </div>
        
        {uploadedImage && (
          <div className="mt-4 text-center">
            <button
              onClick={resetAnalysis}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              🔄 Reset
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="loading-section text-center py-8">
          <div className="animate-spin text-4xl mb-4">🧠</div>
          <p className="text-lg">AI is analyzing your image...</p>
          <p className="text-sm text-gray-600">Detecting objects and analyzing scene</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-section mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="results-section">
          {/* Image with Detections */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">🎯 Detected Objects:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <img src={uploadedImage} alt="Uploaded" className="w-full rounded-lg" />
              </div>
              <div>
                <canvas
                  ref={canvasRef}
                  className="w-full rounded-lg border border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Detected Objects List */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">📋 Objects Found:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {result.objects.map((obj, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{obj.emoji}</span>
                    <div>
                      <div className="font-medium capitalize">{obj.class}</div>
                      <div className="text-sm text-gray-600">
                        {Math.round(obj.score * 100)}% confidence
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Themes: {obj.musicThemes.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scene Analysis */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">🎭 Scene Analysis:</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div>
                  <span className="font-medium">Scene:</span>
                  <span className="ml-2 capitalize">{result.scene}</span>
                </div>
                <div>
                  <span className="font-medium">Mood:</span>
                  <span className="ml-2 capitalize">{result.mood}</span>
                </div>
                <div>
                  <span className="font-medium">Confidence:</span>
                  <span className="ml-2">{Math.round(result.confidence * 100)}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-700">{result.analysis}</p>
            </div>
          </div>

          {/* Music Recommendations */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">🎵 AI Music Recommendations:</h3>
            <div className="space-y-2">
              {result.recommendations.map((rec, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                  <span className="text-green-600">🎵</span>
                  <span className="text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!uploadedImage && !isAnalyzing && (
        <div className="instructions-section">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📝 How it works:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Upload any image (photos, screenshots, etc.)</li>
              <li>• AI detects objects like animals, vehicles, nature, buildings</li>
              <li>• Analyzes scene type and mood</li>
              <li>• Generates personalized music recommendations</li>
              <li>• Works with pets, landscapes, city scenes, and more!</li>
            </ul>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <h5 className="font-medium mb-2">🎯 Try these examples:</h5>
              <div className="text-sm text-gray-700">
                <p>🐕 Pet photos → Happy, playful music</p>
                <p>⛰️ Mountain landscapes → Epic, adventurous tracks</p>
                <p>🏙️ City scenes → Urban, modern beats</p>
                <p>🏖️ Beach photos → Summer, tropical vibes</p>
                <p>🌅 Sunsets → Romantic, peaceful melodies</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
