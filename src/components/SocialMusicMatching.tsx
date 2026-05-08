// Social Music Matching Component
// Connect with friends and discover music compatibility

import React, { useState, useEffect } from 'react';
import { AIServices } from '../lib/ai-services';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  favoriteGenres: string[];
  personalityTraits: string[];
  currentMood: string;
  lastActive: Date;
  compatibilityScore?: number;
}

interface MusicMatch {
  friendId: string;
  friendName: string;
  compatibilityScore: number;
  sharedInterests: string[];
  recommendedPlaylist: string[];
  matchReason: string;
}

interface GroupPlaylist {
  id: string;
  name: string;
  participants: string[];
  mood: string;
  genres: string[];
  songs: any[];
  createdAt: Date;
}

export default function SocialMusicMatching() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [matches, setMatches] = useState<MusicMatch[]>([]);
  const [groupPlaylists, setGroupPlaylists] = useState<GroupPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'matches' | 'playlists'>('friends');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock friends data
    const mockFriends: Friend[] = [
      {
        id: '1',
        name: 'Rahul Sharma',
        avatar: '👨‍💼',
        favoriteGenres: ['Pop', 'Rock', 'Hip-Hop'],
        personalityTraits: ['energetic', 'confident', 'social'],
        currentMood: 'happy',
        lastActive: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
      },
      {
        id: '2',
        name: 'Priya Patel',
        avatar: '👩‍🎓',
        favoriteGenres: ['Romantic', 'Lo-fi', 'Classical'],
        personalityTraits: ['peaceful', 'romantic', 'soft'],
        currentMood: 'peaceful',
        lastActive: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
      },
      {
        id: '3',
        name: 'Amit Kumar',
        avatar: '👨‍🎤',
        favoriteGenres: ['EDM', 'Party', 'Dance'],
        personalityTraits: ['party', 'energetic', 'social'],
        currentMood: 'party',
        lastActive: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        id: '4',
        name: 'Neha Singh',
        avatar: '👩‍🎨',
        favoriteGenres: ['Indie', 'Alternative', 'Rock'],
        personalityTraits: ['creative', 'confident', 'attitude'],
        currentMood: 'confident',
        lastActive: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      }
    ];

    setFriends(mockFriends);

    // Mock group playlists
    const mockPlaylists: GroupPlaylist[] = [
      {
        id: '1',
        name: 'Weekend Party Mix',
        participants: ['1', '3'],
        mood: 'party',
        genres: ['EDM', 'Pop', 'Hip-Hop'],
        songs: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      },
      {
        id: '2',
        name: 'Chill Study Session',
        participants: ['2', '4'],
        mood: 'peaceful',
        genres: ['Lo-fi', 'Classical', 'Ambient'],
        songs: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) // 2 days ago
      }
    ];

    setGroupPlaylists(mockPlaylists);
  };

  const calculateCompatibility = (friend: Friend): number => {
    // Mock current user profile
    const currentUserProfile = {
      favoriteGenres: ['Pop', 'Rock', 'Romantic'],
      personalityTraits: ['happy', 'confident', 'social'],
      currentMood: 'happy'
    };

    let score = 0;
    let factors = 0;

    // Genre compatibility (40%)
    const sharedGenres = friend.favoriteGenres.filter(genre => 
      currentUserProfile.favoriteGenres.includes(genre)
    );
    score += (sharedGenres.length / Math.max(friend.favoriteGenres.length, currentUserProfile.favoriteGenres.length)) * 0.4;
    factors += 0.4;

    // Personality compatibility (30%)
    const sharedTraits = friend.personalityTraits.filter(trait => 
      currentUserProfile.personalityTraits.includes(trait)
    );
    score += (sharedTraits.length / Math.max(friend.personalityTraits.length, currentUserProfile.personalityTraits.length)) * 0.3;
    factors += 0.3;

    // Mood compatibility (20%)
    if (friend.currentMood === currentUserProfile.currentMood) {
      score += 0.2;
    }
    factors += 0.2;

    // Activity bonus (10%)
    const hoursSinceActive = (Date.now() - friend.lastActive.getTime()) / (1000 * 60 * 60);
    if (hoursSinceActive < 1) {
      score += 0.1;
    } else if (hoursSinceActive < 24) {
      score += 0.05;
    }
    factors += 0.1;

    return Math.round((score / factors) * 100);
  };

  const findMusicMatches = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('🔍 Finding music matches...');

      const musicMatches: MusicMatch[] = friends.map(friend => {
        const compatibilityScore = calculateCompatibility(friend);
        const sharedInterests = findSharedInterests(friend);
        const recommendedPlaylist = generateMatchPlaylist(friend);
        const matchReason = generateMatchReason(friend, compatibilityScore);

        return {
          friendId: friend.id,
          friendName: friend.name,
          compatibilityScore,
          sharedInterests,
          recommendedPlaylist,
          matchReason
        };
      });

      // Sort by compatibility score
      musicMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      setMatches(musicMatches);
      setIsLoading(false);
      
      console.log('✅ Music matches found:', musicMatches);
    } catch (error) {
      console.error('❌ Error finding matches:', error);
      setError('Failed to find music matches');
      setIsLoading(false);
    }
  };

  const findSharedInterests = (friend: Friend): string[] => {
    const currentUserProfile = {
      favoriteGenres: ['Pop', 'Rock', 'Romantic'],
      personalityTraits: ['happy', 'confident', 'social']
    };

    const sharedGenres = friend.favoriteGenres.filter(genre => 
      currentUserProfile.favoriteGenres.includes(genre)
    );

    const sharedTraits = friend.personalityTraits.filter(trait => 
      currentUserProfile.personalityTraits.includes(trait)
    );

    return [...sharedGenres, ...sharedTraits];
  };

  const generateMatchPlaylist = (friend: Friend): string[] => {
    const sharedInterests = findSharedInterests(friend);
    const playlist = [];

    if (sharedInterests.includes('Pop')) {
      playlist.push('Perfect Pop Hits');
    }
    if (sharedInterests.includes('Rock')) {
      playlist.push('Rock Anthems');
    }
    if (sharedInterests.includes('Romantic')) {
      playlist.push('Love Songs Collection');
    }
    if (sharedInterests.includes('energetic')) {
      playlist.push('High Energy Workout');
    }
    if (sharedInterests.includes('peaceful')) {
      playlist.push('Chill Vibes');
    }

    return playlist.length > 0 ? playlist : ['Mixed Favorites'];
  };

  const generateMatchReason = (friend: Friend, score: number): string => {
    if (score >= 80) {
      return 'Perfect music match! You have very similar tastes.';
    } else if (score >= 60) {
      return 'Great music compatibility! You\'ll enjoy similar tracks.';
    } else if (score >= 40) {
      return 'Good music match. Some overlapping preferences.';
    } else {
      return 'Different tastes, but great for discovering new music!';
    }
  };

  const createGroupPlaylist = () => {
    // Mock implementation
    const newPlaylist: GroupPlaylist = {
      id: Date.now().toString(),
      name: `Group Jam ${new Date().toLocaleDateString()}`,
      participants: ['1', '2'], // Selected friends
      mood: 'happy',
      genres: ['Pop', 'Rock'],
      songs: [],
      createdAt: new Date()
    };

    setGroupPlaylists(prev => [newPlaylist, ...prev]);
  };

  const getCompatibilityColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getCompatibilityEmoji = (score: number): string => {
    if (score >= 80) return '💯';
    if (score >= 60) return '😊';
    if (score >= 40) return '👍';
    return '🎵';
  };

  const formatLastActive = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="social-music-matching p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">👥 Social Music Matching</h2>
        <p className="text-gray-600">Connect with friends and discover your music compatibility!</p>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'friends'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            👥 Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'matches'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            💝 Matches ({matches.length})
          </button>
          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'playlists'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🎵 Group Playlists ({groupPlaylists.length})
          </button>
        </div>
      </div>

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="friends-tab">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Your Music Friends</h3>
            <button
              onClick={findMusicMatches}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '🔍 Finding...' : '💝 Find Matches'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map(friend => (
              <div key={friend.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-3xl">{friend.avatar}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{friend.name}</h4>
                    <p className="text-sm text-gray-600">
                      Last active {formatLastActive(friend.lastActive)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl">
                      {friend.currentMood === 'happy' ? '😊' :
                       friend.currentMood === 'peaceful' ? '🧘' :
                       friend.currentMood === 'party' ? '🎉' :
                       friend.currentMood === 'confident' ? '💪' : '😎'}
                    </span>
                    <p className="text-xs text-gray-600">{friend.currentMood}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-sm font-medium mb-1">Favorite Genres:</div>
                  <div className="flex flex-wrap gap-1">
                    {friend.favoriteGenres.map(genre => (
                      <span key={genre} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Personality:</div>
                  <div className="flex flex-wrap gap-1">
                    {friend.personalityTraits.map(trait => (
                      <span key={trait} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matches Tab */}
      {activeTab === 'matches' && (
        <div className="matches-tab">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Your Music Matches</h3>
            {matches.length === 0 && (
              <button
                onClick={findMusicMatches}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '🔍 Finding...' : '💝 Find Matches'}
              </button>
            )}
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin text-4xl mb-4">🔍</div>
              <p>Analyzing music compatibility...</p>
            </div>
          )}

          {!isLoading && matches.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              <div className="text-4xl mb-4">💝</div>
              <p>No matches found yet. Click "Find Matches" to discover your music compatibility!</p>
            </div>
          )}

          {!isLoading && matches.length > 0 && (
            <div className="space-y-4">
              {matches.map(match => (
                <div key={match.friendId} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCompatibilityEmoji(match.compatibilityScore)}</span>
                      <div>
                        <h4 className="font-semibold">{match.friendName}</h4>
                        <p className="text-sm text-gray-600">{match.matchReason}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full font-medium ${getCompatibilityColor(match.compatibilityScore)}`}>
                      {match.compatibilityScore}% Match
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-sm font-medium mb-1">Shared Interests:</div>
                    <div className="flex flex-wrap gap-1">
                      {match.sharedInterests.map(interest => (
                        <span key={interest} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Recommended Playlist:</div>
                    <div className="flex flex-wrap gap-1">
                      {match.recommendedPlaylist.map(playlist => (
                        <span key={playlist} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          🎵 {playlist}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Group Playlists Tab */}
      {activeTab === 'playlists' && (
        <div className="playlists-tab">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Group Playlists</h3>
            <button
              onClick={createGroupPlaylist}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              🎵 Create Group Playlist
            </button>
          </div>

          {groupPlaylists.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <div className="text-4xl mb-4">🎵</div>
              <p>No group playlists yet. Create one with your friends!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupPlaylists.map(playlist => (
                <div key={playlist.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{playlist.name}</h4>
                      <p className="text-sm text-gray-600">
                        Created {playlist.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">
                        {playlist.mood === 'party' ? '🎉' :
                         playlist.mood === 'peaceful' ? '🧘' :
                         playlist.mood === 'happy' ? '😊' : '🎵'}
                      </span>
                      <span className="text-sm text-gray-600">{playlist.mood}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-sm font-medium mb-1">Participants:</div>
                    <div className="flex items-center space-x-2">
                      {playlist.participants.map(participantId => {
                        const friend = friends.find(f => f.id === participantId);
                        return friend ? (
                          <span key={participantId} className="text-lg">
                            {friend.avatar}
                          </span>
                        ) : null;
                      })}
                      <span className="text-sm text-gray-600">
                        {playlist.participants.length} friends
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Genres:</div>
                    <div className="flex flex-wrap gap-1">
                      {playlist.genres.map(genre => (
                        <span key={genre} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-section mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
