import React, { useState, useCallback } from 'react';
import { analyzePhotoForMusic, PhotoAnalysis } from '../lib/advanced-photo-analyzer';
import { musicAPI, Song } from '../lib/music-api-service';

interface SmartPhotoUploadProps {
  onSongsFound?: (songs: Song[]) => void;
  onAnalysisComplete?: (analysis: PhotoAnalysis) => void;
}

export const SmartPhotoUpload: React.FC<SmartPhotoUploadProps> = ({ 
  onSongsFound, 
  onAnalysisComplete 
}) => {
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setUploading(true);
    setError(null);
    setAnalysis(null);
    setSongs([]);

    try {
      console.log('🔍 Analyzing photo:', file.name);
      
      // Step 1: Analyze the photo
      const photoAnalysis = await analyzePhotoForMusic(file);
      console.log('✅ Photo analysis complete:', photoAnalysis);
      
      setAnalysis(photoAnalysis);
      onAnalysisComplete?.(photoAnalysis);

      // Step 2: Generate search queries based on analysis
      const searchQueries = generateSearchQueries(photoAnalysis);
      console.log('🎯 Generated search queries:', searchQueries);

      // Step 3: Search for songs using multiple queries
      const allSongs: Song[] = [];
      
      for (const query of searchQueries) {
        const results = await musicAPI.searchSongs(query.query, {
          limit: query.limit,
          language: query.language,
          mood: query.mood,
          useCache: true
        });
        
        allSongs.push(...results);
      }

      // Step 4: Deduplicate and rank songs
      const uniqueSongs = deduplicateAndRank(allSongs, photoAnalysis);
      console.log(`🎵 Found ${uniqueSongs.length} unique songs`);

      setSongs(uniqueSongs);
      onSongsFound?.(uniqueSongs);

    } catch (err) {
      console.error('❌ Photo analysis failed:', err);
      setError('Failed to analyze photo. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [onAnalysisComplete, onSongsFound]);

  const generateSearchQueries = (analysis: PhotoAnalysis) => {
    const queries: Array<{
      query: string;
      limit: number;
      language?: string;
      mood?: string;
    }> = [];

    // Scene-based queries
    switch (analysis.scene.type) {
      case 'sunset':
        queries.push(
          { query: 'sunset romantic songs', limit: 10, mood: 'romantic' },
          { query: 'evening love songs', limit: 8, mood: 'romantic' },
          { query: 'peaceful instrumental', limit: 5, mood: 'peaceful' }
        );
        break;
      
      case 'party':
        queries.push(
          { query: 'party dance songs', limit: 15, mood: 'energetic' },
          { query: 'celebration music', limit: 10, mood: 'happy' },
          { query: 'club hits', limit: 10, mood: 'energetic' }
        );
        break;
      
      case 'nature':
        queries.push(
          { query: 'nature peaceful songs', limit: 10, mood: 'peaceful' },
          { query: 'folk music', limit: 8, mood: 'calm' },
          { query: 'instrumental nature', limit: 5, mood: 'peaceful' }
        );
        break;
      
      case 'beach':
        queries.push(
          { query: 'beach summer songs', limit: 10, mood: 'happy' },
          { query: 'tropical music', limit: 8, mood: 'energetic' },
          { query: 'ocean waves music', limit: 5, mood: 'peaceful' }
        );
        break;
    }

    // Mood-based queries
    queries.push(
      { query: `${analysis.mood.primary} songs`, limit: 10, mood: analysis.mood.primary }
    );

    // Time-based queries
    switch (analysis.scene.timeOfDay) {
      case 'morning':
        queries.push(
          { query: 'morning fresh songs', limit: 8, mood: 'peaceful' },
          { query: 'breakfast music', limit: 5, mood: 'happy' }
        );
        break;
      case 'evening':
        queries.push(
          { query: 'evening chill songs', limit: 10, mood: 'peaceful' },
          { query: 'dinner music', limit: 5, mood: 'romantic' }
        );
        break;
      case 'night':
        queries.push(
          { query: 'night party songs', limit: 10, mood: 'energetic' },
          { query: 'late night chill', limit: 8, mood: 'peaceful' }
        );
        break;
    }

    // Language-specific queries
    analysis.music.languages.forEach(lang => {
      queries.push({
        query: `${analysis.mood.primary} ${lang} songs`,
        limit: 8,
        language: lang,
        mood: analysis.mood.primary
      });
    });

    // Genre-based queries
    analysis.music.genres.slice(0, 3).forEach(genre => {
      queries.push({
        query: `${genre} ${analysis.mood.primary}`,
        limit: 8,
        mood: analysis.mood.primary
      });
    });

    return queries.slice(0, 8); // Limit to 8 queries to avoid too many API calls
  };

  const deduplicateAndRank = (songs: Song[], analysis: PhotoAnalysis): Song[] => {
    // Remove duplicates
    const seen = new Set<string>();
    const unique = songs.filter(song => {
      const key = `${song.title.toLowerCase()}_${song.artist.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Rank songs based on analysis
    return unique.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Mood matching
      const moodMatch = (song: Song) => 
        song.mood_tags.some(m => analysis.music.moods.includes(m));
      
      if (moodMatch(a)) scoreA += 10;
      if (moodMatch(b)) scoreB += 10;

      // Genre matching
      const genreMatch = (song: Song) => 
        analysis.music.genres.includes(song.genre);
      
      if (genreMatch(a)) scoreA += 8;
      if (genreMatch(b)) scoreB += 8;

      // Energy level matching
      const energyDiffA = Math.abs(a.energy_level - analysis.music.energy_level);
      const energyDiffB = Math.abs(b.energy_level - analysis.music.energy_level);
      
      scoreA += (10 - energyDiffA);
      scoreB += (10 - energyDiffB);

      // Trending bonus
      if (a.is_trending) scoreA += 5;
      if (b.is_trending) scoreB += 5;

      // Language preference
      if (analysis.music.languages.includes(a.language)) scoreA += 3;
      if (analysis.music.languages.includes(b.language)) scoreB += 3;

      return scoreB - scoreA;
    }).slice(0, 20); // Return top 20 songs
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const getSceneEmoji = (scene: string) => {
    const emojis: Record<string, string> = {
      sunset: '🌅',
      sunrise: '🌄',
      night: '🌃',
      day: '☀️',
      indoor: '🏠',
      outdoor: '🌳',
      nature: '🌲',
      urban: '🏙️',
      beach: '🏖️',
      mountain: '⛰️',
      party: '🎉',
      restaurant: '🍽️'
    };
    return emojis[scene] || '📸';
  };

  const getMoodEmoji = (mood: string) => {
    const emojis: Record<string, string> = {
      happy: '😊',
      romantic: '💕',
      energetic: '⚡',
      peaceful: '😌',
      calm: '🧘',
      melancholic: '😔',
      excited: '🤩',
      nostalgic: '🥰',
      confident: '😎',
      dreamy: '✨'
    };
    return emojis[mood] || '😊';
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-900 to-blue-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-center">
          🎵 Smart Photo Music Discovery
        </h1>
        <p className="text-center text-gray-300 mb-8">
          Upload a photo and let AI find the perfect songs for your moment
        </p>

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            dragActive 
              ? 'border-purple-400 bg-purple-900/30' 
              : 'border-gray-600 bg-gray-800/50 hover:border-purple-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />

          {uploading ? (
            <div className="space-y-4">
              <div className="animate-spin text-6xl">🧠</div>
              <p className="text-xl">Analyzing your photo...</p>
              <p className="text-sm text-gray-400">
                Detecting scene, mood, and finding perfect songs
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl">📸</div>
              <div>
                <p className="text-xl font-semibold mb-2">
                  {dragActive ? 'Drop your photo here' : 'Click or drag photo here'}
                </p>
                <p className="text-sm text-gray-400">
                  Supports JPG, PNG, WebP • Max 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-300">
            ⚠️ {error}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold text-center">
              🎯 Photo Analysis Complete
            </h2>

            {/* Scene & Mood */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  {getSceneEmoji(analysis.scene.type)} Scene Analysis
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Type:</strong> {analysis.scene.type}</p>
                  <p><strong>Time:</strong> {analysis.scene.timeOfDay}</p>
                  <p><strong>Lighting:</strong> {analysis.scene.lighting}</p>
                  <p><strong>Colors:</strong> {analysis.scene.colors.join(', ')}</p>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  {getMoodEmoji(analysis.mood.primary)} Mood Analysis
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Primary:</strong> {analysis.mood.primary}</p>
                  <p><strong>Secondary:</strong> {analysis.mood.secondary.join(', ')}</p>
                  <p><strong>Energy:</strong> {analysis.mood.energy}/10</p>
                  <p><strong>Context:</strong> {analysis.mood.context}</p>
                </div>
              </div>
            </div>

            {/* Music Suggestions */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">🎵 Music Preferences</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Genres:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysis.music.genres.map(genre => (
                      <span key={genre} className="bg-purple-600 px-2 py-1 rounded text-xs">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <strong>Moods:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysis.music.moods.map(mood => (
                      <span key={mood} className="bg-blue-600 px-2 py-1 rounded text-xs">
                        {mood}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <strong>Languages:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysis.music.languages.map(lang => (
                      <span key={lang} className="bg-green-600 px-2 py-1 rounded text-xs">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Songs Found */}
            {songs.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  🎵 {songs.length} Perfect Songs Found
                </h3>
                <div className="space-y-3">
                  {songs.slice(0, 10).map((song, index) => (
                    <div key={song.id} className="flex items-center gap-4 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                      <span className="text-2xl font-bold text-purple-400">
                        {index + 1}
                      </span>
                      
                      {song.album_art ? (
                        <img
                          src={song.album_art}
                          alt={song.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-600 flex items-center justify-center">
                          🎵
                        </div>
                      )}

                      <div className="flex-1">
                        <h4 className="font-semibold">{song.title}</h4>
                        <p className="text-sm text-gray-400">{song.artist}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                            {song.genre}
                          </span>
                          <span className="text-xs bg-purple-600 px-2 py-1 rounded">
                            {song.source.toUpperCase()}
                          </span>
                          {song.is_trending && (
                            <span className="text-xs bg-yellow-600 px-2 py-1 rounded">
                              🔥 Trending
                            </span>
                          )}
                        </div>
                      </div>

                      {song.preview_url && (
                        <a
                          href={song.preview_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 text-sm font-semibold"
                        >
                          ▶ Play
                        </a>
                      )}
                    </div>
                  ))}
                </div>
                
                {songs.length > 10 && (
                  <p className="text-center text-gray-400 mt-4">
                    and {songs.length - 10} more songs...
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartPhotoUpload;
