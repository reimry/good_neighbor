import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const NewsCard = ({ news, onDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const isAdmin = user?.role === 'admin';
  
  const date = new Date(news.created_at).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
  });

  const handleDelete = async () => {
    if (!confirm('Ви впевнені, що хочете видалити цю новину?')) {
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/news/${news.id}`);
      if (onDelete) onDelete(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка видалення новини');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`rounded-lg p-5 border shadow-sm transition-shadow hover:shadow-md ${news.is_important ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {news.is_important && (
            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
              Важливо
            </span>
          )}
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
              title="Видалити новину"
            >
              🗑️ Видалити
            </button>
          )}
        </div>
        <span className="text-gray-400 text-xs ml-auto">{date}</span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2 font-heading">
        {news.title}
      </h3>
      <p className="text-gray-600 text-sm line-clamp-3">
        {news.content}
      </p>
    </div>
  );
};

export default NewsCard;
