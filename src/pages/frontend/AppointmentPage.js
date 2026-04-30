import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const TIME_SLOTS = ['09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM'];
const STATUS_BADGE = { Pending:'orange', Confirmed:'green', Completed:'blue', Cancelled:'gray' };

export default function AppointmentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('book');
  const [counselors, setCounselors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ counselorId:'', appointmentDate:'', timeSlot:'', type:'Chat', reason:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    API.get('/appointments/counselors').then(r => setCounselors(r.data.counselors || []));
    loadAppointments();
  }, [user]);

  const loadAppointments = async () => {
    const r = await API.get('/appointments/my');
    setAppointments(r.data.appointments || []);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.counselorId || !form.appointmentDate || !form.timeSlot || !form.reason)
      return setError('Please fill in all required fields');
    setLoading(true);
    try {
      await API.post('/appointments', form);
      setSuccess('Appointment booked successfully! 🎉 The counselor will confirm shortly.');
      setForm({ counselorId:'', appointmentDate:'', timeSlot:'', type:'Chat', reason:'' });
      setTab('my');
      loadAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally { setLoading(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await API.put(`/appointments/${id}/cancel`);
      loadAppointments();
    } catch { alert('Failed to cancel'); }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h1>Counselor Appointments</h1>
          <p>Book a session with a certified mental health counselor</p>
        </div>

        <div className="tabs">
          {[['book','Book Appointment'],['my','My Appointments']].map(([val,label]) => (
            <button key={val} className={`tab-btn ${tab===val?'active':''}`} onClick={() => setTab(val)}>{label}</button>
          ))}
        </div>

        {tab === 'book' && (
          <div className="grid-2">
            {/* Booking Form */}
            <div className="card">
              <h3 style={{ marginBottom:20 }}>Schedule a Session</h3>
              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <form onSubmit={handleBook}>
                <div className="form-group">
                  <label className="form-label">Select Counselor *</label>
                  <select className="form-input" value={form.counselorId} onChange={e => setForm({...form, counselorId: e.target.value})} required>
                    <option value="">Choose a counselor...</option>
                    {counselors.map(c => (
                      <option key={c._id} value={c._id}>{c.name} {c.specialization ? `– ${c.specialization}` : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input className="form-input" type="date" min={today} value={form.appointmentDate}
                      onChange={e => setForm({...form, appointmentDate: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Session Type</label>
                    <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                      {['Chat','Video','In-Person'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Time Slot *</label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                    {TIME_SLOTS.map(slot => (
                      <button type="button" key={slot}
                        className={`answer-btn ${form.timeSlot===slot?'selected':''}`}
                        onClick={() => setForm({...form, timeSlot: slot})}
                        style={{ padding:'8px 4px', fontSize:'0.78rem' }}>{slot}</button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Visit *</label>
                  <textarea className="form-input" placeholder="Briefly describe what you'd like to discuss..."
                    value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} required />
                </div>

                <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                  {loading ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}} /> Booking...</>
                    : <><i className="fi fi-rr-calendar-check" /> Book Appointment</>}
                </button>
              </form>
            </div>

            {/* Counselor Cards */}
            <div>
              <h3 style={{ marginBottom:16, color:'var(--text-mid)', fontWeight:500 }}>Available Counselors</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {counselors.length > 0 ? counselors.map(c => {
                  const initials = c.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
                  return (
                    <div key={c._id} className="card" style={{ padding:'18px 20px', cursor:'pointer', border: form.counselorId===c._id ? '2px solid var(--primary)' : '1px solid var(--border)' }}
                      onClick={() => setForm({...form, counselorId: c._id})}>
                      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                        <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg, var(--primary), var(--secondary))', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:'1.1rem', flexShrink:0 }}>
                          {initials}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600 }}>{c.name}</div>
                          <div style={{ fontSize:'0.8rem', color:'var(--text-light)' }}>{c.specialization || 'Student Counseling'}</div>
                          <div style={{ fontSize:'0.78rem', color:'var(--success)', marginTop:2 }}>
                            <i className="fi fi-sr-check-circle" /> Available
                          </div>
                        </div>
                        {form.counselorId===c._id && <i className="fi fi-sr-check-circle" style={{ color:'var(--primary)', fontSize:20 }} />}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="card" style={{ textAlign:'center', padding:'30px', color:'var(--text-light)' }}>
                    <i className="fi fi-rr-user-md" style={{ fontSize:36, display:'block', marginBottom:12 }} />
                    <p>No counselors available yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'my' && (
          <div>
            {appointments.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {appointments.map(appt => (
                  <div key={appt._id} className="appointment-card">
                    <div className="stat-icon blue" style={{ width:46, height:46, fontSize:18 }}>
                      <i className={`fi fi-sr-${appt.type==='Video'?'video-camera':appt.type==='Chat'?'comments':'hospital'}`} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600 }}>{appt.counselor?.name}</div>
                      <div style={{ fontSize:'0.8rem', color:'var(--text-light)', marginTop:2 }}>
                        <i className="fi fi-rr-calendar" /> {new Date(appt.appointmentDate).toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'})}
                        &nbsp;·&nbsp; <i className="fi fi-rr-clock" /> {appt.timeSlot}
                        &nbsp;·&nbsp; <i className="fi fi-rr-comments" /> {appt.type}
                      </div>
                      {appt.reason && <div style={{ fontSize:'0.78rem', color:'var(--text-light)', marginTop:4 }}>Reason: {appt.reason}</div>}
                      {appt.meetingLink && appt.type === 'Video' && (
                        <a href={appt.meetingLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary" style={{ marginTop:8 }}>
                          <i className="fi fi-rr-video-camera" /> Join Meeting
                        </a>
                      )}
                      {(appt.status === 'Confirmed' || appt.status === 'Completed') && appt.type === 'Chat' && (
                        <button className="btn btn-sm btn-primary" style={{ marginTop:8 }} onClick={() => navigate(`/chat/${appt._id}`)}>
                          <i className="fi fi-rr-comments" /> Open Chat
                        </button>
                      )}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                      <span className={`badge badge-${STATUS_BADGE[appt.status]}`}>{appt.status}</span>
                      {(appt.status === 'Pending' || appt.status === 'Confirmed') && (
                        <button className="btn btn-sm" style={{ background:'var(--danger-light)', color:'var(--danger)', border:'none' }}
                          onClick={() => handleCancel(appt._id)}>Cancel</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign:'center', padding:'50px 20px', color:'var(--text-light)' }}>
                <i className="fi fi-rr-calendar" style={{ fontSize:48, display:'block', marginBottom:16 }} />
                <h3 style={{ marginBottom:8 }}>No appointments yet</h3>
                <p style={{ marginBottom:20 }}>Book a session with a counselor to get personalized support</p>
                <button className="btn btn-primary" onClick={() => setTab('book')}>
                  <i className="fi fi-rr-plus" /> Book Now
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
