#!/usr/bin/env python3
"""
Coffee Scanner Backend - Uses NobodyWho vision LLM to analyze coffee labels
"""

import os
import sys
import base64
import json
import tempfile
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add NobodyWho to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    import nobodywho
except ImportError:
    print("Error: nobodywho not installed. Please install with: pip install nobodywho")
    sys.exit(1)

app = Flask(__name__)
CORS(app)

# Global model instance
model = None
chat = None

def init_model(model_path: str, projection_model_path: str = None):
    """Initialize the vision model and chat"""
    global model, chat
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_path}")
    
    print(f"Loading model from: {model_path}")
    
    # Load model with optional vision support
    if projection_model_path and os.path.exists(projection_model_path):
        print(f"Loading vision projection from: {projection_model_path}")
        model = nobodywho.Model(model_path, image_model_path=projection_model_path)
    else:
        model = nobodywho.Model(model_path)
    
    # Create chat instance
    chat = nobodywho.Chat(
        model,
        system_prompt="You are a coffee expert. Analyze coffee labels and extract key information.",
        template_variables={"enable_thinking": False}
    )
    print("Model loaded successfully!")

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "vision_enabled": chat is not None
    })

@app.route('/analyze-coffee-label', methods=['POST'])
def analyze_coffee_label():
    """
    Analyze coffee label image and extract information
    
    Expected JSON:
    {
        "image_data": "base64_encoded_image_data",  # base64 data URL or raw base64
        "image_format": "jpg"  # or png
    }
    """
    try:
        if not chat:
            return jsonify({"error": "Model not loaded"}), 503
        
        data = request.get_json()
        
        if not data or 'image_data' not in data:
            return jsonify({"error": "Missing image_data"}), 400
        
        image_data = data['image_data']
        image_format = data.get('image_format', 'jpg')
        
        # Handle data URLs (strip the "data:image/jpeg;base64," prefix)
        if image_data.startswith('data:'):
            image_data = image_data.split(',')[1]
        
        # Decode base64
        try:
            image_bytes = base64.b64decode(image_data)
        except Exception as e:
            return jsonify({"error": f"Invalid base64 image: {str(e)}"}), 400
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix=f'.{image_format}', delete=False) as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name
        
        try:
            # Create prompt with image
            prompt = nobodywho.Prompt([
                nobodywho.Text("""Analyze this coffee label and extract the following information in JSON format:
{
    "brand": "Brand name or 'Unknown' if not visible",
    "origin": "Country or region of origin (e.g., 'Colombia', 'Brazil', 'Ethiopia')",
    "roast_level": "Light, Medium, or Dark",
    "grind_size": "Coarse, Medium, or Fine (if mentioned)",
    "brew_method": "Recommended brew method (Espresso, Pour Over, French Press, AeroPress, Moka Pot, or Turkish)",
    "flavor_notes": ["list", "of", "flavor", "descriptors"],
    "roast_date": "Date if visible, or null",
    "weight": "Weight/volume if visible, or null",
    "extraction_summary": "Brief description of the coffee's profile"
}

Provide ONLY valid JSON, no additional text."""),
                nobodywho.Image(tmp_path)
            ])
            
            # Get response from model
            response = chat.ask(prompt).completed()
            
            # Parse JSON response
            try:
                # Try to extract JSON from response
                start_idx = response.find('{')
                end_idx = response.rfind('}') + 1
                if start_idx != -1 and end_idx > start_idx:
                    json_str = response[start_idx:end_idx]
                    coffee_data = json.loads(json_str)
                else:
                    # If no JSON found, return raw response
                    coffee_data = {"raw_response": response}
            except json.JSONDecodeError:
                coffee_data = {"raw_response": response}
            
            return jsonify({
                "success": True,
                "coffee_data": coffee_data
            })
        
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "type": type(e).__name__}), 500

@app.route('/generate-brewing-guide', methods=['POST'])
def generate_brewing_guide():
    """
    Generate a detailed brewing guide based on coffee information
    
    Expected JSON:
    {
        "coffee_data": {
            "brand": "...",
            "origin": "...",
            "roast_level": "...",
            "brew_method": "...",
            "flavor_notes": [...]
        }
    }
    """
    try:
        if not chat:
            return jsonify({"error": "Model not loaded"}), 503
        
        data = request.get_json()
        
        if not data or 'coffee_data' not in data:
            return jsonify({"error": "Missing coffee_data"}), 400
        
        coffee_data = data['coffee_data']
        brew_method = coffee_data.get('brew_method', 'Pour Over')
        origin = coffee_data.get('origin', 'Unknown')
        roast = coffee_data.get('roast_level', 'Medium')
        flavors = coffee_data.get('flavor_notes', [])
        
        # Create prompt
        flavor_str = ", ".join(flavors) if flavors else "balanced"
        prompt_text = f"""You are a professional barista and coffee expert. Generate a detailed brewing guide for:

Brand: {coffee_data.get('brand', 'Unknown')}
Origin: {origin}
Roast Level: {roast}
Brew Method: {brew_method}
Flavor Profile: {flavor_str}

Please provide a JSON response with this exact structure:
{{
    "brew_method": "{brew_method}",
    "temperature": "Exact temperature (e.g., '195-205°F' or '90-96°C')",
    "brew_time": "Brewing time (e.g., '3-4 minutes' or '25-30 seconds')",
    "coffee_to_water_ratio": "Ratio (e.g., '1:16' or '1 part coffee : 2 parts water')",
    "grind_size": "Grind size recommendation",
    "water_quality": "Water quality recommendation",
    "steps": [
        "Step 1: Description",
        "Step 2: Description",
        "Step 3: Description",
        "Step 4: Description",
        "Step 5: Description"
    ],
    "tips": [
        "Tip 1",
        "Tip 2",
        "Tip 3"
    ],
    "expected_flavor": "Description of expected taste profile",
    "notes": "Additional notes about this origin/roast combination"
}}

Provide ONLY valid JSON, no additional text."""
        
        prompt = nobodywho.Prompt([
            nobodywho.Text(prompt_text)
        ])
        
        response = chat.ask(prompt).completed()
        
        # Parse JSON response
        try:
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response[start_idx:end_idx]
                guide_data = json.loads(json_str)
            else:
                guide_data = {"raw_response": response}
        except json.JSONDecodeError:
            guide_data = {"raw_response": response}
        
        return jsonify({
            "success": True,
            "brewing_guide": guide_data
        })
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "type": type(e).__name__}), 500

@app.route('/describe-image', methods=['POST'])
def describe_image():
    """
    General image description endpoint (for testing)
    """
    try:
        if not chat:
            return jsonify({"error": "Model not loaded"}), 503
        
        data = request.get_json()
        
        if not data or 'image_data' not in data:
            return jsonify({"error": "Missing image_data"}), 400
        
        image_data = data['image_data']
        image_format = data.get('image_format', 'jpg')
        
        # Handle data URLs
        if image_data.startswith('data:'):
            image_data = image_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix=f'.{image_format}', delete=False) as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name
        
        try:
            prompt = nobodywho.Prompt([
                nobodywho.Text("Describe what you see in this image in detail."),
                nobodywho.Image(tmp_path)
            ])
            
            response = chat.ask(prompt).completed()
            
            return jsonify({
                "success": True,
                "description": response
            })
        
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "type": type(e).__name__}), 500

if __name__ == '__main__':
    # Get model paths from environment or use defaults
    model_path = os.environ.get('MODEL_PATH', './model.gguf')
    projection_path = os.environ.get('PROJECTION_PATH', None)
    
    print(f"\n🔄 Initializing Coffee Scanner Backend...")
    print(f"   Model: {model_path}")
    if projection_path:
        print(f"   Vision Projection: {projection_path}")
    
    try:
        init_model(model_path, projection_path)
        print(f"\n✅ Backend ready! Starting Flask server...\n")
        app.run(host='0.0.0.0', port=5000, debug=False)
    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        print("\nTo use this backend, you need to:")
        print("1. Download a vision-capable GGUF model (e.g., Gemma 3 4B)")
        print("2. Download its mmproj (vision projection) model")
        print("3. Set MODEL_PATH and PROJECTION_PATH environment variables")
        print("\nExample:")
        print('  export MODEL_PATH="/path/to/gemma-3-4b-it-Q4_K_M.gguf"')
        print('  export PROJECTION_PATH="/path/to/mmproj-F16.gguf"')
        print("  python backend.py")
        sys.exit(1)
