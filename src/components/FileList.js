import { useState, useEffect, useCallback } from 'react';
import { list, remove, getUrl } from 'aws-amplify/storage';
import './FileList.css';

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

export default function FileList({ userId, refreshTick, onViewVersions }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await list({
        prefix: `${userId}/`,
        options: { listAll: true },
      });
      setFiles(result.items.filter(f => f.key !== `${userId}/`));
    } catch (err) {
      setError('Could not load files: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles, refreshTick]);

  async function handleDownload(file) {
    try {
      const { url } = await getUrl({ key: file.key, options: { expiresIn: 300 } });
      const a = document.createElement('a');
      a.href = url.toString();
      a.download = file.key.replace(`${userId}/`, '');
      a.click();
    } catch (err) {
      alert('Download failed: ' + err.message);
    }
  }

  async function handleDelete(file) {
    if (!window.confirm(`Delete "${file.key.replace(`${userId}/`, '')}"?`)) return;
    setDeleting(file.key);
    try {
      await remove({ key: file.key });
      setFiles(f => f.filter(x => x.key !== file.key));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="file-list-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="file-list-header">
        <span className="file-list-title">your files</span>
        <span className="file-count">{files.length} {files.length === 1 ? 'file' : 'files'}</span>
      </div>

      {error && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--red)', padding: '12px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {files.length === 0 ? (
        <div className="file-list-empty">
          <div className="file-list-empty-icon">[ ]</div>
          <div className="file-list-empty-text">no files yet — drop something above</div>
        </div>
      ) : (
        <table className="file-table">
          <thead>
            <tr>
              <th>name</th>
              <th>size</th>
              <th>uploaded</th>
              <th>actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map(file => {
              const name = file.key.replace(`${userId}/`, '');
              return (
                <tr key={file.key} className="file-row">
                  <td>
                    <div className="file-name-cell">
                      <div className="file-icon"><FileIcon /></div>
                      <span className="file-name">{name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="file-size">{formatSize(file.size)}</span>
                  </td>
                  <td>
                    <span className="file-date">{formatDate(file.lastModified)}</span>
                  </td>
                  <td>
                    <div className="file-actions">
                      {/* Versions */}
                      <button
                        className="btn-icon"
                        title="Version history"
                        onClick={() => onViewVersions({ key: file.key, name })}
                      >
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                          <path d="M3 3v5h5"/>
                          <path d="M12 7v5l4 2"/>
                        </svg>
                      </button>
                      {/* Download */}
                      <button
                        className="btn-icon"
                        title="Download"
                        onClick={() => handleDownload(file)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                      {/* Delete */}
                      <button
                        className="btn-icon danger"
                        title="Delete"
                        onClick={() => handleDelete(file)}
                        disabled={deleting === file.key}
                      >
                        {deleting === file.key
                          ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                          : (
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6M14 11v6"/>
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                          )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
