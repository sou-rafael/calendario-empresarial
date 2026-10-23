import React, { useState } from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, List, FileText, Settings, Menu, X, Briefcase, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ currentContext, setContext, onOpenImport }) {
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
          <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
            <button 
              onClick={() => { if (onOpenImport) onOpenImport(); setIsOpen(false); }}
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: '0 4px 15px rgba(79, 70, 229, 0.35)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>⚡</span> Importar Boleto
            </button>
          </div>
        </nav>
      </aside>
      
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>
      )}
    </>
  );
}
