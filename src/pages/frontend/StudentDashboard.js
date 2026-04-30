import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const MOOD_EMOJI = { Happy: '😊', Calm: '😌', Anxious: '😰', Sad: '😢', Angry: '😠', Overwhelmed: '🤯', Motivated: '🚀', Neutral: '😐' };
const MOOD_COLOR = { Happy: '#22C997', Calm: '#4F7EF7', Anxious: '#F5A623', Sad: '#7C5CBF', Angry: '#F25D60', Overwhelmed: '#F97B4F', Motivated: '#22C997', Neutral: '#8A9BB3' };

export default function StudentDashboard() {
  const { user } = useAuth();
  const [moodData, setMoodData] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'student') { setLoading(false); return; }
    Promise.all([
      API.get('/mood?limit=7'),
      API.get('/assessment'),
      API.get('/appointments/my')
    ]).then(([m, a, ap]) => {
      setMoodData(m.data.entries || []);
      setAssessments(a.data.assessments || []);
      setAppointments(ap.data.appointments || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const chartData = [...moodData].reverse().map(e => ({
    date: new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    score: e.moodScore,
    mood: e.mood
  }));

  const avgScore = moodData.length ? (moodData.reduce((s, e) => s + e.moodScore, 0) / moodData.length).toFixed(1) : '—';
  const latestMood = moodData[0];
  const pendingAppts = appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length;
  const latestAssessment = assessments[0];

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
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
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1>{greet()}, {user?.name?.split(' ')[0]} 👋</h1>
            <p>Here's your wellness overview for today</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/mood" className="btn btn-primary btn-sm">
              <i className="fi fi-rr-plus" /> Log Mood
            </Link>
            <Link to="/assessment" className="btn btn-outline btn-sm">
              <i className="fi fi-rr-clipboard-list" /> Take Assessment
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon blue"><i className="fi fi-sr-chart-line-up" /></div>
            <div className="stat-info">
              <div className="stat-value">{avgScore}</div>
              <div className="stat-label">Avg Mood Score (7d)</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><i className="fi fi-sr-smile" /></div>
            <div className="stat-info">
              <div className="stat-value">{latestMood ? MOOD_EMOJI[latestMood.mood] : '—'}</div>
              <div className="stat-label">Latest Mood: {latestMood?.mood || 'Not logged'}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><i className="fi fi-sr-clipboard-list" /></div>
            <div className="stat-info">
              <div className="stat-value">{assessments.length}</div>
              <div className="stat-label">Assessments Done</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><i className="fi fi-sr-calendar" /></div>
            <div className="stat-info">
              <div className="stat-value">{pendingAppts}</div>
              <div className="stat-label">Active Appointments</div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Mood Chart */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3>Mood Trend (Last 7 Days)</h3>
              <Link to="/mood" className="btn btn-outline btn-sm">View All</Link>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-light)' }} />
                  <YAxis domain={[1, 10]} tick={{ fontSize: 11, fill: 'var(--text-light)' }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                    formatter={(val, _, p) => [val, `Mood Score`]}
                    labelFormatter={l => l}
                  />
                  <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5} dot={{ fill: 'var(--primary)', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
                <i className="fi fi-rr-chart-line-up" style={{ fontSize: 36, display: 'block', marginBottom: 12 }} />
                <p>No mood data yet. <Link to="/mood" style={{ color: 'var(--primary)' }}>Log your first mood →</Link></p>
              </div>
            )}
          </div>

          {/* Recent Moods */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3>Recent Mood Logs</h3>
              <Link to="/mood" className="btn btn-outline btn-sm">Log Mood</Link>
            </div>
            {moodData.slice(0, 5).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {moodData.slice(0, 5).map(entry => (
                  <div key={entry._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 24 }}>{MOOD_EMOJI[entry.mood]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-dark)' }}>{entry.mood}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{new Date(entry.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontWeight: 700, color: MOOD_COLOR[entry.mood] }}>{entry.moodScore}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>/10</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
                <p>No mood logs yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid-2">
          {/* Latest Assessment */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3>Latest Assessment</h3>
              <Link to="/assessment" className="btn btn-outline btn-sm">Take New</Link>
            </div>
            {latestAssessment ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div className="stat-icon purple" style={{ width: 44, height: 44, fontSize: 18 }}><i className="fi fi-sr-brain" /></div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{latestAssessment.assessmentType}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{new Date(latestAssessment.completedAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`badge badge-${latestAssessment.severity === 'Low' ? 'green' : latestAssessment.severity === 'Moderate' ? 'orange' : 'red'}`} style={{ marginLeft: 'auto' }}>
                    {latestAssessment.severity}
                  </span>
                </div>
                <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 12 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-mid)', marginBottom: 6 }}>Result: {latestAssessment.result}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Score: {latestAssessment.score}/20</div>
                </div>
                {latestAssessment.aiRecommendations && (
                  <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', borderLeft: '3px solid var(--primary)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Suggestion</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-mid)', lineHeight: 1.6 }}>{latestAssessment.aiRecommendations}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-light)' }}>
                <i className="fi fi-rr-clipboard-list" style={{ fontSize: 36, display: 'block', marginBottom: 12 }} />
                <p>No assessments yet. <Link to="/assessment" style={{ color: 'var(--primary)' }}>Start now →</Link></p>
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3>Upcoming Appointments</h3>
              <Link to="/appointments" className="btn btn-outline btn-sm">Book New</Link>
            </div>
            {appointments.filter(a => a.status !== 'Cancelled' && a.status !== 'Completed').slice(0, 3).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {appointments.filter(a => a.status !== 'Cancelled' && a.status !== 'Completed').slice(0, 3).map(appt => (
                  <div key={appt._id} className="appointment-card" style={{ padding: '14px 16px' }}>
                    <div className="stat-icon blue" style={{ width: 40, height: 40, fontSize: 16 }}><i className="fi fi-sr-user-md" /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{appt.counselor?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                        {new Date(appt.appointmentDate).toLocaleDateString()} · {appt.timeSlot}
                      </div>
                    </div>
                    <span className={`badge badge-${appt.status === 'Confirmed' ? 'green' : 'orange'}`}>{appt.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-light)' }}>
                <i className="fi fi-rr-calendar" style={{ fontSize: 36, display: 'block', marginBottom: 12 }} />
                <p>No upcoming appointments. <Link to="/appointments" style={{ color: 'var(--primary)' }}>Book one →</Link></p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
