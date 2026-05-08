// Voice Mood Detection Component
// AI-powered voice analysis for mood detection

import React, { useState, useEffect, useRef } from 'react';
import { AIServices } from '../lib/ai-services';

interface VoiceMoodResult {
  mood: string;
  confidence: number;
  transcript: string;
  sentiment: number;
  recommendations: string[];
}

export default function VoiceMoodDetector() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<VoiceMoodResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    checkSpeechSupport();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const checkSpeechSupport = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      setError('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
    }
  };

  const startListening = () => {
    if (!isSupported) return;

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError('');
        setResult(null);
        console.log('🎤 Voice recognition started');
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('📝 Voice transcript:', transcript);
        
        setIsProcessing(true);
        await processVoiceInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Voice recognition error:', event.error);
        setError(`Voice recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('🎤 Voice recognition ended');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('❌ Failed to start voice recognition:', error);
      setError('Failed to start voice recognition');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoiceInput = async (transcript: string) => {
    try {
      console.log('🧠 Processing voice input:', transcript);
      
      // Analyze sentiment using our AI services
      const sentimentAnalysis = AIServices.analyzeSentiment(transcript);
      console.log('📊 Sentiment analysis:', sentimentAnalysis);

      // Determine mood based on sentiment and keywords
      const moodAnalysis = analyzeMoodFromVoice(transcript, sentimentAnalysis);
      console.log('😊 Mood analysis:', moodAnalysis);

      // Generate recommendations
      const recommendations = generateVoiceRecommendations(moodAnalysis.mood, transcript);
      console.log('🎵 Recommendations:', recommendations);

      const result: VoiceMoodResult = {
        mood: moodAnalysis.mood,
        confidence: moodAnalysis.confidence,
        transcript,
        sentiment: sentimentAnalysis.score,
        recommendations
      };

      setResult(result);
      setIsProcessing(false);
    } catch (error) {
      console.error('❌ Error processing voice input:', error);
      setError('Failed to process voice input');
      setIsProcessing(false);
    }
  };

  const analyzeMoodFromVoice = (transcript: string, sentiment: any) => {
    const text = transcript.toLowerCase();
    let mood = 'happy';
    let confidence = 0.5;

    // Keyword-based mood detection
    const moodKeywords = {
      happy: ['happy', 'great', 'awesome', 'fantastic', 'love', 'excited', 'wonderful', 'amazing'],
      sad: ['sad', 'depressed', 'lonely', 'crying', 'unhappy', 'miserable', 'down'],
      energetic: ['energetic', 'excited', 'pumped', 'ready', 'motivated', 'workout', 'exercise'],
      peaceful: ['calm', 'peaceful', 'relaxed', 'chill', 'meditate', 'zen', 'tranquil'],
      romantic: ['love', 'romantic', 'date', 'valentine', 'relationship', 'heart'],
      confident: ['confident', 'powerful', 'strong', 'unstoppable', 'winning', 'success'],
      party: ['party', 'dance', 'club', 'celebration', 'fun', 'friends', 'weekend'],
      nostalgic: ['memories', 'childhood', 'old times', 'remember', 'nostalgic', 'past']
    };

    // Find matching mood
    Object.entries(moodKeywords).forEach(([moodName, keywords]) => {
      const matches = keywords.filter(keyword => text.includes(keyword)).length;
      if (matches > 0) {
        mood = moodName;
        confidence = Math.min(0.5 + (matches * 0.2), 1);
      }
    });

    // Adjust based on sentiment
    if (sentiment.score > 0.5 && mood === 'happy') {
      confidence = Math.min(confidence + 0.2, 1);
    } else if (sentiment.score < -0.5 && mood === 'sad') {
      confidence = Math.min(confidence + 0.2, 1);
    }

    return { mood, confidence };
  };

  const generateVoiceRecommendations = (mood: string, transcript: string) => {
    const recommendations = [
      `Perfect ${mood} vibes detected!`,
      `Based on your mood: ${mood}`,
      `Music matching your ${mood} mood`,
      `${mood.charAt(0).toUpperCase() + mood.slice(1)} mood playlist ready!`
    ];

    // Add personalized recommendations based on transcript
    if (transcript.toLowerCase().includes('workout') || transcript.toLowerCase().includes('exercise')) {
      recommendations.push('High-energy workout music selected');
    }
    if (transcript.toLowerCase().includes('relax') || transcript.toLowerCase().includes('chill')) {
      recommendations.push('Relaxing chill vibes coming up');
    }
    if (transcript.toLowerCase().includes('party') || transcript.toLowerCase().includes('dance')) {
      recommendations.push('Party starters loaded!');
    }

    return recommendations.slice(0, 3);
  };

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      energetic: '⚡',
      peaceful: '🧘',
      romantic: '💕',
      confident: '💪',
      party: '🎉',
      nostalgic: '📻'
    };
    return moodEmojis[mood] || '😊';
  };

  const getMoodColor = (mood: string) => {
    const moodColors: Record<string, string> = {
      happy: 'bg-yellow-100 text-yellow-800',
      sad: 'bg-blue-100 text-blue-800',
      energetic: 'bg-red-100 text-red-800',
      peaceful: 'bg-green-100 text-green-800',
      romantic: 'bg-pink-100 text-pink-800',
      confident: 'bg-purple-100 text-purple-800',
      party: 'bg-orange-100 text-orange-800',
      nostalgic: 'bg-indigo-100 text-indigo-800'
    };
    return moodColors[mood] || 'bg-gray-100 text-gray-800';
  };

  if (!isSupported) {
    return (
      <div className="voice-mood-detector p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-4xl mb-4">🎤</div>
          <h3 className="text-lg font-semibold mb-2">Voice Mood Detection</h3>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-gray-600 mt-2">
            Please use Chrome or Edge for voice recognition features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-mood-detector p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">🎤 Voice Mood Detection</h2>
        <p className="text-gray-600">Tell me how you're feeling and I'll find the perfect music!</p>
      </div>

      {/* Voice Input Section */}
      <div className="voice-input-section text-center mb-6">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          className={`px-8 py-4 rounded-full font-medium text-lg transition-all ${
            isListening 
              ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
              : isProcessing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isListening ? (
            <span className="flex items-center">
              <span className="animate-pulse mr-2">🎤</span>
              Listening... Speak now!
            </span>
          ) : isProcessing ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2">🧠</span>
              Processing your mood...
            </span>
          ) : (
            <span className="flex items-center">
              <span className="mr-2">🎤</span>
              Tap to Start
            </span>
          )}
        </button>

        {isListening && (
          <div className="mt-4">
            <div className="inline-flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Listening...</span>
            </div>
          </div>
        )}
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
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">You said:</h4>
            <p className="text-lg italic">"{result.transcript}"</p>
          </div>

          <div className="mb-6">
            <div className={`inline-flex items-center space-x-3 px-4 py-2 rounded-full ${getMoodColor(result.mood)}`}>
              <span className="text-2xl">{getMoodEmoji(result.mood)}</span>
              <div className="text-left">
                <div className="font-semibold capitalize">{result.mood} Mood</div>
                <div className="text-sm opacity-75">
                  {Math.round(result.confidence * 100)}% confidence
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold mb-3">🎵 AI Recommendations:</h4>
            <div className="space-y-2">
              {result.recommendations.map((rec, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-600">🎵</span>
                  <span className="text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setResult(null);
                setError('');
              }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!result && !isListening && !isProcessing && (
        <div className="instructions-section">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📝 How to use:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Click the microphone button</li>
              <li>• Say how you're feeling (e.g., "I'm feeling happy today")</li>
              <li>• AI will detect your mood and suggest music</li>
              <li>• Try phrases like: "I need workout music" or "I'm feeling romantic"</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
