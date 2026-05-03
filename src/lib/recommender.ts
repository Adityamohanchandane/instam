import type { Song, SongWithReason, RecommendationInput, RecommendationResult, MoodType, SceneType, ColorTone } from './types';

// Mood compatibility map — which moods pair well together
const MOOD_COMPAT: Record<string, string[]> = {
  happy: ['happy', 'energetic', 'celebratory', 'romantic', 'party', 'confident'],
  sad: ['sad', 'emotional', 'melancholic', 'nostalgic', 'heartbreak', 'lonely', 'longing'],
  attitude: ['attitude', 'aggressive', 'confident', 'swag', 'dark', 'gangster'],
  romantic: ['romantic', 'love', 'longing', 'emotional', 'soft', 'dreamy'],
  energetic: ['energetic', 'motivational', 'party', 'confident', 'celebratory'],
  peaceful: ['peaceful', 'spiritual', 'devotional', 'dreamy', 'soft'],
  nostalgic: ['nostalgic', 'emotional', 'melancholic', 'friendship'],
  aggressive: ['aggressive', 'attitude', 'dark', 'intense', 'swag'],
  confident: ['confident', 'attitude', 'swag', 'energetic', 'motivational'],
  lonely: ['lonely', 'sad', 'alone', 'melancholic', 'nostalgic'],
  party: ['party', 'energetic', 'happy', 'celebratory', 'dance', 'vibrant'],
};

const SCENE_COMPAT: Record<string, string[]> = {
  selfie: ['selfie', 'street', 'party', 'friends', 'couple'],
  travel: ['travel', 'nature', 'adventure', 'morning', 'sunrise', 'beach'],
  gym: ['gym', 'sports', 'morning', 'street'],
  night: ['night', 'city', 'rooftop', 'drive', 'alone'],
  party: ['party', 'dance', 'wedding', 'celebration'],
  nature: ['nature', 'travel', 'sunrise', 'sunset', 'morning'],
  couple: ['couple', 'rain', 'sunset', 'night', 'rooftop'],
  alone: ['alone', 'rain', 'night', 'home'],
  friends: ['friends', 'travel', 'party', 'selfie'],
  city: ['city', 'night', 'street', 'drive'],
  beach: ['beach', 'travel', 'party', 'sunset'],
  morning: ['morning', 'nature', 'sunrise', 'gym'],
  rain: ['rain', 'alone', 'couple', 'night'],
};

const COLOR_COMPAT: Record<string, string[]> = {
  dark: ['dark', 'moody', 'neon'],
  warm: ['warm', 'golden'],
  vibrant: ['vibrant', 'neon', 'warm'],
  moody: ['moody', 'dark'],
  neon: ['neon', 'dark', 'vibrant'],
  golden: ['golden', 'warm'],
  cool: ['cool', 'dark', 'moody'],
};

function scoreLanguage(song: Song, preferredLangs: string[]): number {
  if (preferredLangs.length === 0) return 5;
  const langLower = song.language.toLowerCase();
  for (let i = 0; i < preferredLangs.length; i++) {
    if (langLower.includes(preferredLangs[i].toLowerCase())) {
      return 10 - i * 2; // first preferred language gets highest score
    }
  }
  return 0;
}

function scorePersonality(song: Song, traits: string[]): number {
  if (traits.length === 0) return 5;
  const matches = song.personality_tags.filter(t => traits.includes(t));
  return matches.length * 5;
}

function scoreMood(song: Song, mood: MoodType): number {
  const compat = MOOD_COMPAT[mood] || [mood];
  const matches = song.mood_tags.filter(t => compat.includes(t));
  return matches.length * 6;
}

function scoreScene(song: Song, scene: SceneType): number {
  const compat = SCENE_COMPAT[scene] || [scene];
  const matches = song.scene_tags.filter(t => compat.includes(t));
  return matches.length * 4;
}

function scoreColorTone(song: Song, colorTone: ColorTone): number {
  const compat = COLOR_COMPAT[colorTone] || [colorTone];
  const matches = song.color_tone_tags.filter(t => compat.includes(t));
  return matches.length * 3;
}

function scoreTrending(song: Song, region: string): number {
  if (!song.is_trending) return 0;
  if (region && song.trend_region.toLowerCase().includes(region.toLowerCase())) return 8;
  return 3;
}

function buildReason(song: Song, input: RecommendationInput): string {
  const { imageMood, imageScene, userProfile } = input;
  const mood = input.userMoodOverride || imageMood;

  const reasons: string[] = [];

  if (userProfile.preferred_languages.some(l => song.language.toLowerCase().includes(l.toLowerCase()))) {
    reasons.push(`in your preferred language (${song.language})`);
  }

  const moodMatches = song.mood_tags.filter(t => (MOOD_COMPAT[mood] || [mood]).includes(t));
  if (moodMatches.length > 0) {
    reasons.push(`captures a ${moodMatches[0]} vibe`);
  }

  const sceneMatches = song.scene_tags.filter(t => (SCENE_COMPAT[imageScene] || [imageScene]).includes(t));
  if (sceneMatches.length > 0) {
    reasons.push(`perfect for ${sceneMatches[0]} moments`);
  }

  if (song.is_trending) {
    reasons.push('currently trending');
  }

  if (reasons.length === 0) {
    reasons.push(`matches your ${userProfile.personality_traits[0] || 'unique'} personality`);
  }

  return reasons.slice(0, 2).join(' · ');
}

export function getRecommendations(songs: Song[], input: RecommendationInput, skippedIds: Set<string>): RecommendationResult {
  const mood = (input.userMoodOverride || input.imageMood) as MoodType;

  const scored: SongWithReason[] = songs
    .filter(s => !skippedIds.has(s.id))
    .map(song => {
      const langScore = scoreLanguage(song, input.userProfile.preferred_languages);
      const personalityScore = scorePersonality(song, input.userProfile.personality_traits);
      const moodScore = scoreMood(song, mood);
      const sceneScore = scoreScene(song, input.imageScene);
      const colorScore = scoreColorTone(song, input.imageColorTone);
      const trendScore = scoreTrending(song, input.userProfile.region);

      const matchScore = langScore + personalityScore + moodScore + sceneScore + colorScore + trendScore;

      return {
        ...song,
        reason: buildReason(song, input),
        matchScore,
      };
    });

  scored.sort((a, b) => b.matchScore - a.matchScore);

  const top = scored.slice(0, 8);

  // Safe choice: highest scored in preferred language
  const safeOptions = top.filter(s =>
    input.userProfile.preferred_languages.some(l => s.language.toLowerCase().includes(l.toLowerCase()))
  );
  const safeChoice: SongWithReason = {
    ...(safeOptions[0] || top[0]),
    label: 'safe',
  };

  // Unique pick: good score but NOT the top pick, different genre/vibe
  const uniqueOptions = top.filter(s => s.id !== safeChoice.id && s.genre !== safeChoice.genre);
  const uniquePick: SongWithReason = {
    ...(uniqueOptions[0] || top[1] || top[0]),
    label: 'unique',
  };

  // Mark trending songs
  const results = top.map(s => ({
    ...s,
    label: s.id === safeChoice.id ? 'safe' : s.id === uniquePick.id ? 'unique' : s.is_trending ? 'trending' : undefined,
  })) as SongWithReason[];

  return { songs: results, safeChoice, uniquePick };
}
