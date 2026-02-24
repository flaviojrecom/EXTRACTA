#!/bin/bash
set -e

echo ""
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║         EXTRACTA — Quick Setup            ║"
echo "  ║   AI-Powered Knowledge Extraction Engine   ║"
echo "  ╚═══════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install Node.js 18+ first:"
  echo "   https://nodejs.org or: brew install node"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required. Found: $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps
echo ""

# Build library
echo "🔨 Building EXTRACTA engine..."
npm run build
echo ""

# Install web dependencies
echo "📦 Installing web dependencies..."
cd web && npm install --legacy-peer-deps && cd ..
echo ""

echo "✅ Setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🌐 Web UI:   npm run web"
echo "  💻 CLI:      npm run extracta -- process <file>"
echo ""
echo "  Examples:"
echo "    npm run extracta -- process doc.pdf"
echo "    npm run extracta -- process book.epub --preset rag"
echo "    npm run extracta -- process page.html --preset fine-tuning"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
