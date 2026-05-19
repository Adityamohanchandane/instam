/**
 * Server-side environment validation. Keys are never logged.
 */

const OPTIONAL_KEYS = [
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "CLAUDE_API_KEY",
  "ANTHROPIC_API_KEY",
  "MONGODB_URI",
  "SPOTIFY_CLIENT_ID",
  "SPOTIFY_CLIENT_SECRET",
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
  "INSTAGRAM_APP_ID",
  "INSTAGRAM_APP_SECRET",
];

const VITE_ALIASES = {
  OPENAI_API_KEY: "VITE_OPENAI_API_KEY",
  GEMINI_API_KEY: "VITE_GEMINI_API_KEY",
  CLAUDE_API_KEY: "VITE_CLAUDE_API_KEY",
  ANTHROPIC_API_KEY: "VITE_ANTHROPIC_API_KEY",
  MONGODB_URI: "VITE_MONGODB_URI",
  SPOTIFY_CLIENT_ID: "VITE_SPOTIFY_CLIENT_ID",
  SPOTIFY_CLIENT_SECRET: "VITE_SPOTIFY_CLIENT_SECRET",
  YOUTUBE_CLIENT_ID: "VITE_YOUTUBE_CLIENT_ID",
  YOUTUBE_CLIENT_SECRET: "VITE_YOUTUBE_CLIENT_SECRET",
};

export function getEnv(name) {
  const direct = process.env[name];
  if (direct) return direct;
  const alias = VITE_ALIASES[name];
  return alias ? process.env[alias] : undefined;
}

export function validateServerEnv() {
  const status = {
    openai: Boolean(getEnv("OPENAI_API_KEY")),
    gemini: Boolean(getEnv("GEMINI_API_KEY")),
    claude: Boolean(
      getEnv("CLAUDE_API_KEY") || getEnv("ANTHROPIC_API_KEY"),
    ),
    mongodb: Boolean(getEnv("MONGODB_URI")),
    spotify: Boolean(getEnv("SPOTIFY_CLIENT_ID") && getEnv("SPOTIFY_CLIENT_SECRET")),
    youtube: Boolean(getEnv("YOUTUBE_CLIENT_ID") && getEnv("YOUTUBE_CLIENT_SECRET")),
    instagram: Boolean(getEnv("INSTAGRAM_APP_ID") && getEnv("INSTAGRAM_APP_SECRET")),
    deezer: true,
  };

  const configured = Object.entries(status)
    .filter(([, ok]) => ok)
    .map(([name]) => name);

  const missingOptional = OPTIONAL_KEYS.filter((key) => {
    if (key === "ANTHROPIC_API_KEY" && getEnv("CLAUDE_API_KEY")) return false;
    return !getEnv(key);
  });

  console.log("🔧 Instam server env check");
  console.log(`   Configured: ${configured.join(", ") || "none"}`);
  if (missingOptional.length > 0) {
    console.log(
      `   Optional not set (${missingOptional.length}): AI/OAuth features may be limited`,
    );
  }

  if (!status.openai && !status.gemini && !status.claude) {
    console.warn(
      "⚠️  No AI provider keys found. Image analysis will use browser TensorFlow only.",
    );
  }

  return status;
}

export function getClaudeApiKey() {
  return getEnv("CLAUDE_API_KEY") || getEnv("ANTHROPIC_API_KEY");
}
