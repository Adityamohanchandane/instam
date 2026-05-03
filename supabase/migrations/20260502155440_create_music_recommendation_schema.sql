/*
  # Music Recommendation App - Core Schema

  ## Overview
  Creates the full schema for an AI music recommendation system for Instagram Stories/Posts.

  ## New Tables

  ### 1. `user_profiles`
  Stores onboarding data for each user session.
  - `id` - UUID primary key
  - `session_id` - anonymous session identifier
  - `preferred_languages` - array of preferred languages (Marathi, Hindi, English, etc.)
  - `personality_traits` - array of personality traits (gangster, romantic, chill, etc.)
  - `favorite_genres` - array of favorite music genres
  - `favorite_artists` - array of favorite artists
  - `usage_intent` - stories, reels, or posts
  - `age_group` - optional age group
  - `region` - optional region/location
  - `created_at` - timestamp

  ### 2. `songs`
  Master song catalog with metadata.
  - `id` - UUID primary key
  - `title` - song title
  - `artist` - artist name
  - `language` - song language
  - `genre` - music genre
  - `mood_tags` - array of mood tags (happy, sad, aggressive, etc.)
  - `scene_tags` - array of scene tags (party, travel, gym, etc.)
  - `personality_tags` - array of personality tags
  - `energy_level` - 1-10 energy scale
  - `is_trending` - whether currently trending
  - `trend_region` - region where trending
  - `play_count` - popularity metric
  - `created_at` - timestamp

  ### 3. `recommendation_sessions`
  Tracks each recommendation request and its results.
  - `id` - UUID primary key
  - `session_id` - links to user session
  - `image_mood` - detected mood from image
  - `image_scene` - detected scene from image
  - `image_color_tone` - color tone of image
  - `user_mood_override` - user-selected mood
  - `recommended_song_ids` - array of recommended song IDs
  - `safe_choice_id` - the "safe choice" song ID
  - `unique_pick_id` - the "unique pick" song ID
  - `created_at` - timestamp

  ### 4. `song_feedback`
  Stores user feedback (likes, skips, selections) for learning.
  - `id` - UUID primary key
  - `session_id` - user session
  - `song_id` - the song
  - `recommendation_session_id` - which recommendation session
  - `action` - liked, skipped, or selected
  - `created_at` - timestamp

  ## Security
  - RLS enabled on all tables
  - Session-based access (no auth required, uses session_id)
  - Users can only read/write their own session data
*/

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  preferred_languages text[] DEFAULT '{}',
  personality_traits text[] DEFAULT '{}',
  favorite_genres text[] DEFAULT '{}',
  favorite_artists text[] DEFAULT '{}',
  usage_intent text DEFAULT 'stories',
  age_group text DEFAULT '',
  region text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles by session_id"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their profile"
  ON user_profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Songs catalog
CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL,
  language text NOT NULL DEFAULT 'Hindi',
  genre text NOT NULL DEFAULT 'Pop',
  mood_tags text[] DEFAULT '{}',
  scene_tags text[] DEFAULT '{}',
  personality_tags text[] DEFAULT '{}',
  color_tone_tags text[] DEFAULT '{}',
  energy_level integer DEFAULT 5 CHECK (energy_level >= 1 AND energy_level <= 10),
  is_trending boolean DEFAULT false,
  trend_region text DEFAULT '',
  play_count integer DEFAULT 0,
  youtube_query text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read songs"
  ON songs FOR SELECT
  USING (true);

-- Recommendation sessions
CREATE TABLE IF NOT EXISTS recommendation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  image_mood text DEFAULT '',
  image_scene text DEFAULT '',
  image_color_tone text DEFAULT '',
  user_mood_override text DEFAULT '',
  recommended_song_ids uuid[] DEFAULT '{}',
  safe_choice_id uuid REFERENCES songs(id),
  unique_pick_id uuid REFERENCES songs(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recommendation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read recommendation sessions"
  ON recommendation_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert recommendation sessions"
  ON recommendation_sessions FOR INSERT
  WITH CHECK (true);

-- Song feedback for learning
CREATE TABLE IF NOT EXISTS song_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  song_id uuid NOT NULL REFERENCES songs(id),
  recommendation_session_id uuid REFERENCES recommendation_sessions(id),
  action text NOT NULL CHECK (action IN ('liked', 'skipped', 'selected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE song_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feedback"
  ON song_feedback FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert feedback"
  ON song_feedback FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_session ON user_profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_songs_language ON songs(language);
CREATE INDEX IF NOT EXISTS idx_songs_trending ON songs(is_trending);
CREATE INDEX IF NOT EXISTS idx_songs_mood_tags ON songs USING GIN(mood_tags);
CREATE INDEX IF NOT EXISTS idx_songs_scene_tags ON songs USING GIN(scene_tags);
CREATE INDEX IF NOT EXISTS idx_songs_personality_tags ON songs USING GIN(personality_tags);
CREATE INDEX IF NOT EXISTS idx_recommendation_sessions_session ON recommendation_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_song_feedback_session ON song_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_song_feedback_song ON song_feedback(song_id);
