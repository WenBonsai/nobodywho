import { useState, useRef, useEffect } from 'react';
import './App.css';
import { getBrewingGuide } from './utils/coffeeParser';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [mode, setMode] = useState('upload');
  const [image, setImage] = useState(null);
  const [coffeeData, setCoffeeData] = useState(null);
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing image...');
  const [useAI, setUseAI] = useState(true);
  const [backendStatus, setBackendStatus] = useState('unknown');
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Check backend status on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE}/health`);
        if (response.ok) {
          const data = await response.json();
          setBackendStatus(data.model_loaded ? 'ready' : 'no-model');
        } else {
          setBackendStatus('offline');
        }
      } catch (err) {
        setBackendStatus('offline');
      }
    };
    checkBackend();
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target.result;
      setImage(imageData);
      await recognizeText(imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.style.display = 'block';
    } catch (err) {
      alert('Camera not available: ' + err.message);
    }
  };

  const capturePhoto = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');
    setImage(imageData);
    video.srcObject.getTracks().forEach(track => track.stop());
    video.style.display = 'none';
    await recognizeText(imageData);
  };

  const recognizeText = async (imageData) => {
    setLoading(true);
    try {
      if (useAI && backendStatus === 'ready') {
        // Use AI backend
        setLoadingMessage('Analyzing coffee label with AI...');
        const response = await fetch(`${API_BASE}/analyze-coffee-label`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_data: imageData,
            image_format: 'jpeg'
          })
        });

        if (!response.ok) {
          throw new Error(`Backend error: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to analyze image');
        }

        const parsed = result.coffee_data;
        setCoffeeData(parsed);
        
        // Generate brewing guide using AI
        setLoadingMessage('Generating brewing guide...');
        const guideResponse = await fetch(`${API_BASE}/generate-brewing-guide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coffee_data: parsed })
        });

        if (guideResponse.ok) {
          const guideResult = await guideResponse.json();
          if (guideResult.success) {
            setGuide(guideResult.brewing_guide);
          } else {
            // Fall back to rule-based guide
            setGuide(getBrewingGuide(parsed));
          }
        } else {
          setGuide(getBrewingGuide(parsed));
        }

        setMode('results');
      } else {
        // Fallback to rule-based extraction
        alert('AI backend not available. Using local OCR fallback...');
        throw new Error('Backend not available and fallback OCR removed');
      }
    } catch (err) {
      alert('Error: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMessage('Processing image...');
    }
  };

  return (
    <div className="app">
      {mode === 'upload' && (
        <div className="container">
          <div className="header">
            <h1>☕ Coffee Scanner</h1>
            <p>Scan coffee labels to get brewing guides</p>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#aaa' }}>
              {backendStatus === 'ready' && <span>✓ AI Backend Connected</span>}
              {backendStatus === 'no-model' && <span>⚠ Backend ready (no AI model loaded)</span>}
              {backendStatus === 'offline' && <span>⚠ Backend offline - using fallback</span>}
              {backendStatus === 'unknown' && <span>Checking backend...</span>}
            </div>
          </div>
          <div className="upload-section">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>📸 Upload Photo</button>
            <button className="btn btn-secondary" onClick={handleCameraCapture}>📷 Take Photo</button>
            <video ref={videoRef} autoPlay style={{ display: 'none', width: '100%', marginTop: '20px', borderRadius: '8px' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {videoRef.current?.srcObject && <button className="btn btn-capture" onClick={capturePhoto}>✓ Capture</button>}
          </div>
        </div>
      )}

      {mode === 'results' && coffeeData && (
        <div className="container">
          <div className="header"><h1>Coffee Info</h1></div>
          {image && <img src={image} alt="Coffee label" className="preview-image" />}
          <div className="coffee-info">
            <div className="info-item"><span className="label">Brand:</span><span className="value">{coffeeData.brand || 'Unknown'}</span></div>
            <div className="info-item"><span className="label">Origin:</span><span className="value">{coffeeData.origin || 'N/A'}</span></div>
            <div className="info-item"><span className="label">Roast:</span><span className="value">{coffeeData.roast_level || coffeeData.roastLevel || 'N/A'}</span></div>
            <div className="info-item"><span className="label">Grind:</span><span className="value">{coffeeData.grind_size || coffeeData.grindSize || 'N/A'}</span></div>
            <div className="info-item"><span className="label">Brew Method:</span><span className="value">{coffeeData.brew_method || coffeeData.brewMethod || 'N/A'}</span></div>
            <div className="info-item"><span className="label">Flavors:</span><span className="value">{Array.isArray(coffeeData.flavor_notes) ? coffeeData.flavor_notes.join(', ') : coffeeData.flavor_notes || 'N/A'}</span></div>
            {coffeeData.extraction_summary && (
              <div className="info-item"><span className="label">Profile:</span><span className="value">{coffeeData.extraction_summary}</span></div>
            )}
          </div>
          <div className="action-buttons">
            <button className="btn btn-primary" onClick={() => setMode('guide')}>☕ Brewing Guide</button>
            <button className="btn btn-secondary" onClick={() => { setMode('upload'); setImage(null); setCoffeeData(null); setGuide(null); }}>🔄 New Scan</button>
          </div>
        </div>
      )}

      {mode === 'guide' && guide && coffeeData && (
        <div className="container">
          <div className="header"><h1>How to Brew: {coffeeData.brew_method || coffeeData.brewMethod || 'Coffee'}</h1></div>
          <div className="guide-content">
            {guide.temperature && <div className="guide-card"><h3>🌡️ Temperature</h3><p className="guide-value">{guide.temperature || guide.temp}</p></div>}
            {guide.brew_time && <div className="guide-card"><h3>⏱️ Time</h3><p className="guide-value">{guide.brew_time || guide.time}</p></div>}
            {guide.coffee_to_water_ratio && <div className="guide-card"><h3>⚖️ Ratio</h3><p className="guide-value">{guide.coffee_to_water_ratio || guide.ratio}</p></div>}
            {guide.grind_size && <div className="guide-card"><h3>🔨 Grind</h3><p className="guide-value">{guide.grind_size}</p></div>}
            {guide.steps && guide.steps.length > 0 && (
              <div className="guide-card full-width"><h3>📝 Steps</h3><ol className="steps-list">{guide.steps.map((step, idx) => <li key={idx}>{step}</li>)}</ol></div>
            )}
            {guide.tips && guide.tips.length > 0 && (
              <div className="guide-card full-width"><h3>💡 Tips</h3><ul className="steps-list">{guide.tips.map((tip, idx) => <li key={idx}>{tip}</li>)}</ul></div>
            )}
            {guide.expected_flavor && (
              <div className="guide-card full-width"><h3>👅 Expected Flavor</h3><p>{guide.expected_flavor}</p></div>
            )}
            <div className="guide-card full-width specs">
              <h3>☕ Coffee Specs</h3>
              <p><strong>Origin:</strong> {coffeeData.origin || 'N/A'}</p>
              <p><strong>Roast:</strong> {coffeeData.roast_level || coffeeData.roastLevel || 'N/A'}</p>
              {Array.isArray(coffeeData.flavor_notes) ? (
                <p><strong>Flavors:</strong> {coffeeData.flavor_notes.join(', ')}</p>
              ) : (
                <p><strong>Flavors:</strong> {coffeeData.flavor_notes || 'N/A'}</p>
              )}
            </div>
          </div>
          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={() => setMode('results')}>← Back</button>
            <button className="btn btn-primary" onClick={() => { setMode('upload'); setImage(null); setCoffeeData(null); setGuide(null); }}>🔄 Scan Again</button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>{loadingMessage}</p>
        </div>
      )}
    </div>
  );
}

export default App;
