import { useState, useRef } from 'react';
import { uploadData } from 'aws-amplify/storage';
import './FileUpload.css';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({ userId, onUploadComplete }) {
  const [dragOver, setDragOver] = useState(false);
  const [queue, setQueue] = useState([]);
  const inputRef = useRef(null);

  function updateItem(id, patch) {
    setQueue(q => q.map(item => item.id === id ? { ...item, ...patch } : item));
  }

  async function uploadFile(file) {
    const id = `${Date.now()}-${file.name}`;
    const key = `${userId}/${file.name}`;

    setQueue(q => [...q, { id, name: file.name, size: file.size, progress: 0, status: 'uploading' }]);

    try {
      await uploadData({
        key,
        data: file,
        options: {
          contentType: file.type || 'application/octet-stream',
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (totalBytes) {
              updateItem(id, { progress: Math.round((transferredBytes / totalBytes) * 100) });
            }
          },
        },
      }).result;

      updateItem(id, { status: 'done', progress: 100 });
      onUploadComplete();

      // Remove from queue after 3s
      setTimeout(() => {
        setQueue(q => q.filter(item => item.id !== id));
      }, 3000);
    } catch (err) {
      updateItem(id, { status: 'error', error: err.message });
    }
  }

  function handleFiles(files) {
    Array.from(files).forEach(uploadFile);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="upload-input"
          onChange={e => handleFiles(e.target.files)}
        />
        <div className="upload-icon">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V8M12 8L9 11M12 8l3 3"/>
            <path d="M20.5 16.5A3.5 3.5 0 0 0 17 13h-1.5a7 7 0 1 0-11 5.7"/>
          </svg>
        </div>
        <div className="upload-title">drop files here or click to browse</div>
        <div className="upload-sub">any file type · multiple files supported</div>
      </div>

      {queue.length > 0 && (
        <div className="upload-queue">
          {queue.map(item => (
            <div key={item.id} className="upload-item">
              <div className="upload-item-header">
                <span className="upload-item-name">{item.name}</span>
                <span className={`upload-item-status ${item.status}`}>
                  {item.status === 'uploading' && `${item.progress}%`}
                  {item.status === 'done' && '✓ uploaded'}
                  {item.status === 'error' && `✗ ${item.error}`}
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
