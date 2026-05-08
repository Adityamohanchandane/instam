// Real-time Emotion Detection Component
// AI-powered face expression analysis (Mock Implementation)

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface EmotionResult {
  emotion: string;
  confidence: number;
  expressions: {
    happy: number;
    sad: number;
    angry: number;
    surprised: number;
    neutral: number;
  };
  recommendations: string[];
}

export default function EmotionDetector() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EmotionResult | null>(null);
  const [error, setError] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Camera access error:', error);
      setError('Unable to access camera. Please allow camera permissions.');
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsDetecting(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const loadFaceDetectionModel = async () => {
    try {
      setIsLoading(true);
      console.log('🧠 Loading emotion detection model...');
      
      // Simulate model loading time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Emotion detection model loaded (mock)');
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error loading emotion detection model:', error);
      setError('Failed to load emotion detection model');
      setIsLoading(false);
    }
  };

  const startEmotionDetection = async () => {
    if (!cameraActive || !detectionRef.current) {
      await loadFaceDetectionModel();
    }
    
    setIsDetecting(true);
    setError('');
    detectEmotions();
  };

  const stopEmotionDetection = () => {
    setIsDetecting(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const detectEmotions = useCallback(async () => {
    if (!isDetecting || !videoRef.current) return;

    try {
      // Simulate emotion detection with random values
      const emotions = generateMockEmotions();
      
      setResult(emotions);
      
      // Draw mock face detection box
      drawMockFaceBox();

      // Continue detection
      if (isDetecting) {
        animationRef.current = requestAnimationFrame(detectEmotions);
      }
    } catch (error) {
      console.error('❌ Error detecting emotions:', error);
    }
  }, [isDetecting]);

  const generateMockEmotions = (): EmotionResult => {
  // Generate realistic mock emotion data
  const emotions = {
    happy: Math.random() * 0.3 + (Math.random() > 0.5 ? 0.4 : 0),
    sad: Math.random() * 0.3 + (Math.random() > 0.7 ? 0.4 : 0),
    angry: Math.random() * 0.2,
    surprised: Math.random() * 0.3,
    neutral: Math.random() * 0.3 + (Math.random() > 0.6 ? 0.3 : 0)
  };

  // Normalize to sum to 1
  const total = Object.values(emotions).reduce((sum, val) => sum + val, 0);
  Object.keys(emotions).forEach(key => {
    emotions[key as keyof typeof emotions] /= total;
  });

  // Find dominant emotion
  const dominantEmotion = Object.entries(emotions).reduce((a, b) => 
    emotions[a[0] as keyof typeof emotions] > emotions[b[0] as keyof typeof emotions] ? a : b
  );

  const emotion = dominantEmotion[0];
  const confidence = dominantEmotion[1];

  // Generate recommendations
  const recommendations = generateEmotionRecommendations(emotion);

  return {
    emotion,
    confidence,
    expressions: emotions,
    recommendations
  };
};

  const calculateHappyExpression = (keypoints: any[]): number => {
    // Simplified: check mouth corner position and eye crinkles
    const mouthLeft = keypoints.find(k => k.name === 'mouthLeft')?.y || 0;
    const mouthRight = keypoints.find(k => k.name === 'mouthRight')?.y || 0;
    const mouthCenter = keypoints.find(k => k.name === 'mouthCenter')?.y || 0;
    
    // Smile detection (mouth corners up)
    const smileScore = (mouthCenter - Math.min(mouthLeft, mouthRight)) / 10;
    return Math.max(0, Math.min(1, smileScore));
  };

  const calculateSadExpression = (keypoints: any[]): number => {
    // Simplified: check mouth downturn and eye position
    const mouthLeft = keypoints.find(k => k.name === 'mouthLeft')?.y || 0;
    const mouthRight = keypoints.find(k => k.name === 'mouthRight')?.y || 0;
    const mouthCenter = keypoints.find(k => k.name === 'mouthCenter')?.y || 0;
    
    // Frown detection (mouth corners down)
    const frownScore = (Math.min(mouthLeft, mouthRight) - mouthCenter) / 10;
    return Math.max(0, Math.min(1, frownScore));
  };

  const calculateAngryExpression = (keypoints: any[]): number => {
    // Simplified: check eyebrow position and mouth tension
    return Math.random() * 0.3; // Placeholder
  };

  const calculateSurprisedExpression = (keypoints: any[]): number => {
    // Simplified: check eye openness and mouth shape
    return Math.random() * 0.3; // Placeholder
  };

  const calculateNeutralExpression = (keypoints: any[]): number => {
    // Simplified: baseline expression
    return 0.4; // Placeholder
  };

  const generateEmotionRecommendations = (emotion: string): string[] => {
    const recommendations: Record<string, string[]> = {
      happy: [
        'Upbeat happy vibes!',
        'Feel-good music selected',
        'Perfect mood for celebration!'
      ],
      sad: [
        'Comforting melodies',
        'Emotional ballads ready',
        'Music to lift your spirits'
      ],
      angry: [
        'Release with rock music',
        'Powerful tracks to channel energy',
        'Intense beats for focus'
      ],
      surprised: [
        'Exciting and energetic tracks',
        'Surprise musical discoveries',
        'Upbeat unexpected hits'
      ],
      neutral: [
        'Balanced music selection',
        'Versatile playlist ready',
        'Music for any mood'
      ]
    };

    return recommendations[emotion] || recommendations.neutral;
  };

  const drawMockFaceBox = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw mock face detection box
    const boxX = canvas.width * 0.3;
    const boxY = canvas.height * 0.2;
    const boxWidth = canvas.width * 0.4;
    const boxHeight = canvas.height * 0.5;

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Draw emotion label
    if (result) {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(boxX, boxY - 30, 150, 30);
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.fillText(`${result.emotion} (${Math.round(result.confidence * 100)}%)`, boxX + 5, boxY - 10);
    }

    // Draw face landmarks (mock)
    ctx.fillStyle = '#10b981';
    const landmarks = [
      [boxX + boxWidth * 0.3, boxY + boxHeight * 0.3], // Left eye
      [boxX + boxWidth * 0.7, boxY + boxHeight * 0.3], // Right eye
      [boxX + boxWidth * 0.5, boxY + boxHeight * 0.5], // Nose
      [boxX + boxWidth * 0.5, boxY + boxHeight * 0.7], // Mouth
    ];

    landmarks.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const getEmotionEmoji = (emotion: string) => {
    const emotionEmojis: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprised: '😲',
      neutral: '😐'
    };
    return emotionEmojis[emotion] || '😐';
  };

  const getEmotionColor = (emotion: string) => {
    const emotionColors: Record<string, string> = {
      happy: 'bg-yellow-100 text-yellow-800',
      sad: 'bg-blue-100 text-blue-800',
      angry: 'bg-red-100 text-red-800',
      surprised: 'bg-purple-100 text-purple-800',
      neutral: 'bg-gray-100 text-gray-800'
    };
    return emotionColors[emotion] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="emotion-detector p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">😊 Real-time Emotion Detection</h2>
        <p className="text-gray-600">Let AI read your emotions and find perfect music!</p>
      </div>

      {/* Camera Section */}
      <div className="camera-section mb-6">
        <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: '360px' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {!cameraActive && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="text-4xl mb-4">📷</div>
                <p>Camera is off</p>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="animate-spin text-4xl mb-4">🧠</div>
                <p>Loading AI models...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="controls-section mb-6">
        <div className="flex justify-center space-x-4">
          {!cameraActive ? (
            <button
              onClick={startCamera}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              📷 Start Camera
            </button>
          ) : (
            <>
              {!isDetecting ? (
                <button
                  onClick={startEmotionDetection}
                  disabled={isLoading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  😊 Start Detection
                </button>
              ) : (
                <button
                  onClick={stopEmotionDetection}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  ⏹️ Stop Detection
                </button>
              )}
              <button
                onClick={stopCamera}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                📷 Stop Camera
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-section mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="results-section">
          <div className="mb-6">
            <div className={`inline-flex items-center space-x-3 px-4 py-2 rounded-full ${getEmotionColor(result.emotion)}`}>
              <span className="text-2xl">{getEmotionEmoji(result.emotion)}</span>
              <div className="text-left">
                <div className="font-semibold capitalize">{result.emotion}</div>
                <div className="text-sm opacity-75">
                  {Math.round(result.confidence * 100)}% confidence
                </div>
              </div>
            </div>
          </div>

          {/* Expression Bars */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">📊 Expression Analysis:</h4>
            <div className="space-y-2">
              {Object.entries(result.expressions).map(([emotion, score]) => (
                <div key={emotion} className="flex items-center space-x-3">
                  <span className="w-20 capitalize text-sm">{emotion}:</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${score * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {Math.round(score * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">🎵 Music Recommendations:</h4>
            <div className="space-y-2">
              {result.recommendations.map((rec, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-600">🎵</span>
                  <span className="text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!cameraActive && !isLoading && (
        <div className="instructions-section">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📝 How to use:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Click "Start Camera" to enable your webcam</li>
              <li>• Click "Start Detection" to begin emotion analysis</li>
              <li>• Make different facial expressions to see real-time detection</li>
              <li>• AI will suggest music based on your detected emotion</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
