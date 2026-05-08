import React, { useState, useEffect } from 'react';
import { musicAPI, Song, searchMusic, getMusicRecommendations } from '../lib/music-api-service';

interface MusicSearchProps {
  onSelectSong?: (song: Song) => void;
  initialQuery?: string;
  language?: string;
}

export const MusicSearch: React.FC<MusicSearchProps> = ({ 
  onSelectSong, 
  initialQuery = '',
  language 
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState({ size: 0, keys: [] as string[] });

  useEffect(() => {
    updateCacheStats();
  }, []);

  const updateCacheStats = () => {
    setCacheStats(musicAPI.getCacheStats());
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const results = await searchMusic(query, {
        limit: 15,
        language,
        mood: 'happy'
      });

      if (results.length === 0) {
        setError('No songs found. Try a different search term.');
      } else {
        setSongs(results);
        updateCacheStats();
      }
    } catch (err) {
      setError('Failed to search songs. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendations = async (artist: string, mood: string) => {
    setLoading(true);
    setError(null);

    try {
      const results = await getMusicRecommendations(artist, mood, language);
      if (results.length === 0) {
        setError('No recommendations found.');
      } else {
        setSongs(results);
        updateCacheStats();
      }
    } catch (err) {
      setError('Failed to get recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    musicAPI.clearCache();
    updateCacheStats();
    alert('Cache cleared!');
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      youtube: 'bg-red-500',
      lastfm: 'bg-red-600',
      spotify: 'bg-green-500',
      cached: 'bg-blue-500'
    };
    return (
      <span className={`${colors[source] || 'bg-gray-500'} text-white text-xs px-2 py-1 rounded`}>
        {source.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">🎵 Music Search (External APIs)</h2>
        
        {/* Cache Stats */}
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">
              💾 Cached: {cacheStats.size} searches
            </span>
            <button 
              onClick={clearCache}
              className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-700"
            >
              Clear Cache
            </button>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists, or moods..."
              className="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-purple-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold"
            >
              {loading ? '🔍...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Quick Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => handleGetRecommendations('Arijit Singh', 'romantic')}
            className="px-3 py-1 bg-pink-600 rounded-full text-sm hover:bg-pink-700"
          >
            💕 Romantic (Hindi)
          </button>
          <button
            onClick={() => handleGetRecommendations('Taylor Swift', 'happy')}
            className="px-3 py-1 bg-yellow-600 rounded-full text-sm hover:bg-yellow-700"
          >
            😊 Happy (English)
          </button>
          <button
            onClick={() => handleGetRecommendations('A.R. Rahman', 'peaceful')}
            className="px-3 py-1 bg-blue-600 rounded-full text-sm hover:bg-blue-700"
          >
            🧘 Peaceful
          </button>
          <button
            onClick={() => handleGetRecommendations('Badshah', 'energetic')}
            className="px-3 py-1 bg-orange-600 rounded-full text-sm hover:bg-orange-700"
          >
            ⚡ Energetic
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300">
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin text-4xl mb-2">🎵</div>
            <p className="text-gray-400">Searching across YouTube & Last.fm...</p>
          </div>
        ) : songs.length > 0 ? (
          <div className="grid gap-4">
            <p className="text-sm text-gray-400 mb-2">
              Found {songs.length} songs from multiple sources
            </p>
            {songs.map((song) => (
              <div
                key={song.id}
                onClick={() => onSelectSong?.(song)}
                className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Album Art */}
                  {song.album_art ? (
                    <img
                      src={song.album_art}
                      alt={song.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center text-2xl">
                      🎵
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{song.title}</h3>
                      {getSourceBadge(song.source)}
                      {song.is_trending && (
                        <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded">
                          🔥 Trending
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400">{song.artist}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                        {song.language}
                      </span>
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                        {song.genre}
                      </span>
                      <span className="text-xs bg-purple-600 px-2 py-1 rounded">
                        Energy: {song.energy_level}/10
                      </span>
                      {song.mood_tags.map((mood) => (
                        <span
                          key={mood}
                          className="text-xs bg-green-600 px-2 py-1 rounded"
                        >
                          {mood}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Play Button */}
                  {song.preview_url && (
                    <a
                      href={song.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 text-sm font-semibold"
                    >
                      ▶ Play
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p className="text-4xl mb-2">🎵</p>
            <p>Search for songs or use quick filters above</p>
            <p className="text-sm mt-2 text-gray-600">
              Powered by YouTube Data API & Last.fm
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicSearch;
