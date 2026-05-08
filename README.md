# Instam - AI Music for Your Moments

## 🎵 About

Instam is an AI-powered music recommendation app that suggests perfect songs for your social media stories based on your image mood, personality, and preferences.

## ✨ Features

- 🤖 **AI-Powered Recommendations** - Smart song matching based on image analysis
- 🧠 **Human-Like Mood Prediction** - AI that understands your mood like a friend
- 🔍 **Music Discovery** - Explore new artists, genres, and trending songs
- 🌍 **Multi-Language Support** - English, Hindi, Marathi, Punjabi, Telugu, Tamil, Bengali
- 🎵 **Real Market Songs** - Actual chart-topping hits with millions of views
- 📱 **Modern UI** - Instagram-inspired design with smooth animations
- ⬇️ **Download & Set on Photo** - Complete music integration
- 🎨 **Beautiful Animations** - Floating music icons and dynamic backgrounds
- 🗄️ **MongoDB Integration** - Scalable NoSQL database for user data
- 🔒 **Advanced Security** - End-to-end encryption and security monitoring
- 🎭 **Personality-Based Matching** - Songs that match your unique personality
- 📊 **Behavior Learning** - AI learns from your music preferences over time

## 🚀 Quick Start

### Option 1: With MongoDB (Recommended)

1. **Install MongoDB**
   ```bash
   # Windows: Download and install MongoDB Community Server
   # macOS: brew install mongodb-community
   # Ubuntu: sudo apt-get install mongodb
   ```

2. **Start MongoDB**
   ```bash
   # Windows: Start MongoDB service from Services
   # macOS/Linux: sudo systemctl start mongod
   # Or run: mongod
   ```

3. **Clone and setup**
   ```bash
   git clone https://github.com/Adityamohanchandane/instam.git
   cd instam
   npm install
   ```

4. **Setup MongoDB database**
   ```bash
   npm run setup-mongodb
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🧠 AI Features

### Smart Mood Prediction
Our AI understands human emotions and predicts your current mood based on:
- Time of day and day of week patterns
- Recent mood history and behavior
- Weather and environmental factors
- Social context and activities

### Music Discovery
Explore new music tailored to your taste:
- **Similar Artists**: Discover artists like your favorites
- **New Genres**: Branch out to related music styles
- **Trending Songs**: Stay updated with current hits
- **Mood-Based**: Songs that match your current emotional state

### Human-Like AI
The AI thinks like a human music expert:
- Understands emotional context and social situations
- Learns from your preferences over time
- Provides personalized recommendations with reasoning
- Adapts to your changing moods and tastes

## 🔒 Security Features

- **End-to-End Encryption**: All sensitive data is encrypted
- **Security Monitoring**: Real-time security alerts and monitoring
- **Safe API Calls**: Protected communication with external services
- **Data Privacy**: Your personal data stays secure and private
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
