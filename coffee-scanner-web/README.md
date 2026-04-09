# Coffee Scanner Web App - LLM-Powered Backend

This is a full-stack coffee label scanning application that uses NobodyWho's vision LLM capabilities to analyze coffee labels and generate brewing guides.

## Features

- **AI-Powered Label Analysis**: Uses vision-language models to extract coffee information from images
- **Automatic Brew Guide Generation**: LLM generates detailed brewing instructions based on coffee type
- **Camera & File Upload**: Scan coffee labels with camera or upload images
- **Offline-First**: Runs locally with no API calls (except to your own backend)
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

```
┌─────────────────────────────────────────┐
│   Coffee Scanner Web Frontend (React)   │
│   - Camera/File upload                  │
│   - Image display & results             │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│   Flask Backend (Python)                │
│   - /analyze-coffee-label (POST)        │
│   - /generate-brewing-guide (POST)      │
│   - /describe-image (POST)              │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│   NobodyWho LLM (Local Inference)       │
│   - Vision model (e.g., Gemma 3)        │
│   - Projection model (mmproj)           │
└─────────────────────────────────────────┘
```

## Quick Start

### Backend Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Download models (e.g., Gemma 3 4B):
```bash
wget https://huggingface.co/unsloth/gemma-3-4b-it-GGUF/resolve/main/gemma-3-4b-it-Q4_K_M.gguf
wget https://huggingface.co/unsloth/gemma-3-4b-it-GGUF/resolve/main/mmproj-F16.gguf
```

3. Start backend:
```bash
export MODEL_PATH="./gemma-3-4b-it-Q4_K_M.gguf"
export PROJECTION_PATH="./mmproj-F16.gguf"
python backend.py
```

The backend will start on `http://localhost:5000`

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start dev server:
```bash
npm run dev
```

Open `http://localhost:5173`

## API Endpoints

### POST `/analyze-coffee-label`
Analyzes a coffee label image and extracts information using AI vision model.

### POST `/generate-brewing-guide`
Generates detailed brewing instructions based on extracted coffee data.

### POST `/describe-image`
General-purpose image description for testing.

### GET `/health`
Backend status check - shows if model is loaded and ready.

## Model Recommendations

- **Gemma 3 4B** (Recommended) - Fast, accurate
  - Model: https://huggingface.co/unsloth/gemma-3-4b-it-GGUF
  
- **Llama Vision** - Higher quality, slower
  - Check: https://huggingface.co/models?pipeline_tag=image-text-to-text

## Usage

1. Start both backend and frontend (see Quick Start above)
2. Upload or capture a coffee label image
3. AI analyzes and extracts coffee information
4. Click "Brewing Guide" for detailed brewing instructions

## Project Structure

```
coffee-scanner-web/
├── backend.py              # Flask API backend
├── requirements.txt        # Python dependencies
├── package.json           # Node.js dependencies
├── src/
│   ├── App.jsx            # Main React component
│   ├── App.css            # Styling
│   ├── main.jsx           # Entry point
│   └── utils/
│       └── coffeeParser.js # Fallback parsing logic
└── vite.config.js         # Vite configuration
```

## License

EUPL-1.2 (Same as NobodyWho)
