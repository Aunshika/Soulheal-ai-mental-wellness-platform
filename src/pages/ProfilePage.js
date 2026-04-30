import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, login } = useAuth();
  // We'll manually update localStorage to sync context after save
  const [form, setForm] = useState({ name: '', bio: '', specialization: '', geminiApiKey: '', avatar: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = React.useRef(null);

  useEffect(() => {
    API.get('/auth/me').then(res => {
      const u = res.data.user;
      setForm({ name: u.name || '', bio: u.bio || '', specialization: u.specialization || '', geminiApiKey: u.geminiApiKey || '', avatar: u.avatar || '' });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await API.put('/auth/profile', form);
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      // Update localStorage with ALL updated fields (name, avatar, bio etc.)
      const stored = JSON.parse(localStorage.getItem('soulheal_user') || '{}');
      const updated = { ...stored, name: form.name, avatar: form.avatar };
      localStorage.setItem('soulheal_user', JSON.stringify(updated));
      // Force a page-level re-read so sidebar picks up new avatar
      window.dispatchEvent(new Event('soulheal_profile_updated'));
    } catch {
      setMsg({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setForm({ ...form, avatar: reader.result });
      reader.readAsDataURL(file);
    }
  };

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </main>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h1>My Profile</h1>
          <p>Update your personal information and preferences.</p>
        </div>

        <div className="card" style={{ maxWidth: 600 }}>
          {msg.text && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 20 }}>{msg.text}</div>}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'var(--bg)', border: '2px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {form.avatar ? (
                <img src={form.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <i className="fi fi-rr-user" style={{ fontSize: 32, color: 'var(--text-light)' }} />
              )}
            </div>
            <div>
              <input type="file" accept="image/png, image/jpeg, image/jpg" ref={fileRef} style={{ display: 'none' }} onChange={handleAvatarUpload} />
              <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
                <i className="fi fi-rr-picture" /> Change Picture
              </button>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 8 }}>JPG, JPEG, PNG formats supported.</div>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>

            {user?.role === 'counselor' && (
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <input className="form-input" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Student Counseling" />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell us a little about yourself..." rows={4} />
            </div>

            <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginTop: 20 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
