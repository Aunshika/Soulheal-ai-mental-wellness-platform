import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';

const CATEGORIES = ['All', 'Meditation', 'Breathing', 'Articles', 'Videos', 'Tips', 'Emergency'];

const CAT_CONFIG = {
  Meditation: { icon:'fi-sr-leaf', color:'var(--success)', bg:'var(--success-light)' },
  Breathing:  { icon:'fi-sr-wind', color:'var(--primary)', bg:'var(--primary-light)' },
  Articles:   { icon:'fi-sr-book-alt', color:'var(--secondary)', bg:'#F3F0FF' },
  Videos:     { icon:'fi-sr-play-circle', color:'var(--accent)', bg:'var(--accent-light)' },
  Tips:       { icon:'fi-sr-bulb', color:'var(--warning)', bg:'var(--warning-light)' },
  Emergency:  { icon:'fi-sr-phone-call', color:'var(--danger)', bg:'var(--danger-light)' },
};

// Default static resources if DB is empty
const STATIC_RESOURCES = [
  { _id:'s1', title:'4-7-8 Breathing Technique', category:'Breathing', description:'A powerful breathing exercise to calm anxiety. Inhale for 4s, hold for 7s, exhale for 8s.', content:'Practice 4 cycles twice a day to reduce stress. This technique activates the parasympathetic nervous system.' },
  { _id:'s2', title:'Body Scan Meditation', category:'Meditation', description:'A 10-minute guided body scan to release tension and improve mindfulness.', url:'https://www.headspace.com' },
  { _id:'s3', title:'5-4-3-2-1 Grounding Technique', category:'Tips', description:'Use your senses to anchor yourself: 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.', content:'Excellent for anxiety and panic attacks.' },
  { _id:'s4', title:'Progressive Muscle Relaxation', category:'Meditation', description:'Systematically tense and release muscle groups to reduce physical stress.', content:'Start from your toes and work up to your head. 15-20 minutes daily.' },
  { _id:'s5', title:'Understanding Exam Anxiety', category:'Articles', description:'Evidence-based strategies to manage stress before and during examinations.', url:'https://www.mindful.org' },
  { _id:'s6', title:'iCall – Mental Health Helpline', category:'Emergency', description:'Free mental health counseling helpline for students. Call 9152987821 (India).', content:'Available Mon–Sat, 8am–10pm. Confidential support in multiple languages.' },
  { _id:'s7', title:'Vandrevala Foundation', category:'Emergency', description:'24/7 crisis mental health helpline. Call 1860-2662-345 or 1800-2333-330 (toll-free, India).', content:'Available round the clock for crisis support.' },
  { _id:'s8', title:'Sleep Hygiene Tips', category:'Tips', description:'10 evidence-based habits for better sleep that dramatically improve mental health.', content:'Consistent sleep schedule, no screens 1hr before bed, cool dark room, limit caffeine after noon.' },
  { _id:'s9', title:'Mindfulness for Students', category:'Videos', description:'Short mindfulness exercises designed for busy students.', url:'https://www.youtube.com/watch?v=inpok4MKVLM' },
  { _id:'s10', title:'Box Breathing Exercise', category:'Breathing', description:'Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Used by military and athletes for calm focus.', content:'Do 4-5 cycles before an exam or stressful situation.' },
  { _id:'s11', title:'Journaling for Mental Health', category:'Tips', description:'Daily journaling reduces cortisol and processes emotions. Try stream-of-consciousness writing.', content:'Write 3 pages every morning without editing. Alternatively, try gratitude journaling.' },
  { _id:'s12', title:'Yoga for Stress Relief', category:'Videos', description:'20-minute beginner yoga flow to release tension and restore energy.', url:'https://www.youtube.com/watch?v=v7AYKMP6rOE' },
];

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    API.get('/resources')
      .then(r => {
        const data = r.data.resources || [];
        setResources(data.length > 0 ? data : STATIC_RESOURCES);
      })
      .catch(() => setResources(STATIC_RESOURCES))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === 'All' ? resources : resources.filter(r => r.category === activeCategory);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h1>Wellness Resources</h1>
          <p>Guided exercises, articles, and tools to support your mental wellbeing</p>
        </div>

        {/* Category Filter */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:28 }}>
          {CATEGORIES.map(cat => {
            const cfg = cat !== 'All' ? CAT_CONFIG[cat] : null;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{
                  padding:'7px 16px', borderRadius:20, fontSize:'0.83rem', fontWeight:600, cursor:'pointer', transition:'var(--transition)', border:'none',
                  background: activeCategory===cat ? (cfg?.color || 'var(--primary)') : 'var(--white)',
                  color: activeCategory===cat ? 'white' : 'var(--text-mid)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                }}>
                {cat !== 'All' && <i className={`fi ${cfg?.icon}`} style={{ marginRight:6, fontSize:13 }} />}
                {cat}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:60 }}><div className="spinner" style={{ margin:'0 auto' }} /></div>
        ) : (
          <div className="grid-3">
            {filtered.map(res => {
              const cfg = CAT_CONFIG[res.category] || { icon:'fi-sr-book-alt', color:'var(--primary)', bg:'var(--primary-light)' };
              const isOpen = expanded === res._id;
              return (
                <div key={res._id} className="resource-card" style={{ display:'flex', flexDirection:'column' }}>
                  <div className="resource-category-icon" style={{ background:cfg.bg, color:cfg.color }}>
                    <i className={`fi ${cfg.icon}`} />
                  </div>
                  <div style={{ marginBottom:6 }}>
                    <span style={{ fontSize:'0.72rem', fontWeight:700, color:cfg.color, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      {res.category}
                    </span>
                  </div>
                  <h3 style={{ marginBottom:8, fontSize:'1rem', lineHeight:1.4 }}>{res.title}</h3>
                  <p style={{ fontSize:'0.83rem', color:'var(--text-light)', flex:1, lineHeight:1.6, marginBottom:14 }}>
                    {res.description}
                  </p>

                  {res.content && isOpen && (
                    <div style={{ background:'var(--bg)', borderRadius:'var(--radius-sm)', padding:'12px 14px', marginBottom:14, fontSize:'0.82rem', color:'var(--text-mid)', lineHeight:1.7, borderLeft:`3px solid ${cfg.color}` }}>
                      {res.content}
                    </div>
                  )}

                  <div style={{ display:'flex', gap:8 }}>
                    {res.content && (
                      <button className="btn btn-outline btn-sm" style={{ flex:1 }} onClick={() => setExpanded(isOpen ? null : res._id)}>
                        <i className={`fi fi-rr-${isOpen?'minus':'plus'}`} />
                        {isOpen ? 'Less' : 'Read More'}
                      </button>
                    )}
                    {res.url && (
                      <a href={res.url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ flex:1 }}>
                        <i className="fi fi-rr-arrow-up-right-from-square" /> Open
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="card" style={{ textAlign:'center', padding:'50px 20px', color:'var(--text-light)' }}>
            <i className="fi fi-rr-book-alt" style={{ fontSize:48, display:'block', marginBottom:12 }} />
            <p>No resources in this category yet</p>
          </div>
        )}

        {/* Emergency Banner */}
        <div style={{ marginTop:32, background:'linear-gradient(135deg, var(--danger-light), #FFF)', border:'1px solid rgba(242,93,96,0.25)', borderRadius:'var(--radius)', padding:'20px 24px', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:48, height:48, background:'var(--danger)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:22, flexShrink:0 }}>
            <i className="fi fi-sr-phone-call" />
          </div>
          <div style={{ flex:1 }}>
            <h3 style={{ color:'var(--danger)', marginBottom:4 }}>In Crisis? Get Immediate Help</h3>
            <p style={{ fontSize:'0.85rem', color:'var(--text-mid)' }}>
              iCall Helpline: <strong>9152987821</strong> &nbsp;·&nbsp; Vandrevala Foundation: <strong>1860-2662-345</strong> &nbsp;·&nbsp; NIMHANS: <strong>080-46110007</strong>
            </p>
          </div>
          <a href="tel:9152987821" className="btn btn-danger btn-sm">Call Now</a>
        </div>
      </main>
    </div>
  );
}
