import { useState, useRef, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import './App.css';
import { parseCoffeeLabel, getBrewingGuide } from './utils/coffeeParser';

function App() {
  const [mode, setMode] = useState('upload');
  const [image, setImage] = useState(null);
  const [coffeeData, setCoffeeData] = useState(null);
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const workerRef = useRef(null);

  useEffect(() => {
    const initWorker = async () => {
      const worker = await createWorker('eng');
      workerRef.current = worker;
    };
    initWorker();
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
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
      if (!workerRef.current) {
        alert('OCR engine not ready, please try again');
        return;
      }
      const result = await workerRef.current.recognize(imageData);
      const text = result.data.text;
      const parsed = parseCoffeeLabel(text);
      setCoffeeData(parsed);
      const brewGuide = getBrewingGuide(parsed);
      setGuide(brewGuide);
      setMode('results');
    } catch (err) {
      alert('OCR Error: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {mode === 'upload' && (
        <div className="container">
          <div className="header">
            <h1>☕ Coffee Scanner</h1>
            <p>Scan coffee labels to get brewing guides</p>
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
            <div className="info-item"><span className="label">Origin:</span><span className="value">{coffeeData.origin}</span></div>
            <div className="info-item"><span className="label">Roast:</span><span className="value">{coffeeData.roastLevel}</span></div>
            <div className="info-item"><span className="label">Grind:</span><span className="value">{coffeeData.grindSize}</span></div>
            <div className="info-item"><span className="label">Brew Method:</span><span className="value">{coffeeData.brewMethod}</span></div>
            <div className="info-item"><span className="label">Flavors:</span><span className="value">{coffeeData.flavorNotes.join(', ')}</span></div>
          </div>
          <div className="action-buttons">
            <button className="btn btn-primary" onClick={() => setMode('guide')}>☕ Brewing Guide</button>
            <button className="btn btn-secondary" onClick={() => { setMode('upload'); setImage(null); setCoffeeData(null); setGuide(null); }}>🔄 New Scan</button>
          </div>
        </div>
      )}

      {mode === 'guide' && guide && coffeeData && (
        <div className="container">
          <div className="header"><h1>How to Brew: {coffeeData.brewMethod}</h1></div>
          <div className="guide-content">
            <div className="guide-card"><h3>🌡️ Temperature</h3><p className="guide-value">{guide.temp}</p></div>
            <div className="guide-card"><h3>⏱️ Time</h3><p className="guide-value">{guide.time}</p></div>
            <div className="guide-card"><h3>⚖️ Ratio</h3><p className="guide-value">{guide.ratio}</p></div>
            <div className="guide-card full-width"><h3>📝 Steps</h3><ol className="steps-list">{guide.steps.map((step, idx) => <li key={idx}>{step}</li>)}</ol></div>
            <div className="guide-card full-width specs"><h3>☕ Coffee Specs</h3><p><strong>Origin:</strong> {coffeeData.origin}</p><p><strong>Roast:</strong> {coffeeData.roastLevel}</p><p><strong>Flavors:</strong> {coffeeData.flavorNotes.join(', ')}</p></div>
          </div>
          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={() => setMode('results')}>← Back</button>
            <button className="btn btn-primary" onClick={() => { setMode('upload'); setImage(null); setCoffeeData(null); setGuide(null); }}>🔄 Scan Again</button>
          </div>
        </div>
      )}

      {loading && <div className="loading-overlay"><div className="spinner"></div><p>Processing image...</p></div>}
    </div>
  );
}

export default App;
