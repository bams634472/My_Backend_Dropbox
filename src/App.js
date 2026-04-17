import { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import AuthForm from './components/AuthForm';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import VersionHistory from './components/VersionHistory';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const u = await getCurrentUser();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out error', err);
    }
  }

  function handleUploadComplete() {
    setRefreshTick(t => t + 1);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={checkUser} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          drop<span>cloud</span>
        </div>
        <div className="user-info">
          <span className="user-email">{user.signInDetails?.loginId || user.username}</span>
          <button className="btn btn-ghost" onClick={handleSignOut}>
            sign out
          </button>
        </div>
      </header>

      <main className="app-main">
        <FileUpload userId={user.userId} onUploadComplete={handleUploadComplete} />
        <FileList
          userId={user.userId}
          refreshTick={refreshTick}
          onViewVersions={setSelectedFile}
        />
      </main>

      {selectedFile && (
        <VersionHistory
          file={selectedFile}
          userId={user.userId}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}
