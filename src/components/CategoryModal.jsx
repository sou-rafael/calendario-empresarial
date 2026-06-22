import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Trash2, Plus } from 'lucide-react';

export default function CategoryModal({ isOpen, onClose, user, categories, onCategoriesUpdated }) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('categories').insert([
        { user_id: user.id, name: newCategoryName }
      ]);
      if (error) throw error;
      setNewCategoryName('');
      onCategoriesUpdated();
    } catch (error) {
      alert('Erro ao criar categoria: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Tem certeza? Isso pode deixar contas existentes sem categoria.')) return;
    
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      onCategoriesUpdated();
    } catch (error) {
      alert('Erro ao excluir categoria: ' + error.message);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
        
        <h3 style={{ marginBottom: '1.5rem' }}>Gerenciar Categorias</h3>

        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Nova Categoria..."
            value={newCategoryName} 
            onChange={e => setNewCategoryName(e.target.value)}
            style={{ marginBottom: 0 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !newCategoryName.trim()} style={{ padding: '0.75rem 1rem' }}>
            <Plus size={18} />
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
          {categories.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>Nenhuma categoria cadastrada.</p>
          ) : (
            categories.map(cat => (
              <div key={cat.id} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '10px 12px', background: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' 
              }}>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{cat.name}</span>
                <button 
                  onClick={() => handleDeleteCategory(cat.id)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '4px' }}
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
