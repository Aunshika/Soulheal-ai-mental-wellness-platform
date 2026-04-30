import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const captchaRef = useRef(null);

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', gender: 'male' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaEnabled, setCaptchaEnabled] = useState(true);

  React.useEffect(() => {
    API.get('/auth/captcha-status').then(res => setCaptchaEnabled(res.data.enabled)).catch(() => {});
  }, []);

  const SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) return setError('Password must be at least 6 characters');

    let captchaToken = 'dev-bypass';
    if (captchaEnabled) {
      captchaToken = captchaRef.current?.getValue();
      if (!captchaToken) return setError('Please complete the CAPTCHA verification');
    }

    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role, form.gender, captchaToken);
      const redirect = { student: '/dashboard', counselor: '/counselor', admin: '/admin' };
      navigate(redirect[user.role] || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      captchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <h2>Begin Your Healing Journey 🌱</h2>
        <p>Join thousands of students who use SoulHeal to manage stress and improve mental wellness.</p>
        <div className="auth-features">
          {[
            { icon: 'fi fi-sr-smile', text: 'Daily mood tracking with insights' },
            { icon: 'fi fi-sr-clipboard-list', text: 'Validated mental health assessments' },
            { icon: 'fi fi-sr-calendar', text: 'Easy counselor appointment booking' },
            { icon: 'fi fi-sr-leaf', text: 'Guided meditations & stress tips' },
          ].map((f, i) => (
            <div className="auth-feature-item" key={i}>
              <i className={f.icon} style={{ fontSize: 22 }} />
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-form-wrap fade-in">
          <div className="brand">
            <div className="logo-icon"><i className="fi fi-sr-heart" /></div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>
              Soul<span style={{ color: 'var(--primary)' }}>Heal</span>
            </span>
          </div>
          <h1>Create your account</h1>
          <p className="subtitle">Start your mental wellness journey today</p>

          {error && <div className="alert alert-error"><i className="fi fi-rr-exclamation" /> {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" placeholder="Your full name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="your@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min. 6 characters" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">I am a...</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['student', 'counselor'].map(role => (
                  <button type="button" key={role} onClick={() => setForm({ ...form, role })}
                    className="btn"
                    style={{
                      flex: 1, border: `2px solid ${form.role === role ? 'var(--primary)' : 'var(--border)'}`,
                      background: form.role === role ? 'var(--primary-light)' : 'var(--white)',
                      color: form.role === role ? 'var(--primary)' : 'var(--text-mid)',
                      textTransform: 'capitalize'
                    }}>
                    <i className={`fi ${role === 'student' ? 'fi-rr-graduation-cap' : 'fi-rr-user-md'}`} />
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['male', 'female'].map(gender => (
                  <button type="button" key={gender} onClick={() => setForm({ ...form, gender })}
                    className="btn"
                    style={{
                      flex: 1, border: `2px solid ${form.gender === gender ? 'var(--primary)' : 'var(--border)'}`,
                      background: form.gender === gender ? 'var(--primary-light)' : 'var(--white)',
                      color: form.gender === gender ? 'var(--primary)' : 'var(--text-mid)',
                      textTransform: 'capitalize'
                    }}>
                    <i className={`fi ${gender === 'male' ? 'fi-rr-male' : 'fi-rr-female'}`} />
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            {captchaEnabled && (
              <div className="form-group">
                <ReCAPTCHA ref={captchaRef} sitekey={SITE_KEY} theme="light" />
              </div>
            )}

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading
                ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating account...</>
                : <><i className="fi fi-rr-user-add" /> Create Account</>}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
