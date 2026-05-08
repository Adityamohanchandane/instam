// AI Features Demo Component
// Showcase advanced AI capabilities

import { useState, useEffect } from 'react';
import { AIServices } from '../lib/ai-services';
import { AdvancedMoodDetection } from '../lib/advanced-mood-detection';
import { AIRecommendationEngine } from '../lib/ai-recommendation-engine';

interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'active' | 'loading' | 'error';
  details: any;
}

export default function AIFeaturesDemo() {
  const [features, setFeatures] = useState<AIFeature[]>([
    {
      id: 'sentiment-analysis',
      name: 'Sentiment Analysis',
      description: 'Analyze text emotions and mood',
      icon: '🧠',
      status: 'loading',
      details: null
    },
    {
      id: 'mood-detection',
      name: 'Advanced Mood Detection',
      description: 'AI-powered mood analysis from images',
      icon: '😊',
      status: 'loading',
      details: null
    },
    {
      id: 'ai-recommendations',
      name: 'AI Recommendations',
      description: 'Machine learning powered music suggestions',
      icon: '🎵',
      status: 'loading',
      details: null
    },
    {
      id: 'behavior-analysis',
      name: 'Behavior Analysis',
      description: 'Learn from your music preferences',
      icon: '📊',
      status: 'loading',
      details: null
    }
  ]);

  const [testText, setTestText] = useState('I love this beautiful sunny day! It makes me so happy and energetic.');
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  useEffect(() => {
    initializeAIFeatures();
  }, []);

  const initializeAIFeatures = async () => {
    console.log('🤖 Initializing AI Features Demo...');

    // Test Sentiment Analysis
    await testSentimentAnalysis();

    // Test Advanced Mood Detection
    await testAdvancedMoodDetection();

    // Test AI Recommendations
    await testAIRecommendations();

    // Test Behavior Analysis
    await testBehaviorAnalysis();
  };

  const testSentimentAnalysis = async () => {
    try {
      setFeatures(prev => prev.map(f => 
        f.id === 'sentiment-analysis' ? { ...f, status: 'loading' } : f
      ));

      const result = AIServices.analyzeSentiment(testText);
      
      setFeatures(prev => prev.map(f => 
        f.id === 'sentiment-analysis' 
          ? { ...f, status: 'active', details: result }
          : f
      ));

      console.log('✅ Sentiment Analysis Result:', result);
    } catch (error) {
      console.error('❌ Sentiment Analysis failed:', error);
      setFeatures(prev => prev.map(f => 
        f.id === 'sentiment-analysis' ? { ...f, status: 'error' } : f
      ));
    }
  };

  const testAdvancedMoodDetection = async () => {
    try {
      setFeatures(prev => prev.map(f => 
        f.id === 'mood-detection' ? { ...f, status: 'loading' } : f
      ));

      // Simulate image data
      const imageData = {
        colors: ['bright-yellow', 'sky-blue', 'green'],
        brightness: 0.8,
        contrast: 0.6,
        faces: 2,
        scene: 'beach',
        objects: ['sun', 'waves', 'people']
      };

      const result = await AdvancedMoodDetection.analyzeImageMood(imageData);
      
      setFeatures(prev => prev.map(f => 
        f.id === 'mood-detection' 
          ? { ...f, status: 'active', details: result }
          : f
      ));

      console.log('✅ Advanced Mood Detection Result:', result);
    } catch (error) {
      console.error('❌ Advanced Mood Detection failed:', error);
      setFeatures(prev => prev.map(f => 
        f.id === 'mood-detection' ? { ...f, status: 'error' } : f
      ));
    }
  };

  const testAIRecommendations = async () => {
    try {
      setFeatures(prev => prev.map(f => 
        f.id === 'ai-recommendations' ? { ...f, status: 'loading' } : f
      ));

      // Mock songs data
      const mockSongs = [
        { id: '1', title: 'Happy Song', artist: 'Artist 1', genre: 'Pop', mood_tags: ['happy'], energy: 8 },
        { id: '2', title: 'Chill Vibes', artist: 'Artist 2', genre: 'Lo-fi', mood_tags: ['peaceful'], energy: 3 },
        { id: '3', title: 'Party Anthem', artist: 'Artist 3', genre: 'EDM', mood_tags: ['party'], energy: 9 }
      ];

      const mockProfile = {
        favorite_genres: ['Pop', 'Lo-fi'],
        preferred_languages: ['English'],
        personality_traits: ['happy', 'chill']
      };

      const result = AIServices.generateAIRecommendations(mockSongs, mockProfile, 'happy');
      
      setFeatures(prev => prev.map(f => 
        f.id === 'ai-recommendations' 
          ? { ...f, status: 'active', details: result }
          : f
      ));

      console.log('✅ AI Recommendations Result:', result);
    } catch (error) {
      console.error('❌ AI Recommendations failed:', error);
      setFeatures(prev => prev.map(f => 
        f.id === 'ai-recommendations' ? { ...f, status: 'error' } : f
      ));
    }
  };

  const testBehaviorAnalysis = async () => {
    try {
      setFeatures(prev => prev.map(f => 
        f.id === 'behavior-analysis' ? { ...f, status: 'loading' } : f
      ));

      const insights = AIRecommendationEngine.getUserInsights();
      
      setFeatures(prev => prev.map(f => 
        f.id === 'behavior-analysis' 
          ? { ...f, status: 'active', details: insights }
          : f
      ));

      console.log('✅ Behavior Analysis Result:', insights);
    } catch (error) {
      console.error('❌ Behavior Analysis failed:', error);
      setFeatures(prev => prev.map(f => 
        f.id === 'behavior-analysis' ? { ...f, status: 'error' } : f
      ));
    }
  };

  const runTextAnalysis = () => {
    testSentimentAnalysis();
    setAnalysisResults(AIServices.analyzeSentiment(testText));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '✅';
      case 'loading': return '⏳';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'loading': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="ai-features-demo p-6 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🤖 AI Features Demo</h1>
        <p className="text-gray-600">Experience the power of AI in Instam</p>
      </div>

      {/* AI Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {features.map(feature => (
          <div key={feature.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <h3 className="font-semibold">{feature.name}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
              <span className={`text-xl ${getStatusColor(feature.status)}`}>
                {getStatusIcon(feature.status)}
              </span>
            </div>

            {feature.details && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Results:</h4>
                <pre className="text-xs overflow-auto max-h-40">
                  {JSON.stringify(feature.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Interactive Text Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">📝 Interactive Text Analysis</h2>
        <div className="space-y-4">
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            rows={3}
            placeholder="Enter text to analyze sentiment..."
          />
          <button
            onClick={runTextAnalysis}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Analyze Sentiment
          </button>
          
          {analysisResults && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Analysis Results:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Score:</span> {analysisResults.score.toFixed(3)}
                </div>
                <div>
                  <span className="font-medium">Comparative:</span> {analysisResults.comparative.toFixed(3)}
                </div>
                <div>
                  <span className="font-medium">Positive Words:</span> {analysisResults.positive.join(', ')}
                </div>
                <div>
                  <span className="font-medium">Negative Words:</span> {analysisResults.negative.join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Capabilities Overview */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🚀 AI Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <h3 className="font-semibold mb-2">🧠 Natural Language Processing</h3>
            <ul className="text-sm space-y-1">
              <li>• Sentiment analysis</li>
              <li>• Text classification</li>
              <li>• Emotion detection</li>
              <li>• Language understanding</li>
            </ul>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <h3 className="font-semibold mb-2">🎵 Music Intelligence</h3>
            <ul className="text-sm space-y-1">
              <li>• Mood-based recommendations</li>
              <li>• User behavior learning</li>
              <li>• Genre preferences</li>
              <li>• Energy matching</li>
            </ul>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <h3 className="font-semibold mb-2">📊 Machine Learning</h3>
            <ul className="text-sm space-y-1">
              <li>• Pattern recognition</li>
              <li>• Predictive analytics</li>
              <li>• User profiling</li>
              <li>• Adaptive learning</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>Powered by TensorFlow.js, Natural Language Processing, and Advanced Machine Learning</p>
        <p className="mt-2">AI Features: Sentiment Analysis • Mood Detection • Recommendation Engine • Behavior Analysis</p>
      </div>
    </div>
  );
}
