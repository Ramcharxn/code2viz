// App.js (React Frontend)
import React, { useState } from 'react';
import './App.css';

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [iframeUrls, setIframeUrls] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPath, setCsvPath] = useState('');
  const [error, setError] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [showAlert, setShowAlert] = useState(false);

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 4000); // Auto dismiss after 4s
  };

  const handleRunCode = async () => {
    setError('');
    setIframeUrls([]);

    try {
      await fetch('http://localhost:5000/clear-plots', { method: 'DELETE' });

      const response = await fetch('http://localhost:5000/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });

      const data = await response.json();
      if (data.success) {
        setIframeUrls(data.plot_urls);
      } else {
        setError(data.error);
        triggerAlert('error', data.error);
      }
    } catch (err) {
      console.log('hello')
      setError('Server error.');
      triggerAlert('error', "Server error or Docker not running.");
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;

    const formData = new FormData();
    formData.append('file', csvFile);

    const res = await fetch('http://localhost:5000/upload-csv', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.success) {
      setCsvPath(data.csv_path.split('/').pop());
      triggerAlert('success', `File uploaded successfully`);
    }
  };

  const handleClearCode = () => {
    setCode('');
    setIframeUrls([]);
  };

  const handleClearCsv = async () => {
    setCsvFile(null);
    setCsvPath('');
    setIframeUrls([]);

    try {
      await fetch('http://localhost:5000/clear-csv', { method: 'DELETE' });
      triggerAlert('success', 'Cleared CSV files.');
    } catch (err) {
      triggerAlert('error','Failed to clear CSV files on server.');
    }
  };

  return (
    <div className="App">
      {showAlert && (
        <div className={`alert-box ${alert.type === 'success' ? 'success' : 'error'} slide-in`}>
          <span>{alert.message}</span>
          <button onClick={() => setShowAlert(false)}>×</button>
        </div>
      )}
      <h2>Run Visualization (Python / R)</h2>

      <label>Select Language: </label>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="python">Python</option>
        <option value="r">R</option>
      </select>

      <br /><br />
      <textarea
        rows="15"
        cols="80"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter your Python or R code here..."
      />
      <br />
      <button onClick={handleRunCode}>Generate Plots</button>
      <button onClick={handleClearCode}>Clear Code</button>

      <h3>Upload CSV</h3>
      <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
      <button onClick={handleCsvUpload}>Upload CSV</button>
      <button onClick={handleClearCsv}>Clear CSV</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {iframeUrls.map((url, idx) => (
        <div key={idx}>
          <h4>Plot {idx + 1}</h4>
          <iframe
            src={`http://localhost:5000${url}`}
            width="100%"
            height="600"
            title={`plot-${idx}`}
          />
        </div>
      ))}
    </div>
  );
}

export default App;
