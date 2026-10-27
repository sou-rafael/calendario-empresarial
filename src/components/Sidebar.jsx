import React, { useState } from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, List, FileText, Settings, Menu, X, Briefcase, User, Smartphone } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ currentContext, setContext }) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { icon: <CalendarIcon size={20} />, label: 'Calendário', path: '/' },
    { icon: <List size={20} />, label: 'Lista', path: '/list' },
    { icon: <FileText size={20} />, label: 'DRE', path: '/dre' },
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Smartphone size={20} />, label: 'Versão Mobile', path: '/mobile' },
  ];

  return (
    <>
      <button 
        className="mobile-sidebar-toggle btn btn-secondary"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar glass-panel ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/favicon.svg" 
            alt="KdConta" 
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
              flexShrink: 0
            }} 
          />
          <div className="brand-text">
            <h2 className="sidebar-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              KdConta
            </h2>
            <span style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginTop: '2px' }}>
              Cadê a conta?
            </span>
          </div>
        </div>

        {/* Context Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '1.75rem',
          border: '1px solid var(--border-color)'
        }}>
          <button 
            onClick={() => setContext('empresarial')}
            style={{ 
              flex: 1, padding: '8px 10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600,
              background: currentContext === 'empresarial' ? 'var(--accent-primary)' : 'transparent',
              color: currentContext === 'empresarial' ? '#fff' : 'var(--text-secondary)',
              boxShadow: currentContext === 'empresarial' ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Briefcase size={15} /> <span className="nav-label">Empresa</span>
          </button>
          <button 
            onClick={() => setContext('pessoal')}
            style={{ 
              flex: 1, padding: '8px 10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600,
              background: currentContext === 'pessoal' ? 'var(--accent-primary)' : 'transparent',
              color: currentContext === 'pessoal' ? '#fff' : 'var(--text-secondary)',
              boxShadow: currentContext === 'pessoal' ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <User size={15} /> <span className="nav-label">Pessoal</span>
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item, index) => (
            <NavLink 
              key={index} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
              end={item.path === '/'}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>
      )}
    </>
  );
}
