import React, { useState } from 'react';
import { uploadData } from 'aws-amplify/storage';

const FileUploader = () => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadData({
        path: ({ identityId }) => `media/${identityId}/${file.name}`,
        data: file,
      }).result;
      alert('Upload successful!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-section">
      <input
        type="file"
        id="file-upload"
        style={{ display: 'none' }}
        onChange={handleUpload}
      />
      <label htmlFor="file-upload" className="upload-button">
        {uploading ? 'Uploading...' : 'Upload File'}
      </label>
    </div>
  );
};

export default FileUploader;