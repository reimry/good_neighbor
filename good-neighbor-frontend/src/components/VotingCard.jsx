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
    if (!isActive) {
      alert('Голосування неактивне. Можна голосувати тільки в активних голосуваннях.');
      return;
    }
    
    if (hasVoted) {
      alert('Ви вже проголосували в цьому голосуванні.');
      return;
    }

    setLoading(true);
    try {
      console.log('Voting:', { votingId: voting.id, choice, status: voting.status, userVote: voting.user_vote });
      const response = await api.post(`/votings/${voting.id}/vote`, { choice });
      console.log('Vote successful:', response.data);
      if (onVote) {
        // Small delay to ensure backend has processed
        setTimeout(() => {
          onVote();
        }, 500);
      }
    } catch (err) {
      console.error('Vote error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        votingId: voting.id,
        choice
      });
      const errorMessage = err.response?.data?.error || err.message || 'Помилка голосування';
      alert(`Помилка: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (choice) => {
    if (!voting.results) return 0;
    const stat = voting.results.stats.find(s => s.choice === choice);
    if (!stat) return 0;
    
    // Use the percentage already calculated by backend, but ensure it's valid
    const percentage = parseFloat(stat.percentage || 0);
    
    // Cap at 100% to prevent overflow
    return Math.min(percentage, 100).toFixed(1);
  };

  const renderProgressBar = (choice, label, colorClass) => {
      const percentage = parseFloat(getPercentage(choice));
      const clampedPercentage = Math.min(Math.max(percentage, 0), 100); // Ensure 0-100 range
      return (
          <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className="text-gray-500">{clampedPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full ${colorClass}`} 
                    style={{ width: `${clampedPercentage}%`, maxWidth: '100%' }}
                  ></div>
              </div>
          </div>
      );
  };

  const handleDelete = async () => {
    const confirmMessage = isFinished 
      ? 'Ви впевнені, що хочете видалити це завершене голосування? Всі голоси також будуть видалені.'
      : 'Ви впевнені, що хочете видалити це голосування? Всі голоси також будуть видалені.';
    
    if (!confirm(confirmMessage)) {
      return;
    }
    setDeleting(true);
    try {
      const response = await api.delete(`/votings/${voting.id}`);
      if (onVote) onVote(); // Refresh list
      
      if (response.data?.votes_deleted > 0) {
        alert(`Голосування видалено. Також видалено ${response.data.votes_deleted} голосів.`);
      }
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
  const isActive = voting.status === 'active';
  const isDraft = voting.status === 'draft';
  const hasVoted = !!voting.user_vote;
  const canEdit = isAdmin && isDraft;
  const canVote = isActive && !hasVoted;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                  isFinished ? 'bg-gray-100 text-gray-600' : isDraft ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                  {isFinished ? 'Завершено' : isDraft ? 'Чернетка' : 'Активне'}
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
                  {isActive && (
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
                    disabled={deleting}
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                    title={isFinished ? "Видалити (включаючи всі голоси)" : "Видалити"}
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
      {canVote && (
          <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => handleVote('for')}
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  {loading ? '...' : 'ЗА'}
              </button>
              <button 
                onClick={() => handleVote('against')}
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  {loading ? '...' : 'ПРОТИ'}
              </button>
              <button 
                onClick={() => handleVote('abstain')}
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  {loading ? '...' : 'УТРИМАВСЯ'}
              </button>
          </div>
      )}

      {isActive && hasVoted && (
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
              
              <div className="text-xs text-center text-gray-400 mt-2 space-y-1">
                <p>
                  Всього {voting.type === 'legal' ? 'площі' : 'голосів'}: {voting.results.total_voted_weight || voting.results.total_voted || 0} {voting.results.unit}
                </p>
                <p className="text-gray-500">
                  З {voting.results.total_possible_weight || voting.results.total_possible || 0} можливих {voting.results.unit}
                </p>
              </div>
          </div>
      )}
    </div>
  );
};

export default VotingCard;
