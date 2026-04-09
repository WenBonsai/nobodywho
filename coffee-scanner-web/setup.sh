#!/bin/bash
# Coffee Scanner - Quick Start Script

set -e

echo "☕ Coffee Scanner - Quick Start Setup"
echo "======================================"
echo ""

# Check Python
echo "📍 Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python 3.10+"
    exit 1
fi
echo "✓ Python found: $(python3 --version)"

# Check Node
echo "📍 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "✓ Node found: $(node --version)"

# Install backend dependencies
echo ""
echo "📦 Installing Python dependencies..."
cd "$(dirname "$0")"
pip install -r requirements.txt

# Install frontend dependencies
echo ""
echo "📦 Installing Node dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "==========="
echo ""
echo "1. Download vision model (Gemma 3 4B recommended):"
echo "   wget https://huggingface.co/unsloth/gemma-3-4b-it-GGUF/resolve/main/gemma-3-4b-it-Q4_K_M.gguf"
echo ""
echo "2. Download mmproj projection model:"
echo "   wget https://huggingface.co/unsloth/gemma-3-4b-it-GGUF/resolve/main/mmproj-F16.gguf"
echo ""
echo "3. Start the backend (in a terminal):"
echo "   export MODEL_PATH=\"./gemma-3-4b-it-Q4_K_M.gguf\""
echo "   export PROJECTION_PATH=\"./mmproj-F16.gguf\""
echo "   python backend.py"
echo ""
echo "4. Start the frontend (in another terminal):"
echo "   npm run dev"
echo ""
echo "5. Open your browser:"
echo "   http://localhost:5173"
echo ""
echo "For more information, see README.md"
