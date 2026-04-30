import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const captchaRef = useRef(null);

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [captchaEnabled, setCaptchaEnabled] = useState(true);

  React.useEffect(() => {
    API.get('/auth/captcha-status').then(res => setCaptchaEnabled(res.data.enabled)).catch(() => {});
  }, []);

  const SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // test key

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let captchaToken = 'dev-bypass';
    if (captchaEnabled) {
      captchaToken = captchaRef.current?.getValue();
      if (!captchaToken) return setError('Please complete the CAPTCHA verification');
    }

    setLoading(true);
    try {
      const user = await login(form.email, form.password, captchaToken);
      const redirect = { student: '/dashboard', counselor: '/counselor', admin: '/admin' };
      navigate(redirect[user.role] || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      captchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Hero */}
      <div className="auth-hero">
        <h2>Your Mind Matters 💙</h2>
        <p>A safe, confidential space for students to track wellness and get support when it matters most.</p>
        <div className="auth-features">
          {[
            { icon: 'fi fi-sr-chart-line-up', text: 'Track your daily mood & emotional patterns' },
            { icon: 'fi fi-sr-brain', text: 'AI-powered mental health suggestions' },
            { icon: 'fi fi-sr-user-md', text: 'Connect with certified counselors' },
            { icon: 'fi fi-sr-shield-check', text: '100% private & secure platform' },
          ].map((f, i) => (
            <div className="auth-feature-item" key={i}>
              <i className={f.icon} style={{ fontSize: 22 }} />
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="auth-panel">
        <div className="auth-form-wrap fade-in">
          <div className="brand">
            <div className="logo-icon"><i className="fi fi-sr-heart" /></div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>
              Soul<span style={{ color: 'var(--primary)' }}>Heal</span>
            </span>
          </div>
          <h1>Welcome back</h1>
          <p className="subtitle">Sign in to continue your wellness journey</p>

          {error && <div className="alert alert-error"><i className="fi fi-rr-exclamation" /> {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-light)', fontSize: 16 }}
                >
                  <i className={`fi ${showPass ? 'fi-rr-eye-crossed' : 'fi-rr-eye'}`} />
                </button>
              </div>
            </div>

            {captchaEnabled && (
              <div className="form-group">
                <ReCAPTCHA ref={captchaRef} sitekey={SITE_KEY} theme="light" />
              </div>
            )}

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : <><i className="fi fi-rr-sign-in-alt" /> Sign In</>}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/register">Create one free</Link>
          </p>

          <div className="divider">Demo Credentials</div>
          <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-mid)', lineHeight: 1.8 }}>
            <strong>Student:</strong> student@demo.com / demo123<br />
            <strong>Counselor:</strong> counselor@demo.com / demo123<br />
            <strong>Admin:</strong> admin@demo.com / demo123
          </div>
        </div>
      </div>
    </div>
  );
}
