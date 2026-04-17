import { useState } from 'react';
import { signIn, signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import './AuthForm.css';

export default function AuthForm({ onAuthSuccess }) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'confirm'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function reset() {
    setError('');
    setSuccess('');
  }

  async function handleLogin(e) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      await signIn({ username: email, password });
      onAuthSuccess();
    } catch (err) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      await signUp({
        username: email,
        password,
        options: { userAttributes: { email } },
      });
      setStep('confirm');
      setSuccess('Check your email for a confirmation code.');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      setSuccess('Account confirmed! Signing you in…');
      await signIn({ username: email, password });
      onAuthSuccess();
    } catch (err) {
      setError(err.message || 'Confirmation failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    reset();
    try {
      await resendSignUpCode({ username: email });
      setSuccess('Code resent — check your email.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">drop<span>cloud</span></div>
        <div className="auth-tagline">// serverless file sync</div>

        {step === 'confirm' ? (
          <form onSubmit={handleConfirm}>
            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}
            <div className="form-group">
              <label className="form-label">confirmation code</label>
              <input
                className="form-input"
                type="text"
                placeholder="123456"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary btn-auth" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'confirm account'}
            </button>
            <p className="confirm-hint">
              didn't get it?{' '}
              <button
                type="button"
                onClick={handleResend}
                style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '11px' }}
              >
                resend code
              </button>
            </p>
          </form>
        ) : (
          <>
            <div className="auth-tabs">
              <button
                className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                onClick={() => { setTab('login'); reset(); }}
              >
                sign in
              </button>
              <button
                className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
                onClick={() => { setTab('register'); reset(); }}
              >
                register
              </button>
            </div>

            <form onSubmit={tab === 'login' ? handleLogin : handleRegister}>
              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}

              <div className="form-group">
                <label className="form-label">email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder={tab === 'register' ? 'min 8 chars, 1 uppercase, 1 number' : '••••••••'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <button className="btn btn-primary btn-auth" type="submit" disabled={loading}>
                {loading
                  ? <span className="spinner" />
                  : tab === 'login' ? 'sign in' : 'create account'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
