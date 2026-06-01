/**
 * Maps image / mood context → Spotify audio targets and ranks tracks.
 */

const MOOD_GENRE_SEEDS = {
  happy: ["pop", "dance", "indie-pop"],
  sad: ["acoustic", "indie", "piano"],
  romantic: ["r-n-b", "acoustic", "indie"],
  energetic: ["dance", "edm", "hip-hop"],
  peaceful: ["ambient", "chill", "acoustic"],
  nostalgic: ["indie", "rock", "soul"],
  aggressive: ["metal", "hip-hop", "rock"],
  confident: ["hip-hop", "pop", "dance"],
  lonely: ["indie", "acoustic", "singer-songwriter"],
  party: ["dance", "edm", "house"],
  attitude: ["hip-hop", "trap", "pop"],
};

const SCENE_TARGETS = {
  gym: { energy: 0.88, danceability: 0.78, tempo: 128, valence: 0.65 },
  travel: { energy: 0.55, danceability: 0.5, tempo: 110, valence: 0.6, acousticness: 0.4 },
  night: { energy: 0.45, danceability: 0.55, tempo: 95, valence: 0.4 },
  rain: { energy: 0.32, danceability: 0.35, tempo: 85, valence: 0.35, acousticness: 0.55 },
  beach: { energy: 0.62, danceability: 0.65, tempo: 105, valence: 0.75 },
  couple: { energy: 0.42, danceability: 0.45, tempo: 92, valence: 0.55, acousticness: 0.45 },
  party: { energy: 0.9, danceability: 0.85, tempo: 124, valence: 0.8 },
  nature: { energy: 0.4, danceability: 0.4, tempo: 100, valence: 0.55, acousticness: 0.5 },
  morning: { energy: 0.58, danceability: 0.52, tempo: 108, valence: 0.7 },
};

const COLOR_ADJUST = {
  dark: { energy: -0.12, valence: -0.15 },
  warm: { valence: 0.08, acousticness: 0.1 },
  vibrant: { energy: 0.1, danceability: 0.1 },
  moody: { energy: -0.08, valence: -0.12, acousticness: 0.15 },
  neon: { energy: 0.15, danceability: 0.12 },
  golden: { valence: 0.1, acousticness: 0.08 },
  cool: { energy: -0.05, valence: 0.05, acousticness: 0.1 },
};

export function buildTargetsFromContext(ctx) {
  const mood = ctx.mood || "happy";
  const scene = ctx.scene || "selfie";
  const colorTone = ctx.colorTone || "warm";
  const analysis = ctx.imageAnalysis || {};

  let targets = {
    energy: 0.55,
    valence: 0.55,
    danceability: 0.55,
    tempo: 115,
    acousticness: 0.25,
    min_tempo: 70,
    max_tempo: 160,
  };

  const sceneT = SCENE_TARGETS[scene];
  if (sceneT) targets = { ...targets, ...sceneT };

  const moodEnergy = {
    happy: 0.7,
    sad: 0.3,
    romantic: 0.45,
    energetic: 0.85,
    peaceful: 0.35,
    nostalgic: 0.5,
    aggressive: 0.9,
    confident: 0.75,
    lonely: 0.35,
    party: 0.9,
    attitude: 0.8,
  };
  if (moodEnergy[mood] != null) {
    targets.energy = (targets.energy + moodEnergy[mood]) / 2;
  }

  const colorAdj = COLOR_ADJUST[colorTone];
  if (colorAdj) {
    if (colorAdj.energy) targets.energy = clamp(targets.energy + colorAdj.energy);
    if (colorAdj.valence) targets.valence = clamp(targets.valence + colorAdj.valence);
    if (colorAdj.danceability) targets.danceability = clamp(targets.danceability + (colorAdj.danceability || 0));
    if (colorAdj.acousticness) targets.acousticness = clamp((targets.acousticness || 0.25) + colorAdj.acousticness);
  }

  // Enhanced image analysis integration
  if (analysis.mood?.energy != null) {
    targets.energy = clamp(analysis.mood.energy / 10);
  }
  if (analysis.mood?.valence != null) {
    targets.valence = clamp(analysis.mood.valence);
  }
  
  // Use full color analysis
  if (analysis.colors?.brightness != null) {
    const brightness = analysis.colors.brightness;
    if (brightness < 0.35) {
      targets.energy = clamp(targets.energy - 0.1);
      targets.valence = clamp(targets.valence - 0.08);
      targets.acousticness = clamp((targets.acousticness || 0.25) + 0.1);
    } else if (brightness > 0.7) {
      targets.energy = clamp(targets.energy + 0.05);
      targets.valence = clamp(targets.valence + 0.05);
    }
  }
  
  if (analysis.colors?.warmth != null) {
    const warmth = analysis.colors.warmth;
    if (warmth > 0.6) {
      targets.valence = clamp(targets.valence + 0.08);
    } else if (warmth < 0.4) {
      targets.valence = clamp(targets.valence - 0.05);
      targets.acousticness = clamp((targets.acousticness || 0.25) + 0.08);
    }
  }
  
  if (analysis.colors?.saturation != null) {
    const saturation = analysis.colors.saturation;
    if (saturation > 0.6) {
      targets.energy = clamp(targets.energy + 0.08);
      targets.danceability = clamp(targets.danceability + 0.06);
    }
  }
  
  // Scene analysis integration
  if (analysis.scene?.lighting) {
    const lighting = analysis.scene.lighting;
    if (lighting === 'dark' || lighting === 'dim') {
      targets.energy = clamp(targets.energy - 0.12);
      targets.acousticness = clamp((targets.acousticness || 0.25) + 0.15);
      targets.tempo = Math.max(80, targets.tempo - 15);
    } else if (lighting === 'bright') {
      targets.energy = clamp(targets.energy + 0.08);
      targets.valence = clamp(targets.valence + 0.06);
    }
  }
  
  if (analysis.scene?.environment) {
    const environment = analysis.scene.environment;
    if (environment === 'outdoor') {
      targets.energy = clamp(targets.energy + 0.05);
      targets.acousticness = clamp((targets.acousticness || 0.25) + 0.05);
    } else if (environment === 'indoor') {
      targets.acousticness = clamp((targets.acousticness || 0.25) + 0.08);
    }
  }
  
  // Object-based adjustments
  if (analysis.objects && analysis.objects.length > 0) {
    const objectClasses = analysis.objects.map(o => o.class.toLowerCase());
    
    // Sports/fitness objects
    if (objectClasses.some(c => ['sports ball', 'person', 'tennis racket'].includes(c))) {
      targets.energy = clamp(targets.energy + 0.15);
      targets.tempo = Math.min(160, targets.tempo + 20);
    }
    
    // Relaxation objects
    if (objectClasses.some(c => ['book', 'cup', 'laptop', 'bed'].includes(c))) {
      targets.energy = clamp(targets.energy - 0.1);
      targets.acousticness = clamp((targets.acousticness || 0.25) + 0.12);
      targets.tempo = Math.max(85, targets.tempo - 15);
    }
    
    // Party/social objects
    if (objectClasses.some(c => ['wine glass', 'bottle', 'chair'].includes(c))) {
      targets.energy = clamp(targets.energy + 0.1);
      targets.danceability = clamp(targets.danceability + 0.1);
    }
  }
  
  // Face analysis integration
  if (analysis.faces?.detected) {
    const faceCount = analysis.faces.count || 1;
    const emotion = analysis.faces.emotion;
    
    if (emotion === 'happy' || emotion === 'surprised') {
      targets.valence = clamp(targets.valence + 0.1);
      targets.energy = clamp(targets.energy + 0.05);
    } else if (emotion === 'sad' || emotion === 'fear') {
      targets.valence = clamp(targets.valence - 0.12);
      targets.energy = clamp(targets.energy - 0.08);
      targets.acousticness = clamp((targets.acousticness || 0.25) + 0.1);
    }
    
    // Group photos tend to be more energetic
    if (faceCount >= 3) {
      targets.energy = clamp(targets.energy + 0.08);
      targets.danceability = clamp(targets.danceability + 0.06);
    }
  }
  
  // Activity-based adjustments
  if (analysis.activity) {
    const activity = analysis.activity.toLowerCase();
    if (activity.includes('gym') || activity.includes('workout') || activity.includes('running')) {
      targets.energy = clamp(targets.energy + 0.2);
      targets.tempo = Math.min(170, targets.tempo + 25);
      targets.danceability = clamp(targets.danceability + 0.12);
    } else if (activity.includes('relax') || activity.includes('chill') || activity.includes('sleep')) {
      targets.energy = clamp(targets.energy - 0.15);
      targets.acousticness = clamp((targets.acousticness || 0.25) + 0.15);
      targets.tempo = Math.max(75, targets.tempo - 20);
    } else if (activity.includes('party') || activity.includes('dance') || activity.includes('club')) {
      targets.energy = clamp(targets.energy + 0.18);
      targets.danceability = clamp(targets.danceability + 0.15);
      targets.tempo = Math.min(165, targets.tempo + 20);
    } else if (activity.includes('travel') || activity.includes('road') || activity.includes('drive')) {
      targets.energy = clamp(targets.energy + 0.05);
      targets.valence = clamp(targets.valence + 0.08);
    }
  }

  targets.min_tempo = Math.max(60, Math.round(targets.tempo - 40));
  targets.max_tempo = Math.min(200, Math.round(targets.tempo + 45));

  const genres = MOOD_GENRE_SEEDS[mood] || ["pop", "indie"];
  const vibe = analysis.mood?.reasoning?.[0] || analysis.scene?.type || analysis.activity || scene;

  return { targets, genres, vibe, mood, scene, colorTone };
}

function clamp(n) {
  return Math.max(0, Math.min(1, n));
}

function featureDistance(features, targets) {
  if (!features) return 1;
  const dims = [
    ["energy", targets.energy, 0.28],
    ["valence", targets.valence, 0.22],
    ["danceability", targets.danceability, 0.18],
    ["acousticness", targets.acousticness ?? 0.25, 0.12],
  ];
  let sum = 0;
  let w = 0;
  for (const [key, target, weight] of dims) {
    const actual = features[key] ?? 0.5;
    sum += Math.abs(actual - target) * weight;
    w += weight;
  }
  const tempoDiff = Math.abs((features.tempo || 120) - (targets.tempo || 120));
  sum += (tempoDiff / 120) * 0.2;
  w += 0.2;
  return sum / w;
}

export function rankSpotifyTracks(tracks, featuresById, context, options = {}) {
  const { targets, vibe, mood, scene, colorTone } = buildTargetsFromContext(context);
  const recentIds = new Set(options.recentSongIds || []);
  const skippedIds = new Set(options.skippedIds || []);
  const imageSeed = options.imageSeed || "";
  const usedArtists = new Map();
  const usedGenres = new Map();
  const usedLanguages = new Map();

  const scored = tracks
    .filter((t) => !skippedIds.has(t.id))
    .map((track) => {
      const spotifyId = track.spotify_id || track.id.replace(/^spotify_/, "");
      const features = featuresById[spotifyId];
      const dist = featureDistance(features, targets);
      let score = 1 - dist;

      // Enhanced time-decay penalties
      if (recentIds.has(track.id)) score -= 0.45;
      if (track.is_trending) score += 0.08;
      score += ((track.play_count || 0) / 1e9) * 0.05;
      score += ((imageSeed.length % 7) * 0.002);

      const artistKey = track.artist.toLowerCase();
      const genreKey = track.genre;
      const langKey = track.language || "unknown";
      const artistCount = usedArtists.get(artistKey) || 0;
      const genreCount = usedGenres.get(genreKey) || 0;
      const langCount = usedLanguages.get(langKey) || 0;

      // Enhanced diversity penalties
      if (artistCount >= 2) score -= 0.25; // up from 0.15
      if (genreCount >= 3) score -= 0.20; // up from 0.12
      if (langCount >= 4) score -= 0.15; // new: avoid same language

      // Penalize related genres
      if (genreCount >= 2) {
        const relatedGenres = getRelatedGenres(genreKey);
        const relatedCount = relatedGenres.reduce((sum, rg) => sum + (usedGenres.get(rg) || 0), 0);
        if (relatedCount > 0) score -= 0.10;
      }

      const explanation = buildExplanation({
        track,
        mood,
        scene,
        colorTone,
        vibe,
        features,
        targets,
      });

      // Calculate confidence
      const baseConfidence = Math.max(0.60, Math.min(0.99, score));
      const confidencePercent = Math.round(baseConfidence * 100);

      return {
        ...track,
        matchScore: Math.max(0, Math.min(1, score)),
        reason: explanation,
        confidencePercent,
        audio_features: features
          ? {
              tempo: features.tempo,
              energy: features.energy,
              valence: features.valence,
              danceability: features.danceability,
            }
          : undefined,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  const diverse = [];
  for (const item of scored) {
    const ak = item.artist.toLowerCase();
    const gk = item.genre;
    const lk = item.language || "unknown";
    if ((usedArtists.get(ak) || 0) >= 2) continue;
    if ((usedGenres.get(gk) || 0) >= 3) continue;
    if ((usedLanguages.get(lk) || 0) >= 4) continue;
    diverse.push(item);
    usedArtists.set(ak, (usedArtists.get(ak) || 0) + 1);
    usedGenres.set(gk, (usedGenres.get(gk) || 0) + 1);
    usedLanguages.set(lk, (usedLanguages.get(lk) || 0) + 1);
    if (diverse.length >= (options.limit || 12)) break;
  }

  return {
    songs: diverse,
    targets,
    genres,
  };
}

function getRelatedGenres(genre) {
  const relatedMap = {
    "dance": ["edm", "house", "electronic", "techno"],
    "edm": ["dance", "house", "electronic", "techno"],
    "house": ["dance", "edm", "electronic"],
    "hip-hop": ["rap", "trap", "urban"],
    "rap": ["hip-hop", "trap"],
    "trap": ["hip-hop", "rap"],
    "rock": ["metal", "indie", "alternative"],
    "metal": ["rock", "heavy"],
    "pop": ["dance", "electronic"],
    "indie": ["rock", "alternative"],
  };
  return relatedMap[genre.toLowerCase()] || [];
}

function buildExplanation({ track, mood, scene, colorTone, vibe, features, targets }) {
  const parts = [];
  parts.push(`Matches your ${mood} mood`);
  if (scene && scene !== "selfie") parts.push(`fits a ${scene.replace("_", " ")} scene`);
  if (colorTone) parts.push(`${colorTone} color tones in the photo`);

  if (features) {
    if (features.energy >= (targets.energy || 0.5) + 0.15) parts.push("high energy like the image vibe");
    else if (features.energy <= (targets.energy || 0.5) - 0.15) parts.push("calm energy for a softer atmosphere");
    if (features.valence >= 0.65) parts.push("uplifting emotional tone");
    else if (features.valence <= 0.4) parts.push("melancholic emotional depth");
    if (features.tempo >= 120) parts.push(`upbeat tempo (~${Math.round(features.tempo)} BPM)`);
    else if (features.tempo <= 95) parts.push(`slow tempo (~${Math.round(features.tempo)} BPM)`);
  }

  if (track.is_trending) parts.push("trending on Spotify right now");

  const sentence = `This song matches because the image has a ${mood} ${scene} vibe with ${colorTone} tones${
    vibe ? ` (${vibe})` : ""
  }: ${parts.slice(0, 4).join(", ")}.`;

  return sentence;
}

export function buildSearchQueries(ctx) {
  const { mood, scene, userProfile } = ctx;
  const lang = userProfile?.preferred_languages?.[0] || "";
  const artist = userProfile?.favorite_artists?.[0];
  const genre = userProfile?.favorite_genres?.[0];
  const queries = [];

  if (artist) queries.push(`${artist} ${mood}`);
  if (genre) queries.push(`${genre} ${mood}`);
  queries.push(`${mood} ${scene} ${lang}`.trim());
  queries.push(`${scene} vibes ${mood}`);
  queries.push(`viral ${mood} songs`);

  return [...new Set(queries.filter(Boolean))].slice(0, 5);
}
