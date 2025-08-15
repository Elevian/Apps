#!/bin/bash

# 🚀 Gutenberg Character Analysis - Quick Setup
# Gets you analyzing books in under 5 minutes!

echo "📚 Setting up Gutenberg Character Analysis..."
echo ""

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION detected. Please upgrade to Node.js 18+."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Navigate to client directory
cd client || {
    echo "❌ Client directory not found. Run this script from the project root."
    exit 1
}

echo "📦 Installing dependencies..."
if command -v pnpm &> /dev/null; then
    echo "   Using pnpm..."
    pnpm install
elif command -v yarn &> /dev/null; then
    echo "   Using yarn..."
    yarn install
else
    echo "   Using npm..."
    npm install
fi

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Check if Ollama is available (optional)
if command -v ollama &> /dev/null; then
    echo "🤖 Ollama detected - checking for models..."
    if ollama list | grep -q "llama2\|mistral"; then
        echo "✅ LLM models available - AI features enabled"
    else
        echo "💡 Consider installing a model: ollama pull llama2"
    fi
else
    echo "💡 Ollama not found - AI features will use fallback (optional)"
    echo "   Install from: https://ollama.ai/ for enhanced character extraction"
fi

echo ""
echo "🎉 Setup complete! Starting development server..."
echo ""
echo "📖 Try these sample books:"
echo "   • 84 (Frankenstein)"
echo "   • 1342 (Pride & Prejudice)" 
echo "   • 2701 (Moby Dick)"
echo ""

# Start development server
if command -v pnpm &> /dev/null; then
    pnpm dev
elif command -v yarn &> /dev/null; then
    yarn dev
else
    npm run dev
fi
