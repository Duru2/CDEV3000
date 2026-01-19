import { useState } from 'react';

const TrafficLightSystem = () => {
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState(null); // 'red', 'yellow', 'green'

  // Mock Logic for Showcase
  const classifyData = (text) => {
    const lowerText = text.toLowerCase();
    
    // RED: Critical Data
    if (lowerText.includes('financial') || lowerText.includes('military') || lowerText.includes('secret') || lowerText.includes('password')) {
      return 'red';
    } 
    // GREEN: Public Data
    else if (lowerText.includes('public') || lowerText.includes('weather') || lowerText.includes('news') || lowerText.includes('marketing')) {
      return 'green';
    } 
    // YELLOW: Default / Ambiguous
    else {
      return 'yellow';
    }
  };

  const handleCheck = () => {
    if (!inputText) return;
    setStatus(classifyData(inputText));
  };

  return (
    <div className="container">
      <h2>AI Governance<br/>Traffic Light System</h2>
      <p style={{color: '#666', fontSize: '0.9rem'}}>Enter data type to check AI compliance level.</p>
      
      <div className="input-group">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="e.g., Financial Report, Public News..."
        />
        <button onClick={handleCheck}>Check</button>
      </div>

      <div className="traffic-light">
        <div className={`light red ${status === 'red' ? 'active' : ''}`}></div>
        <div className={`light yellow ${status === 'yellow' ? 'active' : ''}`}></div>
        <div className={`light green ${status === 'green' ? 'active' : ''}`}></div>
      </div>

      {status === 'red' && (
        <div className="result-box red">
          STOP: High Sensitivity Data.<br/>Human approval required before AI processing.
        </div>
      )}
      {status === 'yellow' && (
        <div className="result-box yellow">
          CAUTION: Internal Data.<br/>Remove PII (Personally Identifiable Information) before use.
        </div>
      )}
      {status === 'green' && (
        <div className="result-box green">
          GO: Public Data.<br/>Safe for Generative AI usage.
        </div>
      )}
    </div>
  );
};

export default TrafficLightSystem;