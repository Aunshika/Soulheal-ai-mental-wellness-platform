import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [resForm, setResForm] = useState({ title:'', description:'', category:'Meditation', content:'', url:'' });
  const [resMsg, setResMsg] = useState('');
  const [captchaEnabled, setCaptchaEnabled] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [s, u, a, r, set] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/users'),
        API.get('/admin/appointments'),
        API.get('/admin/resources'),
        API.get('/admin/settings'),
      ]);
      setStats(s.data.stats);
      setUsers(u.data.users || []);
      setAppointments(a.data.appointments || []);
      setResources(r.data.resources || []);
      const captchaObj = set.data.settings?.find(x => x.key === 'captchaEnabled');
      setCaptchaEnabled(captchaObj ? captchaObj.value : true);
    } catch(e) { console.error('Admin API Error:', e.response?.status); }
    finally { setLoading(false); }
  };

  const toggleCaptcha = async () => {
    try {
      await API.put('/admin/settings', { key: 'captchaEnabled', value: !captchaEnabled });
      setCaptchaEnabled(!captchaEnabled);
      alert('Security settings updated successfully!');
    } catch { alert('Failed to update setting'); }
  };

  const toggleUser = async (id) => {
    try {
      const r = await API.put(`/admin/users/${id}/toggle`);
      setUsers(users.map(u => u._id === id ? r.data.user : u));
    } catch { alert('Failed'); }
  };

  const changeStatus = async (id, status) => {
    try {
      const r = await API.put(`/admin/users/${id}/status`, { status });
      setUsers(users.map(u => u._id === id ? r.data.user : u));
    } catch { alert('Failed to change status'); }
  };

  const changeRole = async (id, role) => {
    try {
      const r = await API.put(`/admin/users/${id}/role`, { role });
      setUsers(users.map(u => u._id === id ? r.data.user : u));
    } catch { alert('Failed'); }
  };

  const addResource = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/resources', resForm);
      setResMsg('Resource added successfully!');
      setResForm({ title:'', description:'', category:'Meditation', content:'', url:'' });
      const r = await API.get('/admin/resources');
      setResources(r.data.resources || []);
    } catch { setResMsg('Failed to add resource'); }
  };

  const deleteResource = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await API.delete(`/admin/resources/${id}`);
      setResources(resources.filter(r => r._id !== id));
    } catch { alert('Failed'); }
  };

  const filteredUsers = roleFilter ? users.filter(u => u.role === roleFilter) : users;
  const ROLE_BADGE = { student:'blue', counselor:'green', admin:'purple' };

  if (!user || user.role !== 'admin') return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div style={{ fontSize: '3rem', color: 'var(--red)', marginBottom: 20 }}>
          <i className="fi fi-rr-lock" />
        </div>
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-light)', marginTop: 10 }}>You do not have administrative privileges to view this page.</p>
        <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => window.location.href='/'}>Return Home</button>
      </main>
    </div>
  );

  if (loading) return (
    <div className="app-layout"><Sidebar />
      <main className="main-content" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="spinner" />
      </main>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p>Manage users, resources, and monitor platform activity</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid-4" style={{ marginBottom:24 }}>
            {[
              { label:'Students', val:stats.students, icon:'fi-sr-graduation-cap', color:'blue' },
              { label:'Counselors', val:stats.counselors, icon:'fi-sr-user-md', color:'green' },
              { label:'Appointments', val:stats.appointments, icon:'fi-sr-calendar', color:'orange' },
              { label:'Pending', val:stats.pendingAppointments, icon:'fi-sr-clock', color:'red' },
              { label:'Assessments', val:stats.assessments, icon:'fi-sr-clipboard-list', color:'purple' },
              { label:'Mood Entries', val:stats.moodEntries, icon:'fi-sr-chart-line-up', color:'blue' },
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
        )}

        <div className="tabs">
          {[['overview','Overview'],['users','Users'],['appointments','Appointments'],['resources','Resources'],['assignments','Assignments'],['settings','Settings']].map(([val,label]) => (
            <button key={val} className={`tab-btn ${tab===val?'active':''}`} onClick={() => setTab(val)}>{label}</button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && stats && (
          <div className="grid-2">
            <div className="card">
              <h3 style={{ marginBottom:16 }}>Recent Users</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {users.slice(0,6).map(u => {
                  const initials = u.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
                  return (
                    <div key={u._id} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg, var(--primary), var(--secondary))',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:600,fontSize:'0.85rem' }}>{initials}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:'0.88rem' }}>{u.name}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--text-light)' }}>{u.email}</div>
                      </div>
                      <span className={`badge badge-${ROLE_BADGE[u.role]}`}>{u.role}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card">
              <h3 style={{ marginBottom:16 }}>Recent Appointments</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {appointments.slice(0,6).map(a => (
                  <div key={a._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:'0.85rem' }}>{a.student?.name} → {a.counselor?.name}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text-light)' }}>{new Date(a.appointmentDate).toLocaleDateString()}</div>
                    </div>
                    <span className={`badge badge-${a.status==='Confirmed'?'green':a.status==='Pending'?'orange':a.status==='Completed'?'blue':'gray'}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="card">
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
              <h3 style={{ flex:1 }}>All Users ({filteredUsers.length})</h3>
              <div style={{ display:'flex', gap:8 }}>
                {['','student','counselor','admin'].map(role => (
                  <button key={role} onClick={() => setRoleFilter(role)}
                    className={`btn btn-sm ${roleFilter===role?'btn-primary':'btn-outline'}`}>
                    {role || 'All'}
                  </button>
                ))}
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id}>
                      <td style={{ fontWeight:600, fontSize:'0.88rem' }}>{u.name}</td>
                      <td style={{ fontSize:'0.83rem', color:'var(--text-light)' }}>{u.email}</td>
                      <td>
                        <select value={u.role} onChange={e => changeRole(u._id, e.target.value)}
                          style={{ fontSize:'0.78rem', padding:'4px 8px', border:'1px solid var(--border)', borderRadius:6, background:'white', cursor:'pointer' }}>
                          <option value="student">Student</option>
                          <option value="counselor">Counselor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <select value={u.status || (u.isActive ? 'active' : 'suspended')} onChange={e => changeStatus(u._id, e.target.value)}
                          style={{ fontSize:'0.78rem', padding:'4px 8px', border:'1px solid var(--border)', borderRadius:6, background:'white', cursor:'pointer' }}>
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="temporary_suspended">Temp Suspend</option>
                        </select>
                      </td>
                      <td style={{ fontSize:'0.78rem', color:'var(--text-light)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${u.isActive?'green':'red'}`}>{u.isActive?'Online Access':'Access Denied'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Appointments */}
        {tab === 'appointments' && (
          <div className="card">
            <h3 style={{ marginBottom:20 }}>All Appointments ({appointments.length})</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Student</th><th>Counselor</th><th>Date</th><th>Type</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a._id}>
                      <td style={{ fontWeight:600, fontSize:'0.88rem' }}>{a.student?.name}</td>
                      <td style={{ fontSize:'0.85rem' }}>{a.counselor?.name}</td>
                      <td style={{ fontSize:'0.82rem', color:'var(--text-light)' }}>{new Date(a.appointmentDate).toLocaleDateString()}</td>
                      <td><span className="badge badge-blue">{a.type}</span></td>
                      <td><span className={`badge badge-${a.status==='Confirmed'?'green':a.status==='Pending'?'orange':a.status==='Completed'?'blue':'gray'}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resources */}
        {tab === 'resources' && (
          <div className="grid-2">
            <div className="card">
              <h3 style={{ marginBottom:20 }}>Add Resource</h3>
              {resMsg && <div className={`alert ${resMsg.includes('success')?'alert-success':'alert-error'}`}>{resMsg}</div>}
              <form onSubmit={addResource}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={resForm.title} onChange={e => setResForm({...resForm,title:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={resForm.category} onChange={e => setResForm({...resForm,category:e.target.value})}>
                    {['Meditation','Breathing','Articles','Videos','Tips','Emergency'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" value={resForm.description} onChange={e => setResForm({...resForm,description:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Content (optional)</label>
                  <textarea className="form-input" value={resForm.content} onChange={e => setResForm({...resForm,content:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">URL (optional)</label>
                  <input className="form-input" type="url" placeholder="https://" value={resForm.url} onChange={e => setResForm({...resForm,url:e.target.value})} />
                </div>
                <button className="btn btn-primary btn-full" type="submit">
                  <i className="fi fi-rr-plus" /> Add Resource
                </button>
              </form>
            </div>
            <div className="card">
              <h3 style={{ marginBottom:16 }}>Existing Resources ({resources.length})</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:500, overflowY:'auto' }}>
                {resources.map(r => (
                  <div key={r._id} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px', background:'var(--bg)', borderRadius:'var(--radius-sm)' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:'0.88rem' }}>{r.title}</div>
                      <span className="badge badge-blue" style={{ marginTop:4 }}>{r.category}</span>
                    </div>
                    <button className="btn btn-sm" style={{ background:'var(--danger-light)',color:'var(--danger)',border:'none',flexShrink:0 }}
                      onClick={() => deleteResource(r._id)}>
                      <i className="fi fi-rr-trash" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Assignments */}
        {tab === 'assignments' && (
          <div className="card">
            <h3 style={{ marginBottom:20 }}>Upload User Assignment / Assessment</h3>
            <div className="alert alert-warning" style={{ marginBottom: 20 }}>
              Use this section to upload custom assignments or manual assessments for specific users.
            </div>
            <form onSubmit={e => { e.preventDefault(); alert('Assignment uploaded successfully!'); }}>
              <div className="form-group">
                <label className="form-label">Select User</label>
                <select className="form-input" required>
                  <option value="">Choose a user...</option>
                  {filteredUsers.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assignment Title</label>
                <input className="form-input" placeholder="e.g. Weekly Reflection Journal" required />
              </div>
              <div className="form-group">
                <label className="form-label">Upload File</label>
                <input className="form-input" type="file" required />
              </div>
              <button className="btn btn-primary" type="submit">
                <i className="fi fi-rr-upload" /> Upload Assignment
              </button>
            </form>
          </div>
        )}

        {/* Settings */}
        {tab === 'settings' && (
          <div className="card">
            <h3 style={{ marginBottom: 20 }}>Global Settings</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Registration & Login CAPTCHA</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 4 }}>Enable or disable Google reCAPTCHA during user registration and login globally across the network.</div>
              </div>
              <button className={`btn btn-sm ${captchaEnabled ? 'btn-red' : 'btn-primary'}`} style={{ backgroundColor: captchaEnabled ? '#ff4d4d' : 'var(--primary)', color: 'white', border: 'none' }} onClick={toggleCaptcha}>
                {captchaEnabled ? 'Turn OFF' : 'Turn ON'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
