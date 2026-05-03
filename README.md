# Instam - AI Music for Your Moments

## 🎵 About

Instam is an AI-powered music recommendation app that suggests perfect songs for your social media stories based on your image mood, personality, and preferences.

## ✨ Features

- 🤖 **AI-Powered Recommendations** - Smart song matching based on image analysis
- 🌍 **Multi-Language Support** - English, Hindi, Marathi, Punjabi, Telugu, Tamil, Bengali
- 🎵 **Real Market Songs** - Actual chart-topping hits with millions of views
- 📱 **Modern UI** - Instagram-inspired design with smooth animations
- ⬇️ **Download & Set on Photo** - Complete music integration
- 🎨 **Beautiful Animations** - Floating music icons and dynamic backgrounds
- 🗄️ **MongoDB Integration** - Scalable NoSQL database for user data

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
