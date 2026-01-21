import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const VotingCard = ({ voting, onVote }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const isAdmin = user?.role === 'admin';

  const handleVote = async (choice) => {
    setLoading(true);
    try {
      await api.post(`/votings/${voting.id}/vote`, { choice });
      if (onVote) onVote();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to vote');
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (choice) => {
    if (!voting.results) return 0;
    const stat = voting.results.stats.find(s => s.choice === choice);
    if (!stat) return 0;
    
    // Calculate based on total possible weight/votes to show "absolute" support
    const total = voting.results.total_weight || voting.results.total_possible || 1;
    const value = parseFloat(stat.total_weight || stat.count || 0);
    return ((value / total) * 100).toFixed(1);
  };

  const renderProgressBar = (choice, label, colorClass) => {
      const percentage = getPercentage(choice);
      return (
          <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className="text-gray-500">{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${colorClass}`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
              </div>
          </div>
      );
  };

  const handleDelete = async () => {
    if (!confirm('Ви впевнені, що хочете видалити це голосування? Це можна зробити тільки якщо ще немає голосів.')) {
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/votings/${voting.id}`);
      if (onVote) onVote(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка видалення голосування');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = async () => {
    if (!confirm('Завершити голосування? Після завершення воно стане недоступним для голосування.')) {
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/votings/${voting.id}/close`);
      if (onVote) onVote(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка завершення голосування');
    } finally {
      setLoading(false);
    }
  };

  const isFinished = voting.status === 'finished';
  const hasVoted = !!voting.user_vote;
  const canEdit = isAdmin && voting.status === 'draft';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                  isFinished ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'
              }`}>
                  {isFinished ? 'Завершено' : voting.status === 'draft' ? 'Чернетка' : 'Активне'}
              </span>
              {isAdmin && (
                <div className="flex gap-2">
                  {canEdit && (
                    <button
                      onClick={() => navigate(`/admin/votings/edit/${voting.id}`)}
                      disabled={loading}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      title="Редагувати"
                    >
                      ✏️ Редагувати
                    </button>
                  )}
                  {!isFinished && (
                    <button
                      onClick={handleClose}
                      disabled={loading}
                      className="text-xs text-orange-600 hover:text-orange-800 disabled:opacity-50"
                      title="Завершити голосування"
                    >
                      ✓ Завершити
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={deleting || isFinished}
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                    title="Видалити"
                  >
                    🗑️ Видалити
                  </button>
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 font-heading">{voting.title}</h3>
        </div>
        <div className="text-right">
             <span className="text-xs text-gray-400 block">
                {new Date(voting.created_at).toLocaleDateString('uk-UA')}
             </span>
             {voting.type === 'legal' && (
                 <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded mt-1 inline-block">
                     ⚖️ За площею
                 </span>
             )}
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-6 whitespace-pre-line">
        {voting.description}
      </p>

      {/* ACTION AREA */}
      {!isFinished && !hasVoted && (
          <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => handleVote('for')}
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                  ЗА
              </button>
              <button 
                onClick={() => handleVote('against')}
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                  ПРОТИ
              </button>
              <button 
                onClick={() => handleVote('abstain')}
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                  УТРИМАВСЯ
              </button>
          </div>
      )}

      {!isFinished && hasVoted && (
          <div className="bg-blue-50 border border-blue-100 rounded-md p-4 text-center">
              <p className="text-blue-800 text-sm font-medium">
                  Ви вже проголосували: <span className="uppercase font-bold">{
                      voting.user_vote === 'for' ? 'ЗА' : 
                      voting.user_vote === 'against' ? 'ПРОТИ' : 'УТРИМАВСЯ'
                  }</span>
              </p>
          </div>
      )}

      {/* RESULTS AREA */}
      {isFinished && voting.results && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-900">Результати ({voting.type === 'legal' ? 'Кв. метри' : 'Голоси'}):</h4>
              {renderProgressBar('for', 'ЗА', 'bg-green-500')}
              {renderProgressBar('against', 'ПРОТИ', 'bg-red-500')}
              {renderProgressBar('abstain', 'УТРИМАВСЯ', 'bg-gray-400')}
              
              <p className="text-xs text-center text-gray-400 mt-2">
                 Всього {voting.type === 'legal' ? 'площі' : 'голосів'}: {voting.results.total_weight || voting.results.total_possible} {voting.results.unit}
              </p>
          </div>
      )}
    </div>
  );
};

export default VotingCard;
