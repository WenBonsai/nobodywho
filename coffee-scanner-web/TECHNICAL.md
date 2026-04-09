# Coffee Scanner - Technical Documentation

## Overview

The Coffee Scanner is a full-stack application that combines:
1. **React Web Frontend** - Image capture and results display
2. **Flask Python Backend** - NobodyWho LLM integration
3. **Vision LLM** - Image analysis using Gemma 3 or similar
4. **Local Inference** - All processing happens offline on your machine

## Architecture

### Data Flow

```
User uploads image
        ↓
React frontend converts to base64
        ↓
HTTP POST to Flask backend
        ↓
Backend decodes and saves temp image
        ↓
NobodyWho loads image and vision model
        ↓
LLM analyzes image with structured prompt
        ↓
LLM returns JSON with coffee information
        ↓
Backend parses JSON response
        ↓
Backend returns structured coffee data
        ↓
React frontend displays extracted information
        ↓
User clicks "Brewing Guide"
        ↓
Frontend requests brewing guide generation
        ↓
LLM generates detailed guide based on coffee data
        ↓
Guide displayed in UI
```

### File Structure

```
coffee-scanner-web/
├── backend.py                 # Flask API server
├── requirements.txt          # Python dependencies
├── setup.sh                  # Setup script
├── README.md                 # Setup instructions
├── package.json              # Node dependencies
├── vite.config.js           # Vite build config
├── index.html               # HTML entry point
└── src/
    ├── App.jsx              # Main React component
    ├── App.css              # Styling (dark theme)
    ├── main.jsx             # React entry
    ├── index.css            # Base styles
    └── utils/
        └── coffeeParser.js  # Fallback extraction (not used with AI)
```

## Backend Implementation

### Flask Endpoints

#### 1. POST `/health`
**Purpose:** Check backend and model status

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true,
  "vision_enabled": true
}
```

#### 2. POST `/analyze-coffee-label`
**Purpose:** Analyze image and extract coffee information

**Input:**
- `image_data`: Base64 encoded image (can be data URL)
- `image_format`: Image format (jpg, png, etc.)

**Process:**
1. Decode base64 image
2. Save to temporary file
3. Create NobodyWho Prompt with image
4. Send to LLM with structured extraction prompt
5. Parse JSON response
6. Return extracted data

**Output:**
```json
{
  "success": true,
  "coffee_data": {
    "brand": "Brand Name",
    "origin": "Colombia",
    "roast_level": "Medium",
    "grind_size": "Fine",
    "brew_method": "Espresso",
    "flavor_notes": ["Chocolate", "Caramel"],
    "roast_date": "2024-03-15",
    "weight": "250g",
    "extraction_summary": "Rich, balanced Colombian espresso"
  }
}
```

#### 3. POST `/generate-brewing-guide`
**Purpose:** Generate brewing guide for coffee

**Input:**
- `coffee_data`: Extracted coffee information

**Process:**
1. Format prompt with coffee data
2. Send to LLM requesting JSON guide
3. Parse response
4. Return structured guide

**Output:**
```json
{
  "success": true,
  "brewing_guide": {
    "brew_method": "Espresso",
    "temperature": "195-205°F",
    "brew_time": "25-30 seconds",
    "coffee_to_water_ratio": "1:2",
    "grind_size": "Fine",
    "water_quality": "Filtered water",
    "steps": [
      "Grind coffee to fine consistency",
      "Distribute evenly in portafilter",
      "..."
    ],
    "tips": [
      "Use fresh beans roasted within 2 weeks",
      "..."
    ],
    "expected_flavor": "Rich chocolate with caramel sweetness",
    "notes": "Colombian coffees shine with espresso"
  }
}
```

#### 4. POST `/describe-image`
**Purpose:** General image description (for testing)

**Similar flow to `/analyze-coffee-label`**

### Model Loading

NobodyWho models are loaded as follows:

```python
# Load vision model with projection
model = nobodywho.Model(
    model_path,                    # e.g., "gemma-3-4b-it-Q4_K_M.gguf"
    image_model_path=projection_path  # e.g., "mmproj-F16.gguf"
)

# Create chat instance
chat = nobodywho.Chat(
    model,
    system_prompt="You are a coffee expert...",
    template_variables={"enable_thinking": False}
)

# Create multimodal prompt
prompt = nobodywho.Prompt([
    nobodywho.Text("Analyze this coffee label..."),
    nobodywho.Image(image_path)
])

# Get response
response = chat.ask(prompt).completed()
```

## Frontend Implementation

### React Component States

The App component has three main modes:

1. **upload** - Display camera/file upload options
2. **results** - Show extracted coffee information
3. **guide** - Display brewing guide

### Key Functions

**handleFileSelect()** - File input handler
- Reads file as Data URL
- Calls recognizeText()

**handleCameraCapture()** - Camera access
- Requests camera permission
- Shows video preview

**capturePhoto()** - Captures from camera
- Gets canvas context from video
- Converts to JPEG data URL
- Calls recognizeText()

**recognizeText()** - Main analysis function
- Checks backend status
- Sends image to backend API
- Handles response
- Updates UI with results

### API Integration

```javascript
// Check backend health
fetch('http://localhost:5000/health')

// Send image for analysis
fetch('http://localhost:5000/analyze-coffee-label', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image_data: imageDataUrl,
    image_format: 'jpeg'
  })
})

// Request brewing guide
fetch('http://localhost:5000/generate-brewing-guide', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    coffee_data: extractedData
  })
})
```

## Vision Model Requirements

### Model Types

**Option 1: Gemma 3 4B** (Recommended)
- Size: ~2.5GB (Q4 quantization)
- Speed: Fast (2-5 sec per image on CPU)
- Quality: Excellent
- Projection: mmproj-F16.gguf

**Option 2: Llama Vision**
- Size: Varies (5B-13B)
- Speed: Slower than Gemma
- Quality: High
- Projection: Included in model

### Downloading Models

```bash
# Gemma 3 4B
wget https://huggingface.co/unsloth/gemma-3-4b-it-GGUF/resolve/main/gemma-3-4b-it-Q4_K_M.gguf

# Projection model
wget https://huggingface.co/unsloth/gemma-3-4b-it-GGUF/resolve/main/mmproj-F16.gguf

# Alternative: Llama Vision
wget https://huggingface.co/.../model.gguf
```

## Configuration

### Environment Variables

**Backend:**
```bash
MODEL_PATH=/path/to/model.gguf          # Main model
PROJECTION_PATH=/path/to/mmproj.gguf    # Vision projection
```

**Frontend:**
```bash
VITE_API_URL=http://localhost:5000      # Backend URL
```

### System Requirements

**Minimum:**
- CPU: Multi-core processor
- RAM: 16GB (for 4B models)
- Storage: 10GB (for model + temp files)

**Recommended:**
- CPU: Modern multi-core (Ryzen 7+, i7+)
- RAM: 32GB
- GPU: GPU with Vulkan support (10-100x faster)
- Storage: 20GB+ SSD

## Performance Optimization

### Model Quantization

- **Q3**: Very fast, lower quality (~1.5GB)
- **Q4**: Balanced (~2.5GB)
- **Q5**: Higher quality, slower (~3.5GB)
- **Q8**: Best quality, slowest (~5GB)

### Context Size

Reduce if you hit memory limits:
```python
chat = nobodywho.Chat(model, n_ctx=2048)  # Default 4096
```

### GPU Acceleration

Vulkan support (Linux/Windows):
```bash
export MODEL_PATH=./model.gguf
# NobodyWho auto-detects GPU
```

## Prompt Engineering

### Coffee Label Analysis Prompt

The backend uses this prompt structure:

```
Analyze this coffee label and extract:
- brand: Brand name or 'Unknown'
- origin: Country/region (e.g., 'Colombia')
- roast_level: Light/Medium/Dark
- grind_size: Coarse/Medium/Fine
- brew_method: Espresso/Pour Over/French Press/etc
- flavor_notes: Array of flavor descriptors
- roast_date: Date if visible
- weight: Weight/volume if visible
- extraction_summary: Brief profile description

Respond ONLY with valid JSON.
```

### Brewing Guide Prompt

```
Generate a brewing guide for:
- Origin: [origin]
- Roast: [roast]
- Brew Method: [method]
- Flavor Profile: [flavors]

Include:
- Temperature (exact range)
- Brew time
- Coffee-to-water ratio
- Grind size
- Water quality
- Step-by-step instructions
- Tips and tricks
- Expected flavor
- Additional notes

Respond ONLY with valid JSON.
```

## Error Handling

### Backend Errors

- **503**: Model not loaded
- **400**: Invalid image data
- **500**: Processing error

### Frontend Errors

- Backend offline → Show warning, use fallback
- Image processing fails → Show error alert
- JSON parsing fails → Show raw response

## Testing

### Manual Testing

1. Start backend:
```bash
export MODEL_PATH=./gemma-3-4b-it-Q4_K_M.gguf
export PROJECTION_PATH=./mmproj-F16.gguf
python backend.py
```

2. Test health endpoint:
```bash
curl http://localhost:5000/health
```

3. Test with image (Unix):
```bash
curl -X POST http://localhost:5000/analyze-coffee-label \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "image_data": "base64_encoded_image",
  "image_format": "jpeg"
}
EOF
```

## Troubleshooting

### Model Won't Load
- Verify model path exists
- Check it's a valid GGUF file
- Ensure .gguf extension

### Backend Crashes
- Check available RAM (needs 3x model size)
- Reduce context size
- Use smaller model or more aggressive quantization

### Frontend Can't Connect
- Verify backend running on port 5000
- Check firewall settings
- Verify CORS enabled

### Slow Response
- First inference is slow (loads model)
- Consider GPU acceleration
- Use smaller model
- Reduce context size

## Performance Metrics

**Typical Performance (Gemma 3 4B Q4 on CPU):**
- Model load: 15-30 seconds (first time only)
- Image analysis: 2-5 seconds per image
- Guide generation: 3-8 seconds per guide
- Memory usage: ~8-10GB

**With GPU (Vulkan):**
- Image analysis: 0.5-2 seconds
- Guide generation: 1-3 seconds
- Memory usage: ~6GB (GPU + CPU)

## Future Enhancements

- [ ] Batch image processing
- [ ] Model switching UI
- [ ] Favorite coffees database
- [ ] Brewing history tracking
- [ ] Integration with coffee shop APIs
- [ ] Export guides as PDF
- [ ] Multilingual support
- [ ] Fine-tuned coffee extraction model

## License

EUPL-1.2 (Same as NobodyWho)
