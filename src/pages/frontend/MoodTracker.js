import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const MOODS = [
  { name: 'Happy', emoji: '😊', color: '#22C997' },
  { name: 'Calm', emoji: '😌', color: '#4F7EF7' },
  { name: 'Motivated', emoji: '🚀', color: '#22C997' },
  { name: 'Neutral', emoji: '😐', color: '#8A9BB3' },
  { name: 'Anxious', emoji: '😰', color: '#F5A623' },
  { name: 'Sad', emoji: '😢', color: '#7C5CBF' },
  { name: 'Angry', emoji: '😠', color: '#F25D60' },
  { name: 'Overwhelmed', emoji: '🤯', color: '#F97B4F' },
];

const SCORE_LABELS = { 1: 'Very Bad', 2: 'Bad', 3: 'Poor', 4: 'Below Average', 5: 'Average', 6: 'Fair', 7: 'Good', 8: 'Very Good', 9: 'Great', 10: 'Excellent' };

export default function MoodTracker() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ mood: '', moodScore: 5, notes: '' });
  const [aiSuggestion, setAiSuggestion] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'student') { setLoading(false); return; }
    loadEntries();
  }, [user]);

  const loadEntries = async () => {
    try {
      const res = await API.get('/mood?limit=30');
      setEntries(res.data.entries || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mood) return setError('Please select your mood');
    setSubmitting(true);
    setError('');
    setSuccess('');
    setAiSuggestion('');
    try {
      const res = await API.post('/mood', form);
      setAiSuggestion(res.data.entry.aiSuggestion);
      setSuccess('Mood logged successfully! 🎉');
      setForm({ mood: '', moodScore: 5, notes: '' });
      loadEntries();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log mood');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this mood entry?')) return;
    try {
      await API.delete(`/mood/${id}`);
      setEntries(entries.filter(e => e._id !== id));
    } catch (e) {
      alert('Failed to delete entry');
    }
  };

  const chartData = [...entries].reverse().slice(-14).map(e => ({
    date: new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    score: e.moodScore, mood: e.mood
  }));

  const avgScore = entries.length ? (entries.reduce((s, e) => s + e.moodScore, 0) / entries.length).toFixed(1) : 0;
  const selectedMood = MOODS.find(m => m.name === form.mood);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h1>Mood Tracker</h1>
          <p>Log your daily emotions and discover patterns over time</p>
        </div>

        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Log Mood Form */}
          <div className="card">
            <h3 style={{ marginBottom: 20 }}>How are you feeling today?</h3>

            {error && <div className="alert alert-error">{error}</div>}
            {success && (
              <div className="alert alert-success" style={{ marginBottom: 12 }}>{success}</div>
            )}
            {aiSuggestion && (
              <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', borderLeft: '3px solid var(--primary)', marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <i className="fi fi-sr-brain" /> AI Suggestion
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-mid)', lineHeight: 1.7 }}>{aiSuggestion}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Select Your Mood</label>
                <div className="mood-grid">
                  {MOODS.map(m => (
                    <button type="button" key={m.name} className={`mood-btn ${form.mood === m.name ? 'selected' : ''}`}
                      onClick={() => setForm({ ...form, mood: m.name })}
                      style={form.mood === m.name ? { borderColor: m.color, background: m.color + '18', color: m.color } : {}}>
                      <span className="emoji">{m.emoji}</span>
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Mood Score: <strong style={{ color: selectedMood?.color || 'var(--primary)' }}>
                    {form.moodScore}/10 — {SCORE_LABELS[form.moodScore]}
                  </strong>
                </label>
                <input
                  type="range" min={1} max={10} value={form.moodScore}
                  onChange={e => setForm({ ...form, moodScore: parseInt(e.target.value) })}
                  className="score-slider"
                  style={{ background: `linear-gradient(to right, ${selectedMood?.color || 'var(--primary)'} 0%, ${selectedMood?.color || 'var(--primary)'} ${(form.moodScore - 1) / 9 * 100}%, var(--border) ${(form.moodScore - 1) / 9 * 100}%)` }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-light)', marginTop: 4 }}>
                  <span>1 – Very Bad</span><span>10 – Excellent</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-input" placeholder="What's on your mind? Describe how you're feeling..."
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
                {submitting
                  ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving...</>
                  : <><i className="fi fi-rr-check" /> Log My Mood</>}
              </button>
            </form>
          </div>

          {/* Stats + Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="grid-2">
              <div className="stat-card">
                <div className="stat-icon blue"><i className="fi fi-sr-chart-line-up" /></div>
                <div className="stat-info">
                  <div className="stat-value">{avgScore}</div>
                  <div className="stat-label">Average Score</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green"><i className="fi fi-sr-list" /></div>
                <div className="stat-info">
                  <div className="stat-value">{entries.length}</div>
                  <div className="stat-label">Total Entries</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 16 }}>14-Day Trend</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-light)' }} />
                    <YAxis domain={[1, 10]} tick={{ fontSize: 10, fill: 'var(--text-light)' }} />
                    <Tooltip contentStyle={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                    <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5} dot={{ fill: 'var(--primary)', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-light)' }}>Log moods to see your trend</div>
              )}
            </div>
          </div>
        </div>

        {/* Entries History */}
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>Mood History</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : entries.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Mood</th>
                    <th>Score</th>
                    <th>Notes</th>
                    <th>AI Suggestion</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => {
                    const m = MOODS.find(x => x.name === entry.mood);
                    return (
                      <tr key={entry._id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.83rem', color: 'var(--text-light)' }}>
                          {new Date(entry.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </td>
                        <td>
                          <span className="mood-chip" style={{ background: (m?.color || '#ccc') + '18', color: m?.color || '#666' }}>
                            {m?.emoji} {entry.mood}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: m?.color }}>{entry.moodScore}</strong>
                          <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>/10</span>
                        </td>
                        <td style={{ maxWidth: 180, fontSize: '0.82rem', color: 'var(--text-mid)' }}>
                          {entry.notes ? entry.notes.slice(0, 60) + (entry.notes.length > 60 ? '…' : '') : '—'}
                        </td>
                        <td style={{ maxWidth: 200, fontSize: '0.78rem', color: 'var(--text-light)' }}>
                          {entry.aiSuggestion ? entry.aiSuggestion.slice(0, 80) + '…' : '—'}
                        </td>
                        <td>
                          <button className="btn btn-sm" style={{ color: 'var(--danger)', background: 'var(--danger-light)', border: 'none' }}
                            onClick={() => handleDelete(entry._id)}>
                            <i className="fi fi-rr-trash" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
              <i className="fi fi-rr-chart-line-up" style={{ fontSize: 40, display: 'block', marginBottom: 12 }} />
              <p>No mood entries yet. Log your first mood above!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
