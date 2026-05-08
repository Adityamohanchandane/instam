// AI Music Generation Component
// Create custom music based on mood and preferences

import React, { useState, useEffect } from 'react';

// Load TensorFlow dynamically to avoid Vite optimization issues
let tf: any = null;

const loadTensorFlow = async () => {
  try {
    if (!tf) {
      tf = await import('@tensorflow/tfjs');
      await tf.ready();
      console.log('✅ TensorFlow loaded for music generation');
    }
  } catch (error) {
    console.error('❌ Failed to load TensorFlow:', error);
    // Continue without TensorFlow - use mock generation
  }
};

interface GeneratedTrack {
  id: string;
  title: string;
  mood: string;
  tempo: number;
  duration: number;
  instruments: string[];
  description: string;
  createdAt: Date;
  audioUrl?: string;
}

interface MusicGenerationParams {
  mood: string;
  tempo: number;
  duration: number;
  instruments: string[];
  complexity: number;
}

export default function AIMusicGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTracks, setGeneratedTracks] = useState<GeneratedTrack[]>([]);
  const [currentParams, setCurrentParams] = useState<MusicGenerationParams>({
    mood: 'happy',
    tempo: 120,
    duration: 30,
    instruments: ['piano', 'drums'],
    complexity: 5
  });
  const [error, setError] = useState<string>('');

  const moods = [
    { value: 'happy', label: '😊 Happy', color: 'bg-yellow-100' },
    { value: 'sad', label: '😢 Sad', color: 'bg-blue-100' },
    { value: 'energetic', label: '⚡ Energetic', color: 'bg-red-100' },
    { value: 'peaceful', label: '🧘 Peaceful', color: 'bg-green-100' },
    { value: 'romantic', label: '💕 Romantic', color: 'bg-pink-100' },
    { value: 'mysterious', label: '🔮 Mysterious', color: 'bg-purple-100' }
  ];

  const instruments = [
    { value: 'piano', label: '🎹 Piano' },
    { value: 'guitar', label: '🎸 Guitar' },
    { value: 'drums', label: '🥁 Drums' },
    { value: 'violin', label: '🎻 Violin' },
    { value: 'synth', label: '🎛️ Synthesizer' },
    { value: 'bass', label: '🎸 Bass' },
    { value: 'flute', label: '🎺 Flute' },
    { value: 'strings', label: '🎻 Strings' }
  ];

  useEffect(() => {
    initializeAI();
  }, []);

  const initializeAI = async () => {
    try {
      console.log('🧠 Initializing AI Music Generator...');
      
      // Initialize TensorFlow.js backend dynamically
      await loadTensorFlow();
      console.log('✅ AI Music Generator ready');
    } catch (error) {
      console.error('❌ Failed to initialize AI:', error);
      console.log('⚠️ Continuing with mock music generation');
      // Don't set error - continue with mock functionality
    }
  };

  const generateMusic = async () => {
    try {
      setIsGenerating(true);
      setError('');
      
      console.log('🎵 Generating AI music with params:', currentParams);
      
      // Simulate AI music generation process
      const generatedTrack = await createMusicComposition(currentParams);
      
      setGeneratedTracks(prev => [generatedTrack, ...prev]);
      setIsGenerating(false);
      
      console.log('✅ Music generated successfully:', generatedTrack);
    } catch (error) {
      console.error('❌ Error generating music:', error);
      setError('Failed to generate music');
      setIsGenerating(false);
    }
  };

  const createMusicComposition = async (params: MusicGenerationParams): Promise<GeneratedTrack> => {
    // Simulate AI composition process
    return new Promise((resolve) => {
      setTimeout(() => {
        const track: GeneratedTrack = {
          id: `ai-track-${Date.now()}`,
          title: generateTrackTitle(params.mood, params.instruments),
          mood: params.mood,
          tempo: params.tempo,
          duration: params.duration,
          instruments: params.instruments,
          description: generateTrackDescription(params),
          createdAt: new Date(),
          audioUrl: generateMockAudioUrl()
        };
        
        resolve(track);
      }, 2000); // Simulate 2 second generation time
    });
  };

  const generateTrackTitle = (mood: string, instruments: string[]): string => {
    const moodAdjectives: Record<string, string> = {
      happy: 'Joyful',
      sad: 'Melancholy',
      energetic: 'Dynamic',
      peaceful: 'Serene',
      romantic: 'Passionate',
      mysterious: 'Enigmatic'
    };

    const instrumentNames: Record<string, string> = {
      piano: 'Piano',
      guitar: 'Guitar',
      drums: 'Drums',
      violin: 'Violin',
      synth: 'Synth',
      bass: 'Bass',
      flute: 'Flute',
      strings: 'Strings'
    };

    const adjective = moodAdjectives[mood] || 'AI';
    const primaryInstrument = instrumentNames[instruments[0]] || 'Music';
    
    return `${adjective} ${primaryInstrument} Melody`;
  };

  const generateTrackDescription = (params: MusicGenerationParams): string => {
    const moodDescriptions: Record<string, string> = {
      happy: 'An uplifting and cheerful composition designed to boost your mood',
      sad: 'A melancholic and emotional piece perfect for reflection',
      energetic: 'A high-energy track designed to motivate and energize',
      peaceful: 'A calming and soothing melody for relaxation and meditation',
      romantic: 'A passionate and intimate composition for special moments',
      mysterious: 'An enigmatic and atmospheric piece full of intrigue'
    };

    const baseDescription = moodDescriptions[params.mood] || 'A unique AI-generated composition';
    const instrumentList = params.instruments.join(', ');
    const tempoDescription = params.tempo > 140 ? 'fast-paced' : params.tempo < 80 ? 'slow-tempo' : 'moderate-tempo';
    
    return `${baseDescription}. Features ${instrumentList} with a ${tempoDescription} rhythm of ${params.tempo} BPM.`;
  };

  const generateMockAudioUrl = (): string => {
    // In a real implementation, this would be the actual generated audio file
    return `data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT`;
  };

  const updateParam = (key: keyof MusicGenerationParams, value: any) => {
    setCurrentParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleInstrument = (instrument: string) => {
    setCurrentParams(prev => ({
      ...prev,
      instruments: prev.instruments.includes(instrument)
        ? prev.instruments.filter(i => i !== instrument)
        : [...prev.instruments, instrument]
    }));
  };

  const deleteTrack = (trackId: string) => {
    setGeneratedTracks(prev => prev.filter(track => track.id !== trackId));
  };

  const downloadTrack = (track: GeneratedTrack) => {
    // In a real implementation, this would download the actual audio file
    const link = document.createElement('a');
    link.href = track.audioUrl || '';
    link.download = `${track.title}.wav`;
    link.click();
  };

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      energetic: '⚡',
      peaceful: '🧘',
      romantic: '💕',
      mysterious: '🔮'
    };
    return moodEmojis[mood] || '🎵';
  };

  return (
    <div className="ai-music-generator p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">🎹 AI Music Generator</h2>
        <p className="text-gray-600">Create unique music powered by artificial intelligence!</p>
      </div>

      {/* Generation Controls */}
      <div className="generation-controls mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Mood Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">🎭 Choose Mood:</label>
            <div className="grid grid-cols-2 gap-2">
              {moods.map(mood => (
                <button
                  key={mood.value}
                  onClick={() => updateParam('mood', mood.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    currentParams.mood === mood.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="block font-medium">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Instrument Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">🎵 Select Instruments:</label>
            <div className="grid grid-cols-2 gap-2">
              {instruments.map(instrument => (
                <button
                  key={instrument.value}
                  onClick={() => toggleInstrument(instrument.value)}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    currentParams.instruments.includes(instrument.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm">{instrument.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">⏱️ Tempo (BPM):</label>
            <input
              type="range"
              min="60"
              max="180"
              value={currentParams.tempo}
              onChange={(e) => updateParam('tempo', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-600">{currentParams.tempo} BPM</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">⏱️ Duration (seconds):</label>
            <input
              type="range"
              min="15"
              max="120"
              step="15"
              value={currentParams.duration}
              onChange={(e) => updateParam('duration', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-600">{currentParams.duration}s</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">🧠 Complexity:</label>
            <input
              type="range"
              min="1"
              max="10"
              value={currentParams.complexity}
              onChange={(e) => updateParam('complexity', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-600">{currentParams.complexity}/10</div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="text-center">
          <button
            onClick={generateMusic}
            disabled={isGenerating || currentParams.instruments.length === 0}
            className={`px-8 py-3 rounded-lg font-medium text-lg transition-all ${
              isGenerating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : currentParams.instruments.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">🧠</span>
                Generating Music...
              </span>
            ) : (
              <span className="flex items-center">
                <span className="mr-2">🎹</span>
                Generate AI Music
              </span>
            )}
          </button>
          
          {currentParams.instruments.length === 0 && (
            <p className="text-sm text-red-600 mt-2">Please select at least one instrument</p>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-section mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Generated Tracks */}
      {generatedTracks.length > 0 && (
        <div className="generated-tracks">
          <h3 className="text-lg font-semibold mb-4">🎵 Your AI Creations</h3>
          <div className="space-y-4">
            {generatedTracks.map(track => (
              <div key={track.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getMoodEmoji(track.mood)}</span>
                      <h4 className="font-semibold text-lg">{track.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        track.mood === 'happy' ? 'bg-yellow-100 text-yellow-800' :
                        track.mood === 'sad' ? 'bg-blue-100 text-blue-800' :
                        track.mood === 'energetic' ? 'bg-red-100 text-red-800' :
                        track.mood === 'peaceful' ? 'bg-green-100 text-green-800' :
                        track.mood === 'romantic' ? 'bg-pink-100 text-pink-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {track.mood}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{track.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        ⏱️ {track.tempo} BPM
                      </span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        ⏱️ {track.duration}s
                      </span>
                      {track.instruments.map(inst => (
                        <span key={inst} className="text-xs bg-gray-200 px-2 py-1 rounded">
                          {inst}
                        </span>
                      ))}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Created {track.createdAt.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => downloadTrack(track)}
                      className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      title="Download track"
                    >
                      💾
                    </button>
                    <button
                      onClick={() => deleteTrack(track.id)}
                      className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                      title="Delete track"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {/* Audio Player (Mock) */}
                <div className="mt-3 bg-white p-3 rounded border">
                  <div className="flex items-center space-x-3">
                    <button className="p-2 bg-green-600 text-white rounded hover:bg-green-700">
                      ▶️
                    </button>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">0:00 / {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {generatedTracks.length === 0 && !isGenerating && (
        <div className="instructions-section">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎹 How to create AI music:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Choose a mood that matches your desired feeling</li>
              <li>• Select instruments you want in your composition</li>
              <li>• Adjust tempo, duration, and complexity</li>
              <li>• Click "Generate AI Music" to create your unique track</li>
              <li>• Download and share your AI-generated music!</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
