import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const fileRef = useRef(null);
  const EMOJIS = ['😊', '😂', '🥺', '😢', '😡', '👍', '❤️', '🙏', '🙌', '👀'];

  useEffect(() => {
    // 1. Setup socket synchronously so cleanup can reliably close it
    socketRef.current = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

    socketRef.current.on('receive_message', (msg) => {
      if (msg.senderId === user._id) return; // Prevent duplicate
      setMessages(prev => {
        // Prevent strictly identical duplicate message bugs just in case
        if (prev.some(m => m.timestamp === msg.timestamp && m.senderId === msg.senderId && m.text === msg.text)) return prev;
        return [...prev, msg];
      });
    });

    // 2. Fetch data
    API.get('/appointments/my').then(async res => {
      const appts = res.data.appointments || [];
      const appt = appts.find(a => a._id === id);
      if (!appt || (appt.status !== 'Confirmed' && appt.status !== 'Completed')) {
        alert('Invalid or unconfirmed chat appointment');
        navigate('/appointments');
      } else {
        setAppointment(appt);

        // Fetch historical messages from DB
        try {
          const msgRes = await API.get(`/appointments/${appt._id}/messages`);
          if (msgRes.data.messages) {
            setMessages(msgRes.data.messages);
          }
        } catch (err) { console.error('Error fetching chat history:', err); }

        // Only join rooms once the appointment is verified
        socketRef.current.emit('join_room', { userId: user._id, roomId: `appt_${appt._id}` });
        socketRef.current.emit('join_room', { userId: user._id, roomId: `counselor_${appt.counselor?._id}` });
      }
    }).catch(() => {
      navigate('/appointments');
    }).finally(() => setLoading(false));

    return () => {
      socketRef.current?.disconnect();
    };
  }, [id, navigate, user._id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!msgInput.trim()) return;
    const roomId = `appt_${appointment._id}`;
    const msg = { roomId, senderId: user._id, senderName: user.name, text: msgInput, sent: true };
    setMessages(prev => [...prev, { ...msg, timestamp: new Date().toISOString() }]);
    socketRef.current?.emit('send_message', msg);
    setMsgInput('');
    setShowEmoji(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const roomId = `appt_${appointment._id}`;
      const msg = { roomId, senderId: user._id, senderName: user.name, text: '', attachment: { data: reader.result, name: file.name, type: file.type }, sent: true };
      setMessages(prev => [...prev, { ...msg, timestamp: new Date().toISOString() }]);
      socketRef.current?.emit('send_message', msg);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // clear
  };

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </main>
    </div>
  );

  if (!appointment) return null;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/appointments')} style={{ marginBottom: 20 }}>
          ← Back to Appointments
        </button>

        <div className="card" style={{ maxWidth: 800, padding: 0, overflow: 'hidden', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
          <div className="chat-header">
            <div className="stat-icon blue" style={{ width: 40, height: 40, fontSize: 18 }}><i className="fi fi-sr-comments" /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Chat with {appointment.counselor?.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Secure counseling session</div>
            </div>
          </div>
          
          <div className="chat-messages" style={{ flex: 1, padding: '20px', background: '#f8fafc' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.9rem', marginTop: 40 }}>
                This is the beginning of your chat session.
              </div>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className={`message ${m.senderId === user._id ? 'sent' : 'received'}`}>
                {m.text}
                {m.attachment && (
                  <div style={{ marginTop: 6 }}>
                    {m.attachment.type.startsWith('image/') ? (
                      <img src={m.attachment.data} alt="attachment" style={{ maxWidth: 200, borderRadius: 6, display: 'block' }} />
                    ) : (
                      <a href={m.attachment.data} download={m.attachment.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,255,255,0.2)', color: 'inherit', borderRadius: 4, textDecoration: 'none', fontSize: '0.85rem' }}>
                        <i className="fi fi-rr-clip" /> {m.attachment.name}
                      </a>
                    )}
                  </div>
                )}
                <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: 4 }}>{m.senderName}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          
          <div className="chat-input-area" style={{ padding: '16px 20px', background: '#fff', borderTop: '1px solid var(--border)', position: 'relative' }}>
            {showEmoji && (
              <div style={{ position: 'absolute', bottom: '100%', left: 20, marginBottom: 10, background: '#fff', padding: 10, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', gap: 6, zIndex: 10 }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setMsgInput(prev => prev + e)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', padding: 4 }}>{e}</button>
                ))}
              </div>
            )}
            <button className="btn btn-outline" style={{ border: 'none', padding: '0 10px', fontSize: 20 }} onClick={() => setShowEmoji(!showEmoji)}>
              <i className="fi fi-rr-smile" />
            </button>
            <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={handleFileUpload} />
            <button className="btn btn-outline" style={{ border: 'none', padding: '0 10px', fontSize: 18 }} onClick={() => fileRef.current?.click()}>
              <i className="fi fi-rr-clip" />
            </button>
            <input className="form-input" style={{ flex: 1, margin: '0 10px' }} placeholder="Type a message..." value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()} />
            <button className="btn btn-primary" onClick={sendMessage}><i className="fi fi-rr-paper-plane" /> Send</button>
          </div>
        </div>
      </main>
    </div>
  );
}
