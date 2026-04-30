import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const STATUS_BADGE = { Pending:'orange', Confirmed:'green', Completed:'blue', Cancelled:'gray' };

export default function CounselorPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [studentMoods, setStudentMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [chatHistories, setChatHistories] = useState({});
  const [msgInput, setMsgInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const fileRef = useRef(null);
  const selectedRef = useRef(null);
  const EMOJIS = ['😊', '😂', '🥺', '😢', '😡', '👍', '❤️', '🙏', '🙌', '👀'];

  useEffect(() => {
    if (!user || user.role !== 'counselor') {
      setLoading(false);
      return;
    }
    // Socket setup
    socketRef.current = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
    socketRef.current.emit('join_room', { userId: user._id, roomId: `counselor_${user._id}` });
    socketRef.current.on('receive_message', (msg) => {
      if (msg.senderId === user._id) return;
      setChatHistories(prev => ({
        ...prev,
        [msg.roomId]: [...(prev[msg.roomId] || []), msg]
      }));
    });

    loadAppointments();

    return () => socketRef.current?.disconnect();
  }, [user._id]);

  const currentMessages = selected ? (chatHistories[`appt_${selected._id}`] || []) : [];

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [currentMessages]);

  const loadAppointments = async () => {
    try {
      const r = await API.get('/appointments/counselor');
      const appts = r.data.appointments || [];
      setAppointments(appts);
      // Join all appointment rooms so counselor receives messages from students
      if (socketRef.current) {
        appts.forEach(a => socketRef.current.emit('join_room', { userId: user._id, roomId: `appt_${a._id}` }));
      }
    } finally { setLoading(false); }
  };

  const selectAppointment = async (appt) => {
    setSelected(appt);
    selectedRef.current = appt;
    // Don't wipe 'messages' here since it is derived from chatHistories
    setNotes(appt.notes || '');
    setMeetingLink(appt.meetingLink || '');
    
    // Load historical messages from DB over API
    try {
      const msgRes = await API.get(`/appointments/${appt._id}/messages`);
      if (msgRes.data.messages) {
        setChatHistories(prev => ({
          ...prev,
          [`appt_${appt._id}`]: msgRes.data.messages
        }));
      }
    } catch { /* Fail silently, default to current memory */ }

    if (appt.student?._id) {
      try {
        const r = await API.get(`/mood/student/${appt.student._id}`);
        setStudentMoods(r.data.entries || []);
      } catch { setStudentMoods([]); }
    }
  };

  const updateStatus = async (status) => {
    try {
      await API.put(`/appointments/${selected._id}`, { status, notes, meetingLink });
      loadAppointments();
      setSelected(prev => ({ ...prev, status, notes, meetingLink }));
      alert(`Appointment ${status.toLowerCase()} successfully`);
    } catch { alert('Update failed'); }
  };

  const sendMessage = () => {
    if (!msgInput.trim() || !selected) return;
    const roomId = `appt_${selected._id}`;
    const msg = { roomId, senderId: user._id, senderName: user.name, text: msgInput, sent: true };
    setChatHistories(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), { ...msg, timestamp: new Date().toISOString() }]
    }));
    socketRef.current?.emit('send_message', msg);
    setMsgInput('');
    setShowEmoji(false);
  };

  const handleFileUpload = (e) => {
    if (!selected) return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const roomId = `appt_${selected._id}`;
      const msg = { roomId, senderId: user._id, senderName: user.name, text: '', attachment: { data: reader.result, name: file.name, type: file.type }, sent: true };
      setChatHistories(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), { ...msg, timestamp: new Date().toISOString() }]
      }));
      socketRef.current?.emit('send_message', msg);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // clear
  };

  const pending = appointments.filter(a => a.status === 'Pending').length;
  const confirmed = appointments.filter(a => a.status === 'Confirmed').length;
  const completed = appointments.filter(a => a.status === 'Completed').length;

  const MOOD_EMOJI = { Happy:'😊', Calm:'😌', Anxious:'😰', Sad:'😢', Angry:'😠', Overwhelmed:'🤯', Motivated:'🚀', Neutral:'😐' };

  if (!user || user.role !== 'counselor') return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div style={{ fontSize: '3rem', color: 'var(--red)', marginBottom: 20 }}>
          <i className="fi fi-rr-lock" />
        </div>
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-light)', marginTop: 10 }}>This area is restricted to Counselor accounts only.</p>
        <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => window.location.href='/'}>Return Home</button>
      </main>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h1>Counselor Dashboard</h1>
          <p>Manage student appointments and provide guidance</p>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom:24 }}>
          {[
            { label:'Total Requests', val:appointments.length, icon:'fi-sr-calendar', color:'blue' },
            { label:'Pending', val:pending, icon:'fi-sr-clock', color:'orange' },
            { label:'Confirmed', val:confirmed, icon:'fi-sr-check-circle', color:'green' },
            { label:'Completed', val:completed, icon:'fi-sr-diploma', color:'purple' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className={`stat-icon ${s.color}`}><i className={`fi ${s.icon}`} /></div>
              <div className="stat-info">
                <div className="stat-value">{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="tabs">
          {[['appointments','Appointments'],['details','Student Detail']].map(([val,label]) => (
            <button key={val} className={`tab-btn ${tab===val?'active':''}`} onClick={() => setTab(val)}>{label}</button>
          ))}
        </div>

        {tab === 'appointments' && (
          <div className="card">
            {loading ? (
              <div style={{ textAlign:'center', padding:40 }}><div className="spinner" style={{ margin:'0 auto' }} /></div>
            ) : appointments.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Student</th><th>Date & Time</th><th>Type</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {appointments.map(appt => (
                      <tr key={appt._id}>
                        <td>
                          <div style={{ fontWeight:600, fontSize:'0.88rem' }}>{appt.student?.name}</div>
                          <div style={{ fontSize:'0.75rem', color:'var(--text-light)' }}>{appt.student?.email}</div>
                        </td>
                        <td style={{ fontSize:'0.83rem' }}>
                          {new Date(appt.appointmentDate).toLocaleDateString('en',{month:'short',day:'numeric'})}<br />
                          <span style={{ color:'var(--text-light)' }}>{appt.timeSlot}</span>
                        </td>
                        <td><span className="badge badge-blue">{appt.type}</span></td>
                        <td style={{ fontSize:'0.82rem', color:'var(--text-mid)', maxWidth:160 }}>
                          {appt.reason?.slice(0,60)}{appt.reason?.length > 60 ? '…' : ''}
                        </td>
                        <td><span className={`badge badge-${STATUS_BADGE[appt.status]}`}>{appt.status}</span></td>
                        <td>
                          <div style={{ display:'flex', gap:6 }}>
                            <button className="btn btn-sm btn-outline" onClick={() => { selectAppointment(appt); setTab('details'); }}>
                              <i className="fi fi-rr-eye" /> View
                            </button>
                            {appt.status === 'Pending' && (
                              <button className="btn btn-sm btn-success" onClick={async () => {
                                await API.put(`/appointments/${appt._id}`, { status:'Confirmed' });
                                loadAppointments();
                              }}>Confirm</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text-light)' }}>
                <i className="fi fi-rr-calendar" style={{ fontSize:48, display:'block', marginBottom:12 }} />
                <p>No appointment requests yet</p>
              </div>
            )}
          </div>
        )}

        {tab === 'details' && selected ? (
          <div className="grid-2">
            {/* Left: Appointment Info */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div className="card">
                <h3 style={{ marginBottom:16 }}>Appointment Details</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:10, fontSize:'0.88rem' }}>
                  {[
                    ['Student', selected.student?.name],
                    ['Email', selected.student?.email],
                    ['Date', new Date(selected.appointmentDate).toLocaleDateString('en',{weekday:'long',year:'numeric',month:'long',day:'numeric'})],
                    ['Time', selected.timeSlot],
                    ['Type', selected.type],
                    ['Status', selected.status],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ color:'var(--text-light)', fontWeight:500 }}>{label}</span>
                      <span style={{ fontWeight:600 }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ padding:'8px 0' }}>
                    <span style={{ color:'var(--text-light)', fontWeight:500 }}>Reason</span>
                    <p style={{ marginTop:6, color:'var(--text-mid)', lineHeight:1.6 }}>{selected.reason}</p>
                  </div>
                </div>

                <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:10 }}>
                  <input className="form-input" placeholder="Meeting link (optional)" value={meetingLink}
                    onChange={e => setMeetingLink(e.target.value)} />
                  <textarea className="form-input" placeholder="Add counselor notes..." value={notes}
                    onChange={e => setNotes(e.target.value)} />
                  <div style={{ display:'flex', gap:8 }}>
                    {selected.status !== 'Confirmed' && <button className="btn btn-success btn-sm" onClick={() => updateStatus('Confirmed')}>Confirm</button>}
                    {selected.status !== 'Completed' && <button className="btn btn-primary btn-sm" onClick={() => updateStatus('Completed')}>Mark Complete</button>}
                    <button className="btn btn-sm" style={{ background:'var(--danger-light)', color:'var(--danger)', border:'none' }}
                      onClick={() => updateStatus('Cancelled')}>Cancel</button>
                  </div>
                </div>
              </div>

              {/* Chat */}
              <div className="card" style={{ padding:0, overflow:'hidden' }}>
                <div className="chat-header">
                  <div className="stat-icon blue" style={{ width:36,height:36,fontSize:16 }}><i className="fi fi-sr-comments" /></div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:'0.9rem' }}>Chat with {selected.student?.name}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-light)' }}>Secure counseling chat</div>
                  </div>
                </div>
                <div className="chat-messages" style={{ height:200 }}>
                  {currentMessages.length === 0 && <div style={{ textAlign:'center', color:'var(--text-light)', fontSize:'0.83rem', margin:'auto' }}>Start the conversation</div>}
                  {currentMessages.map((m,i) => (
                    <div key={i} className={`message ${m.senderId === user._id ? 'sent' : 'received'}`}>
                      {m.text}
                      {m.attachment && (
                        <div style={{ marginTop: 6 }}>
                          {m.attachment.type.startsWith('image/') ? (
                            <img src={m.attachment.data} alt="attachment" style={{ maxWidth: '100%', borderRadius: 6, display: 'block' }} />
                          ) : (
                            <a href={m.attachment.data} download={m.attachment.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,255,255,0.2)', color: 'inherit', borderRadius: 4, textDecoration: 'none', fontSize: '0.85rem' }}>
                              <i className="fi fi-rr-clip" /> {m.attachment.name}
                            </a>
                          )}
                        </div>
                      )}
                      <div style={{ fontSize:'0.65rem', opacity:0.7, marginTop:4 }}>{m.senderName}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="chat-input-area" style={{ position: 'relative' }}>
                  {showEmoji && (
                    <div style={{ position: 'absolute', bottom: '100%', left: 10, marginBottom: 10, background: '#fff', padding: 10, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', gap: 6, zIndex: 10 }}>
                      {EMOJIS.map(e => (
                        <button key={e} onClick={() => setMsgInput(prev => prev + e)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', padding: 4 }}>{e}</button>
                      ))}
                    </div>
                  )}
                  <button className="btn btn-outline" style={{ border: 'none', padding: '0 8px', fontSize: 20 }} onClick={() => setShowEmoji(!showEmoji)}>
                    <i className="fi fi-rr-smile" />
                  </button>
                  <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                  <button className="btn btn-outline" style={{ border: 'none', padding: '0 8px', fontSize: 18 }} onClick={() => fileRef.current?.click()}>
                    <i className="fi fi-rr-clip" />
                  </button>
                  <input className="form-input" style={{ flex:1, margin: '0 6px' }} placeholder="Type a message..." value={msgInput}
                    onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                  <button className="btn btn-primary btn-sm" onClick={sendMessage}><i className="fi fi-rr-paper-plane" /></button>
                </div>
              </div>
            </div>

            {/* Right: Student Mood */}
            <div className="card">
              <h3 style={{ marginBottom:16 }}>Student Mood History</h3>
              {studentMoods.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {studentMoods.slice(0,10).map(m => (
                    <div key={m._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:22 }}>{MOOD_EMOJI[m.mood]}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:'0.85rem' }}>{m.mood} — Score {m.moodScore}/10</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--text-light)' }}>{new Date(m.date).toLocaleDateString()}</div>
                        {m.notes && <div style={{ fontSize:'0.78rem', color:'var(--text-mid)', marginTop:2 }}>{m.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text-light)' }}>
                  <p>No mood data available for this student</p>
                </div>
              )}
            </div>
          </div>
        ) : tab === 'details' && (
          <div className="card" style={{ textAlign:'center', padding:'50px 20px', color:'var(--text-light)' }}>
            <i className="fi fi-rr-user" style={{ fontSize:48, display:'block', marginBottom:12 }} />
            <p>Select an appointment from the Appointments tab to view student details</p>
          </div>
        )}
      </main>
    </div>
  );
}
