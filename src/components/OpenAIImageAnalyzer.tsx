// OpenAI Image Analyzer Component
// Upload any image and AI will analyze it to suggest perfect music!

import React, { useState, useRef } from 'react';

interface OpenAIAnalysis {
  what_ai_sees: string;
  description: string;
  mood: string;
  genre: string;
  energy_level: number;
  suggested_songs: string[];
  scene_type: string;
}

interface AnalysisResponse {
  success: boolean;
  analysis: OpenAIAnalysis;
  ai_provider: string;
  timestamp: string;
  note?: string;
}

export default function OpenAIImageAnalyzer() {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setSelectedImage(imageData);
        setResult(null);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError('');
      setResult(null);

      console.log('📤 Uploading image for OpenAI analysis...');

      const response = await fetch('http://localhost:3001/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: selectedImage
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Analysis received:', data);
      
      setResult(data);
      setIsAnalyzing(false);
    } catch (err) {
      console.error('❌ Analysis error:', err);
      setError('Failed to analyze image. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage('');
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      energetic: '⚡',
      peaceful: '🧘',
      romantic: '💕',
      chill: '😎',
      party: '🎉',
      confident: '💪',
      mysterious: '🔮',
      nostalgic: '📻'
    };
    return moodEmojis[mood] || '🎵';
  };

  const getMoodColor = (mood: string) => {
    const moodColors: Record<string, string> = {
      happy: 'bg-yellow-100 text-yellow-800',
      sad: 'bg-blue-100 text-blue-800',
      energetic: 'bg-red-100 text-red-800',
      peaceful: 'bg-green-100 text-green-800',
      romantic: 'bg-pink-100 text-pink-800',
      chill: 'bg-cyan-100 text-cyan-800',
      party: 'bg-orange-100 text-orange-800',
      confident: 'bg-purple-100 text-purple-800',
      mysterious: 'bg-indigo-100 text-indigo-800',
      nostalgic: 'bg-amber-100 text-amber-800'
    };
    return moodColors[mood] || 'bg-gray-100 text-gray-800';
  };

  const getEnergyBarColor = (level: number) => {
    if (level <= 3) return 'bg-green-500';
    if (level <= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="openai-image-analyzer p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">🤖 OpenAI Image Analysis</h2>
        <p className="text-gray-600 text-lg">Upload any photo and AI will analyze it to suggest perfect music!</p>
      </div>

      {/* Upload Section */}
      <div className="upload-section mb-8">
        <div className="flex flex-col items-center space-y-4">
          <label className="cursor-pointer w-full max-w-md">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all">
              <div className="text-5xl mb-4">📷</div>
              <p className="text-lg font-medium text-gray-700">Click to upload an image</p>
              <p className="text-sm text-gray-500 mt-2">Supports JPG, PNG, GIF, WebP</p>
            </div>
          </label>

          {selectedImage && (
            <div className="w-full max-w-md">
              <img 
                src={selectedImage} 
                alt="Selected" 
                className="w-full rounded-lg shadow-md"
              />
            </div>
          )}
        </div>

        {selectedImage && (
          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={analyzeImage}
              disabled={isAnalyzing}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-lg"
            >
              {isAnalyzing ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">🧠</span>
                  AI Analyzing...
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="mr-2">🤖</span>
                  Analyze with AI
                </span>
              )}
            </button>
            <button
              onClick={resetAnalysis}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              🔄 Reset
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-section mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {result && result.analysis && (
        <div className="results-section space-y-6">
          {/* AI Provider Badge */}
          <div className="text-center">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
              result.ai_provider === 'openai'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {result.ai_provider === 'openai' ? '🤖 Powered by OpenAI GPT-4' : '🎭 Demo Mode (Add OpenAI API Key)'}
            </span>
          </div>

          {/* What AI Sees - Prominent Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg shadow-lg">
            <h3 className="font-bold text-xl mb-3 flex items-center">
              <span className="mr-2">👁️</span> AI ने ही इमेज analyze केली
            </h3>
            <p className="text-lg leading-relaxed">{result.analysis.what_ai_sees || result.analysis.description}</p>
          </div>

          {/* Image Description */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              <span className="mr-2">📝</span> AI Image Description
            </h3>
            <p className="text-gray-700 leading-relaxed">{result.analysis.description}</p>
          </div>

          {/* Mood & Genre */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-3xl mb-2">{getMoodEmoji(result.analysis.mood)}</div>
              <div className="text-sm text-gray-600 mb-1">Detected Mood</div>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${getMoodColor(result.analysis.mood)}`}>
                {result.analysis.mood}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-3xl mb-2">🎵</div>
              <div className="text-sm text-gray-600 mb-1">Music Genre</div>
              <div className="font-semibold capitalize">{result.analysis.genre}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-sm text-gray-600 mb-1">Energy Level</div>
              <div className="font-bold text-lg">{result.analysis.energy_level}/10</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${getEnergyBarColor(result.analysis.energy_level)}`}
                  style={{ width: `${result.analysis.energy_level * 10}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Scene Type */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">🎭 Scene Type:</span>
                <span className="ml-2 capitalize">{result.analysis.scene_type}</span>
              </div>
              <span className="text-sm text-gray-600">
                {new Date(result.timestamp).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Suggested Songs */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <span className="mr-2">🎵</span> AI Recommended Songs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.analysis.suggested_songs.map((song, index) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <span className="text-xl">🎵</span>
                  <span className="font-medium">{song}</span>
                  <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Demo Note */}
          {result.note && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-yellow-800 text-sm">
                <span className="font-semibold">💡 Tip:</span> {result.note}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!selectedImage && !result && (
        <div className="instructions-section">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="font-semibold mb-3 text-lg">📝 How it works:</h4>
            <ol className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="mr-3 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">1</span>
                <span>Upload any photo from your device (beach, pets, city, nature, etc.)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">2</span>
                <span>AI analyzes the image - detects objects, scene, mood, and atmosphere</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">3</span>
                <span>OpenAI describes what it sees and suggests the perfect music</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">4</span>
                <span>Get personalized song recommendations matching your image!</span>
              </li>
            </ol>

            <div className="mt-6 p-4 bg-white rounded-lg">
              <h5 className="font-medium mb-3">🎯 Try uploading these types of images:</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <span>🏖️</span>
                  <span>Beach photos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🐕</span>
                  <span>Pet photos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🏙️</span>
                  <span>City scenes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>⛰️</span>
                  <span>Mountains</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🌅</span>
                  <span>Sunsets</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>☕</span>
                  <span>Cafe/food</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
