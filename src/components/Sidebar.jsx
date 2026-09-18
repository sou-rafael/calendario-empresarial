import React, { useState } from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, List, FileText, Settings, Menu, X, Briefcase, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ currentContext, setContext }) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { icon: <CalendarIcon size={20} />, label: 'Calendário', path: '/' },
    { icon: <List size={20} />, label: 'Lista', path: '/list' },
    { icon: <FileText size={20} />, label: 'DRE', path: '/dre' },
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
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
        <div className="sidebar-header" style={{ marginBottom: '1rem' }}>
          <div className="logo-icon">FC</div>
          <h2 className="sidebar-title">
            {currentContext === 'empresarial' ? 'Empresarial' : 'Pessoal'}
          </h2>
        </div>

        {/* Context Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '4px', marginBottom: '2rem' }}>
          <button 
            onClick={() => setContext('empresarial')}
            style={{ 
              flex: 1, padding: '8px', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600,
              background: currentContext === 'empresarial' ? 'var(--accent-primary)' : 'transparent',
              color: currentContext === 'empresarial' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <Briefcase size={16} /> <span className="nav-label">Empresa</span>
          </button>
          <button 
            onClick={() => setContext('pessoal')}
            style={{ 
              flex: 1, padding: '8px', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600,
              background: currentContext === 'pessoal' ? 'var(--accent-primary)' : 'transparent',
              color: currentContext === 'pessoal' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <User size={16} /> <span className="nav-label">Pessoal</span>
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
