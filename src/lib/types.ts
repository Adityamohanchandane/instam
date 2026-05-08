export type Language = 'Hindi' | 'Marathi' | 'English' | 'Punjabi' | 'Telugu' | 'Tamil' | 'Bengali';
export type PersonalityTrait = 'gangster' | 'romantic' | 'chill' | 'emotional' | 'aesthetic' | 'spiritual' | 'attitude' | 'social';
export type Genre = 'Pop' | 'Hip-Hop' | 'R&B' | 'Romantic' | 'Folk' | 'Dance' | 'Indie' | 'Motivational' | 'Sad' | 'Spiritual' | 'Mass' | 'Party';
export type UsageIntent = 'stories' | 'reels' | 'posts';
export type AgeGroup = 'teen' | 'young-adult' | 'adult' | 'senior';
export type MoodType = 'happy' | 'sad' | 'attitude' | 'romantic' | 'energetic' | 'peaceful' | 'nostalgic' | 'aggressive' | 'confident' | 'lonely' | 'party';
export type SceneType = 'selfie' | 'travel' | 'gym' | 'night' | 'party' | 'nature' | 'couple' | 'alone' | 'friends' | 'city' | 'beach' | 'morning' | 'rain';
export type ColorTone = 'dark' | 'warm' | 'vibrant' | 'moody' | 'neon' | 'golden' | 'cool';

export interface UserProfile {
  id?: string;
  session_id: string;
  preferred_languages?: Language[];
  personality_traits?: PersonalityTrait[];
  favorite_genres?: Genre[];
  favorite_artists?: string[];
  usage_intent?: UsageIntent;
  age_group?: string;
  region?: string;
  name?: string;
  age?: number;
  music_taste?: string;
  _id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  language: string;
  genre: string;
  mood_tags: string[];
  scene_tags: string[];
  personality_tags: string[];
  color_tone_tags: string[];
  energy_level: number;
  is_trending: boolean;
  trend_region: string;
  play_count: number;
  youtube_query: string;
}

export interface RecommendationResult {
  songs: SongWithReason[];
  safeChoice: SongWithReason;
  uniquePick: SongWithReason;
}

export interface SongWithReason extends Song {
  reason: string;
  matchScore: number;
  label?: 'safe' | 'unique' | 'trending';
}

export interface RecommendationInput {
  userProfile: UserProfile;
  imageMood: MoodType;
  imageScene: SceneType;
  imageColorTone: ColorTone;
  userMoodOverride?: MoodType | '';
}

export interface FeedbackAction {
  session_id: string;
  song_id: string;
  recommendation_session_id?: string;
  action: 'liked' | 'skipped' | 'selected';
}
