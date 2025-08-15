# 📚 Gutenberg Character Analysis

> AI-powered character network analysis for Project Gutenberg books with advanced visualization, sentiment analysis, and interactive insights.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple.svg)](https://web.dev/progressive-web-apps/)

## 🚀 Quick Start

**Get analyzing in under 5 minutes:**

```bash
# Clone the repository
git clone <repository-url>
cd gutenberg-characters

# Install dependencies and start development
cd client
npm install
npm run dev

# Open browser to http://localhost:5173
# Try analyzing: 84 (Frankenstein), 1342 (Pride & Prejudice), or 2701 (Moby Dick)
```

## ✨ Features

### 📊 **Advanced Character Analysis**
- **AI-Powered Extraction**: Ollama LLM integration with intelligent fallbacks
- **Network Visualization**: Interactive force-directed graphs with community detection
- **Sentiment Analysis**: AFINN-based quote sentiment with negation handling
- **Character Timelines**: Mentions-per-chapter visualization with sparklines

### 🎨 **Modern User Experience**
- **Single Page App**: Seamless flow without navigation complexity
- **Real-time Progress**: Live analysis tracking with Web Workers
- **Multiple Export Formats**: PDF reports, PNG/JSON/CSV/GEXF data export
- **Responsive Design**: Perfect on desktop, tablet, and mobile

### 🌐 **Internationalization & Accessibility**
- **Bilingual Support**: English and Arabic with proper RTL layout
- **Full Keyboard Navigation**: All features accessible via keyboard
- **WCAG Compliant**: Screen reader support and high contrast modes
- **Performance Optimized**: ≥50 FPS during graph interactions

### 🔒 **Privacy & Security**
- **Local-Only Mode**: Complete offline operation
- **Smart Caching**: IndexedDB storage with automatic cleanup
- **Privacy Controls**: Granular settings for data handling
- **PWA Support**: Installable with offline analysis capabilities

## 📋 System Requirements

### **Minimum Requirements**
- **Node.js**: 18+ 
- **npm/pnpm**: Latest version
- **Browser**: Modern browser with ES2020 support
- **Memory**: 4GB RAM (8GB+ recommended for large books)

### **Optional Requirements**
- **Ollama**: For advanced LLM-based character extraction
- **HTTPS**: For PWA installation (development uses HTTP)

## 🛠️ Installation & Setup

### **1. Basic Setup**

```bash
# Clone and setup
git clone <repository-url>
cd gutenberg-characters/client

# Install dependencies
npm install
# or with pnpm
pnpm install

# Start development server
npm run dev
```

### **2. Optional: Ollama Integration**

For enhanced AI-powered character extraction:

```bash
# Install Ollama (macOS/Linux)
curl -fsSL https://ollama.ai/install.sh | sh

# Install Ollama (Windows)
# Download from https://ollama.ai/download

# Pull a model (recommended: llama2 or mistral)
ollama pull llama2

# Start Ollama service
ollama serve
```

**Ollama Configuration:**
- **Default URL**: `http://localhost:11434`
- **Recommended Models**: `llama2`, `mistral`, `codellama`
- **Fallback**: App automatically uses heuristic analysis if Ollama unavailable

### **3. Environment Configuration**

Create `.env.local` for custom settings:

```env
# Ollama Configuration
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama2

# Performance Settings
VITE_MAX_CHARACTERS=100
VITE_TARGET_FPS=50
VITE_CACHE_SIZE_MB=100

# Development
VITE_DEV_MODE=true
```

## 🎯 Usage Guide

### **Basic Analysis Workflow**

1. **Enter Book ID**: Use sample IDs or find books at [gutenberg.org](https://gutenberg.org)
   - `84` - Frankenstein (Mary Shelley)
   - `1342` - Pride and Prejudice (Jane Austen)  
   - `2701` - Moby Dick (Herman Melville)

2. **Choose Analysis Mode**:
   - **Auto**: Best available method (LLM → heuristic fallback)
   - **Heuristic**: Fast NLP-based extraction
   - **Manual**: Import your own character list

3. **Explore Results**:
   - **Network Graph**: Interactive character relationships
   - **Character Insights**: Rankings, importance scores, sentiment
   - **Quote Analysis**: Searchable quotes with sentiment scores
   - **Timeline Charts**: Character mentions across chapters

### **Advanced Features**

#### **Graph Interaction**
```typescript
// Ego View: Click any character to isolate their network
// Community Detection: Automatic color-coded character groups
// Export Options: PNG, JSON, CSV, GEXF formats
// Performance: Auto-optimizes for ≥50 FPS on large graphs
```

#### **Compare Mode**
- **Side-by-side Analysis**: Compare character networks across books
- **Overlay Visualization**: Unified graph with contrasting styles
- **Metric Comparison**: Network density, character overlap, sentiment

#### **Export & Sharing**
- **PDF Reports**: Professional multi-page analysis documents
- **Data Export**: Raw data in researcher-friendly formats
- **Share URLs**: Compressed state sharing via URL
- **Offline Access**: PWA installation with cached analyses

## 🎨 Theming & Customization

### **Built-in Themes**
- **Light Theme**: Clean, professional appearance
- **Dark Theme**: Eye-friendly for extended analysis sessions  
- **System Theme**: Automatically matches OS preference

### **Theme Switching**
```tsx
// Via Floating FAB (bottom-right)
<FloatingFABCluster />

// Programmatic access
const { theme, setTheme } = useTheme()
setTheme('dark') // 'light' | 'dark' | 'system'
```

### **Custom Theme Development**

1. **CSS Variables**: Modify theme colors in `src/index.css`
```css
:root {
  --primary: 262.1 83.3% 57.8%;    /* Purple primary */
  --secondary: 210 40% 96%;         /* Light gray */
  --accent: 210 40% 96%;            /* Accent color */
  /* ... more variables */
}
```

2. **Component Theming**: Use Tailwind classes with theme awareness
```tsx
className="bg-background text-foreground border-border"
```

3. **Chart Colors**: Customize visualization colors
```typescript
const chartColors = {
  '--chart-1': '262.1 83.3% 57.8%',  // Network nodes
  '--chart-2': '197 37% 24%',         // Connections
  '--chart-3': '120 54% 50%',         // Sentiment positive
  '--chart-4': '45 93% 47%',          // Sentiment neutral
  '--chart-5': '14 100% 57%'          // Sentiment negative
}
```

## 🔧 Adding New Analysis Types

### **1. Create Analysis Module**

```typescript
// src/lib/analysis/my-analysis.ts
export interface MyAnalysisResult {
  metric: number
  insights: string[]
}

export class MyAnalyzer {
  analyze(text: string, characters: Character[]): MyAnalysisResult {
    // Your analysis logic here
    return {
      metric: 42,
      insights: ['Insight 1', 'Insight 2']
    }
  }
}
```

### **2. Integrate with Worker**

```typescript
// src/workers/analysis.worker.ts
import { MyAnalyzer } from '../lib/analysis/my-analysis'

// Add to AnalysisResult interface
export interface AnalysisResult {
  // ... existing fields
  myAnalysis: MyAnalysisResult
}

// Add to analyzeText method
const myAnalyzer = new MyAnalyzer()
const myAnalysis = myAnalyzer.analyze(text, characters)

return {
  // ... existing results
  myAnalysis
}
```

### **3. Add UI Component**

```tsx
// src/components/ui/my-analysis-display.tsx
export function MyAnalysisDisplay({ result }: { result: MyAnalysisResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div>Metric: {result.metric}</div>
        <ul>
          {result.insights.map(insight => (
            <li key={insight}>{insight}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
```

### **4. Include in Results**

```tsx
// src/components/sections/enhanced-insights-section.tsx
import { MyAnalysisDisplay } from '@/components/ui/my-analysis-display'

// Add to insights section
{characterResults?.myAnalysis && (
  <MyAnalysisDisplay result={characterResults.myAnalysis} />
)}
```

## 🌍 Internationalization (i18n)

### **Supported Languages**
- **English (en)**: Default language
- **Arabic (ar)**: Full RTL support with proper text direction

### **Language Switching**
```tsx
// Via Floating FAB
<FloatingFABCluster />

// Programmatic
import { useTranslation } from 'react-i18next'
const { i18n } = useTranslation()
i18n.changeLanguage('ar') // Switch to Arabic
```

### **Adding New Languages**

1. **Create Translation File**
```json
// src/lib/i18n/locales/fr.json
{
  "common": {
    "analyze": "Analyser",
    "export": "Exporter",
    "share": "Partager"
  },
  "analyzer": {
    "title": "Analyseur de Caractères",
    "placeholder": "Entrez l'ID du livre"
  }
}
```

2. **Register Language**
```typescript
// src/lib/i18n/index.ts
const resources = {
  en: { translation: en },
  ar: { translation: ar },
  fr: { translation: fr }  // Add new language
}
```

3. **Add Language Switcher Option**
```tsx
// src/components/ui/floating-fab-cluster.tsx
const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' }
]
```

## 📱 PWA & Offline Support

### **Installation**
1. **Desktop**: Look for install prompt in address bar
2. **Mobile**: Use "Add to Home Screen" from browser menu
3. **Manual**: Click install button when available

### **Offline Features**
- **Cached Analyses**: Last N analyzed books available offline
- **Local Storage**: Complete analysis state preserved
- **Graceful Degradation**: Features adapt when offline
- **Background Sync**: Updates when connection restored

### **PWA Configuration**
```json
// public/manifest.json
{
  "name": "Gutenberg Character Analysis",
  "short_name": "Gutenberg Insights",
  "description": "AI-powered character analysis for literature",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#8b5cf6",
  "background_color": "#ffffff"
}
```

## ⚡ Performance Optimization

### **Automatic Optimizations**
- **Web Workers**: All heavy computation in background threads
- **Smart Caching**: IndexedDB with intelligent cleanup
- **Performance Monitoring**: Real-time FPS tracking
- **Adaptive Rendering**: Quality scales based on device performance

### **Performance Targets**
| Metric | Target | Implementation |
|--------|--------|----------------|
| **Graph FPS** | ≥50 FPS | Auto-quality scaling |
| **Analysis Speed** | <30s for 500KB text | Web Workers + streaming |
| **Memory Usage** | <500MB peak | Efficient data structures |
| **Cache Hit Rate** | >90% for repeated books | Smart IndexedDB caching |

### **Manual Performance Controls**
```tsx
// Graph quality levels
setRenderLevel('full')    // Maximum quality
setRenderLevel('medium')  // Balanced performance
setRenderLevel('minimal') // Maximum performance

// Cache management
cacheManager.setMaxSize(100 * 1024 * 1024) // 100MB limit
cacheManager.cleanup() // Manual cleanup
```

## 🚀 Deployment

### **Development**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run test suite
npm run lint         # Check code quality
```

### **Production Build**
```bash
# Build optimized bundle
npm run build

# Serve static files
npx serve dist

# Or deploy to your hosting platform
# - Vercel: vercel deploy
# - Netlify: netlify deploy
# - GitHub Pages: npm run deploy
```

### **Environment Variables**
```bash
# Production optimizations
NODE_ENV=production
VITE_PWA_ENABLED=true
VITE_ANALYTICS_ENABLED=false

# Performance settings
VITE_CACHE_SIZE_MB=500
VITE_MAX_WORKERS=4
```

## 🔍 Troubleshooting

### **Common Issues**

#### **"Analysis not starting"**
- ✅ Check internet connection for book download
- ✅ Verify book ID exists on gutenberg.org
- ✅ Clear browser cache and reload

#### **"Poor graph performance"**
- ✅ Enable automatic quality scaling
- ✅ Reduce character count (increase min mentions)
- ✅ Close other browser tabs to free memory

#### **"Ollama not working"**
- ✅ Verify Ollama is running: `ollama serve`
- ✅ Check model is installed: `ollama list`
- ✅ Test connection: `curl http://localhost:11434/api/tags`

#### **"PWA not installing"**
- ✅ Use HTTPS in production
- ✅ Ensure manifest.json is accessible
- ✅ Check browser PWA support

### **Performance Tips**
1. **Large Books**: Use higher min edge weight (3-5)
2. **Slow Devices**: Enable minimal render mode
3. **Memory Issues**: Clear cache regularly
4. **Network Issues**: Enable local-only mode

## 🤝 Contributing

### **Development Setup**
```bash
# Fork and clone
git clone <your-fork-url>
cd gutenberg-characters/client

# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm run test

# Type checking
npm run type-check
```

### **Code Style**
- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code standards  
- **Prettier**: Automatic formatting
- **Conventional Commits**: Required for PR

### **Adding Features**
1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Implement with tests: `npm run test`
3. Update documentation: Edit README.md
4. Submit PR with clear description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Project Gutenberg**: Public domain literary texts
- **React Force Graph**: Interactive network visualization
- **shadcn/ui**: Beautiful, accessible UI components
- **Ollama**: Local LLM integration
- **Framer Motion**: Smooth animations and transitions

## 📞 Support

- **Documentation**: This README and inline code comments
- **Issues**: GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for questions and ideas

---

**🎯 Quick reminder**: You can analyze a book in under 5 minutes:
1. `npm run dev`
2. Enter book ID: `84`, `1342`, or `2701`
3. Click "Analyze Book"
4. Explore the interactive results!

Built with ❤️ for literature enthusiasts and researchers worldwide.
