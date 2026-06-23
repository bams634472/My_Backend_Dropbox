import React, { useState } from 'react';
import { Amplify } from 'aws-amplify';
import { uploadData } from 'aws-amplify/storage';
import outputs from '../amplify_outputs.json';
import './App.css';

// Handshake between your frontend and the S3/Auth backend
Amplify.configure(outputs);

/**
 * FileUploader Component
 * Follows the "1 Component per File" logic by being defined clearly here
 * or moved to its own file later.
 */
const FileUploader = () => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setUploading(true);
  try {
    // This path matches your storage permission: files/{owner-id}/*
    await uploadData({
      path: (input) => `files/${input.identityId}/${file.name}`, 
      data: file,
    }).result;
    
    alert('File uploaded successfully!');
  } catch (error) {
    console.error('Upload error:', error);
    alert('Upload failed. See console for details.');
  } finally {
    setUploading(false);
  }
};

  return (
    <div className="upload-card">
      <input
        type="file"
        id="file-input"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
      <label htmlFor="file-input" className="blue-button">
        {uploading ? 'Processing...' : 'Upload to Cloud'}
      </label>
    </div>
  );
};

function App() {
  return (
    <div className="dark-theme-wrapper">
      <header className="app-header">
        <h1 className="logo-text">DropCloud <span className="blue-dot">.</span></h1>
        <p className="subtitle">Serverless Storage Solution</p>
      </header>

      <main className="content">
        <FileUploader />
      </main>

      <footer className="footer">
        <p>Connected to: {outputs.storage?.bucket_name?.substring(0, 20)}...</p>
      </footer>
    </div>
  );
}


<label htmlFor="file-input" className="bw-button">
  {uploading ? 'UPLOADING...' : 'UPLOAD FILE'}
</label>
// ...

export default App;