import { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';
import { get } from 'aws-amplify/api';
import './VersionHistory.css';

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${(bytes / 1).toFixed(0)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(date));
}

export default function VersionHistory({ file, userId, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVersions();
    // eslint-disable-next-line
  }, [file.key]);

  async function fetchVersions() {
    setLoading(true);
    setError('');
    try {
      /**
       * Call your Lambda via API Gateway.
       * The endpoint GET /versions?key=<fileKey> returns:
       * { versions: [{ versionId, lastModified, size, isLatest }] }
       *
       * See lambda/getVersions/index.js for the implementation.
       */
      const restOperation = get({
        apiName: 'dropcloudApi',
        path: `/versions?key=${encodeURIComponent(file.key)}`,
      });
      const { body } = await restOperation.response;
      const data = await body.json();
      setVersions(data.versions || []);
    } catch (err) {
      setError('Could not load versions: ' + (err.message || 'unknown error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadVersion(versionId) {
    try {
      const { url } = await getUrl({
        key: file.key,
        options: {
          expiresIn: 300,
          versionId,
        },
      });
      const a = document.createElement('a');
      a.href = url.toString();
      a.download = `${file.name}_${versionId.slice(0, 8)}`;
      a.click();
    } catch (err) {
      alert('Could not get download URL: ' + err.message);
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="version-modal">
        <div className="version-modal-header">
          <div>
            <div className="version-modal-title">{file.name}</div>
            <div className="version-modal-sub">version history</div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="version-list">
          {loading && (
            <div className="version-loading">
              <div className="spinner" />
              <span>loading versions…</span>
            </div>
          )}

          {!loading && error && (
            <div className="version-empty" style={{ color: 'var(--red)' }}>{error}</div>
          )}

          {!loading && !error && versions.length === 0 && (
            <div className="version-empty">no versions found</div>
          )}

          {!loading && !error && versions.map((v, i) => (
            <div key={v.versionId || i} className="version-item">
              <div className="version-meta">
                <div className="version-id">
                  {v.isLatest && <span className="version-badge-latest">latest</span>}{' '}
                  v{versions.length - i} — {(v.versionId || '').slice(0, 16)}…
                </div>
                <div className="version-date">{formatDate(v.lastModified)}</div>
              </div>
              <span className="version-size">{formatSize(v.size)}</span>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '11px', padding: '6px 12px' }}
                onClick={() => handleDownloadVersion(v.versionId)}
              >
                restore
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
