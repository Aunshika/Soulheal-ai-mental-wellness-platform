import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const studentNav = [
  { to: '/dashboard', icon: 'fi fi-rr-home', label: 'Dashboard' },
  { to: '/mood', icon: 'fi fi-rr-chart-line-up', label: 'Mood Tracker' },
  { to: '/assessment', icon: 'fi fi-rr-clipboard-list', label: 'Self Assessment' },
  { to: '/appointments', icon: 'fi fi-rr-calendar', label: 'Appointments' },
  { to: '/resources', icon: 'fi fi-rr-book-alt', label: 'Wellness Resources' },
];

const counselorNav = [
  { to: '/counselor', icon: 'fi fi-rr-home', label: 'Dashboard' },
  { to: '/resources', icon: 'fi fi-rr-book-alt', label: 'Resources' },
];

const adminNav = [
  { to: '/admin', icon: 'fi fi-rr-home', label: 'Dashboard' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(user?.avatar || '');

  // Listen for profile updates so sidebar avatar refreshes immediately
  useEffect(() => {
    const handleUpdate = () => {
      const stored = JSON.parse(localStorage.getItem('soulheal_user') || '{}');
      setAvatarSrc(stored.avatar || '');
    };
    window.addEventListener('soulheal_profile_updated', handleUpdate);
    return () => window.removeEventListener('soulheal_profile_updated', handleUpdate);
  }, []);

  // Also sync when user object changes
  useEffect(() => {
    setAvatarSrc(user?.avatar || '');
  }, [user?.avatar]);

  const navItems = user?.role === 'counselor' ? counselorNav : user?.role === 'admin' ? adminNav : studentNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {/* Mobile hamburger */}
      <button className="mobile-menu-btn" onClick={() => setOpen(!open)}>
        <i className={`fi ${open ? 'fi-rr-cross' : 'fi-rr-menu-burger'}`} style={{ fontSize: 18 }} />
      </button>

      {/* Overlay */}
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99 }} />}

      <nav className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon"><i className="fi fi-sr-heart" /></div>
            <span className="logo-text">Soul<span>Heal</span></span>
          </div>
          <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--text-light)', letterSpacing: '0.06em', textTransform: 'uppercase', paddingLeft: 50 }}>
            Mental Wellness
          </div>
        </div>

        {/* Nav */}
        <div className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <i className={item.icon} />
              {item.label}
            </NavLink>
          ))}

          <div className="nav-section-label" style={{ marginTop: 16 }}>Account</div>
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>
            <i className="fi fi-rr-user" />
            My Profile
          </NavLink>
          <button className="nav-link" style={{ width: '100%', textAlign: 'left' }} onClick={handleLogout}>
            <i className="fi fi-rr-sign-out-alt" />
            Sign Out
          </button>
        </div>

        {/* User info */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">
              {avatarSrc
                ? <img src={avatarSrc} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : initials
              }
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role" style={{ textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
