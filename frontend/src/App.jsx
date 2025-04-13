import React, { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './App.css';

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [iframeUrls, setIframeUrls] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [csvFiles, setCsvFiles] = useState([]);
  const [csvPath, setCsvPath] = useState('');
  const [error, setError] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [showAlert, setShowAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 4000);
  };

  const handleRunCode = async () => {
    setError('');
    setIframeUrls([]);
    setIsLoading(true);

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
        triggerAlert('success', 'Plots generated successfully!');
      } else {
        setError(data.error);
        triggerAlert('error', data.error);
      }
    } catch (err) {
      setError('Server error.');
      triggerAlert('error', "Server error or Docker not running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('http://localhost:5000/upload-csv', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.success) {
      setCsvPath(data.csv_path.split('/').pop());
      triggerAlert('success', `CSV uploaded successfully`);
      loadCsvFiles();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    setCsvFile(file);
    await handleCsvUpload(file);
  };

  const handleClearCode = () => {
    setCode('');
    setIframeUrls([]);
  };

  const handleClearCsv = async () => {
    setCsvFile(null);
    setCsvPath('');
    fileInputRef.current.value = '';
    try {
      await fetch('http://localhost:5000/clear-csv', { method: 'DELETE' });
      triggerAlert('success', 'CSV files cleared.');
      loadCsvFiles();
    } catch (err) {
      triggerAlert('error', 'Failed to clear CSV files.');
    }
  };

  const loadCsvFiles = async () => {
    try {
      const res = await fetch('http://localhost:5000/list-csv');
      const data = await res.json();
      if (data.success) {
        setCsvFiles(data.files);
      }
    } catch (err) {
      setCsvFiles([]);
    }
  };

  useEffect(() => {
    loadCsvFiles();
  }, []);

  return (
    <div className="container">
      {showAlert && (
        <div className={`alert ${alert.type}`}>
          <span>{alert.message}</span>
          <button onClick={() => setShowAlert(false)} className="close-btn">×</button>
        </div>
      )}

      <h1 className="title">VizCraft</h1>

      <div className="main-content">
        {/* Left Side */}
        <div className="left-panel">
          <div className="code-header">
            <div className="lang-toggle">
              <button
                className={`lang-btn ${language === 'python' ? 'active' : ''}`}
                onClick={() => setLanguage('python')}
              >
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width="20" />
              </button>
              <button
                className={`lang-btn ${language === 'r' ? 'active' : ''}`}
                onClick={() => setLanguage('r')}
              >
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/r/r-original.svg" width="20" />
              </button>
            </div>
            <div>
              <button className="btn primary" onClick={handleRunCode}>🚀 Generate Plot</button>
              <button className="btn left" onClick={handleClearCode}>❮ Clear Code</button>
            </div>
          </div>

          <Editor
            height="565px"
            defaultLanguage={language}
            theme="vs-dark"
            className='editor'
            value={code}
            onChange={(value) => setCode(value || '')}
          />

          <div className="controls-row">
            <div className="file-buttons">
              <div className='btn primary'>
                <label htmlFor="file-upload" className="file-label">📁 Choose CSV</label>
                <input
                  type="file"
                  id="file-upload"
                  className="file-input"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>
              <button className="btn" onClick={handleClearCsv}>🗑️ Clear Files</button>
            </div>

            <div className="csv-list">
              <strong>Available CSV Files:</strong>
              <ul>
                {csvFiles.length > 0 && csvFiles.map((file, index) => (
                  <li key={index}>{file}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="right-panel">
          {isLoading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Generating plots, please wait...</p>
            </div>
          )}

          <div className="plots scrollable">
            {iframeUrls.map((url, idx) => (
              <div key={idx} className="iframe-container">
                <h4>Plot {idx + 1}</h4>
                <iframe
                  src={`http://localhost:5000${url}`}
                  title={`plot-${idx}`}
                  className="plot-frame"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
