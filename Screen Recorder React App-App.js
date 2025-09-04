import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [currentView, setCurrentView] = useState('recorder'); // 'recorder' or 'list'

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const videoPreviewRef = useRef(null);

  const MAX_RECORDING_TIME = 180; // 3 minutes in seconds

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recordings`);
      const data = await response.json();
      setRecordings(data);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    }
  };

  const startRecording = async () => {
    try {
      // Get screen capture
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'tab',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      });

      // Get microphone audio
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Combine streams
      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...displayStream.getAudioTracks(),
        ...audioStream.getAudioTracks()
      ]);

      streamRef.current = combinedStream;
      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      const chunks = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedBlob(blob);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.src = URL.createObjectURL(blob);
        }
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error starting recording. Please make sure you grant screen capture permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const downloadRecording = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screen-recording-${new Date().toISOString().split('T')[0]}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const uploadRecording = async () => {
    if (!recordedBlob) return;

    const formData = new FormData();
    const filename = `screen-recording-${Date.now()}.webm`;
    formData.append('recording', recordedBlob, filename);
    formData.append('title', filename);
    formData.append('size', recordedBlob.size);

    try {
      setUploadStatus('Uploading...');
      const response = await fetch(`${API_BASE_URL}/api/recordings`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setUploadStatus('Upload successful!');
        fetchRecordings();
        setTimeout(() => setUploadStatus(''), 3000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('Upload failed. Please try again.');
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Screen Recorder</h1>
        <nav>
          <button 
            onClick={() => setCurrentView('recorder')}
            className={currentView === 'recorder' ? 'active' : ''}
          >
            Recorder
          </button>
          <button 
            onClick={() => setCurrentView('list')}
            className={currentView === 'list' ? 'active' : ''}
          >
            Recordings ({recordings.length})
          </button>
        </nav>
      </header>

      <main className="App-main">
        {currentView === 'recorder' && (
          <div className="recorder-section">
            <div className="controls">
              <div className="timer">
                <span className="time">{formatTime(recordingTime)}</span>
                <span className="max-time">/ {formatTime(MAX_RECORDING_TIME)}</span>
              </div>

              <div className="recording-buttons">
                {!isRecording ? (
                  <button 
                    onClick={startRecording} 
                    className="start-btn"
                    disabled={recordingTime >= MAX_RECORDING_TIME}
                  >
                    Start Recording
                  </button>
                ) : (
                  <button onClick={stopRecording} className="stop-btn">
                    Stop Recording
                  </button>
                )}
              </div>

              {isRecording && (
                <div className="recording-indicator">
                  <span className="recording-dot"></span>
                  Recording in progress...
                </div>
              )}
            </div>

            {recordedBlob && (
              <div className="preview-section">
                <h3>Recording Preview</h3>
                <video 
                  ref={videoPreviewRef}
                  controls 
                  width="100%" 
                  style={{ maxWidth: '800px', marginBottom: '20px' }}
                />
                
                <div className="preview-actions">
                  <button onClick={downloadRecording} className="download-btn">
                    Download Recording
                  </button>
                  <button onClick={uploadRecording} className="upload-btn">
                    Upload to Server
                  </button>
                </div>

                {uploadStatus && (
                  <div className={`upload-status ${uploadStatus.includes('successful') ? 'success' : uploadStatus.includes('failed') ? 'error' : ''}`}>
                    {uploadStatus}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentView === 'list' && (
          <div className="recordings-list">
            <h2>Uploaded Recordings</h2>
            {recordings.length === 0 ? (
              <p className="no-recordings">No recordings uploaded yet.</p>
            ) : (
              <div className="recordings-grid">
                {recordings.map((recording) => (
                  <div key={recording.id} className="recording-card">
                    <h4>{recording.title}</h4>
                    <div className="recording-info">
                      <span>Size: {formatFileSize(recording.size)}</span>
                      <span>Date: {new Date(recording.createdAt).toLocaleDateString()}</span>
                    </div>
                    <video 
                      controls 
                      width="100%"
                      style={{ marginTop: '10px' }}
                    >
                      <source src={`${API_BASE_URL}/api/recordings/${recording.id}`} type="video/webm" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
