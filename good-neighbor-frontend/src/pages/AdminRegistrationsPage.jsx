import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';

const AdminRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, [statusFilter]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all' 
        ? '/admin/registrations' 
        : `/admin/registrations?status=${statusFilter}`;
      const response = await api.get(url);
      // Ensure unique IDs to prevent React key warnings
      const uniqueRegistrations = response.data.registrations.map((reg, index) => ({
        ...reg,
        uniqueKey: reg.id || `reg-${index}-${reg.edrpou}`
      }));
      setRegistrations(uniqueRegistrations);
    } catch (err) {
      console.error('Failed to fetch registrations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Ви впевнені, що хочете схвалити цю заявку? Буде створено обліковий запис адміністратора.')) {
      return;
    }

    setProcessing(true);
    try {
      await api.patch(`/admin/registrations/${id}/approve`);
      alert('Заявку успішно схвалено!');
      fetchRegistrations();
      setSelectedRegistration(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка схвалення заявки');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      alert('Будь ласка, вкажіть причину відхилення');
      return;
    }

    if (!confirm('Ви впевнені, що хочете відхилити цю заявку?')) {
      return;
    }

    setProcessing(true);
    try {
      await api.patch(`/admin/registrations/${id}/reject`, {
        rejection_reason: rejectionReason
      });
      alert('Заявку відхилено');
      fetchRegistrations();
      setSelectedRegistration(null);
      setRejectionReason('');
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка відхилення заявки');
    } finally {
      setProcessing(false);
    }
  };

  const downloadProtocol = async (id) => {
    try {
      const response = await api.get(`/admin/registrations/${id}/protocol`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `protocol-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Помилка завантаження протоколу');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Очікує розгляду';
      case 'approved':
        return 'Схвалено';
      case 'rejected':
        return 'Відхилено';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link to="/admin" className="text-gray-400 hover:text-gray-600">
            ← Назад
          </Link>
          <Logo type="acronym" className="h-10" />
          <h1 className="text-lg font-bold text-gray-900 ml-2">Заявки на реєстрацію ОСББ</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter */}
        <div className="mb-6 flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? 'Всі' : getStatusText(status)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center border-dashed border-2 border-gray-200">
                <p className="text-gray-500">Немає заявок для відображення</p>
              </div>
            ) : (
              registrations.map((reg) => (
                <div
                  key={reg.uniqueKey || reg.id || `reg-${reg.edrpou}-${reg.head_rnokpp}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {reg.osbb_name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reg.status)}`}>
                          {getStatusText(reg.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">ЄДРПОУ:</span>
                          <span className="ml-2 font-medium">{reg.edrpou}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Голова:</span>
                          <span className="ml-2 font-medium">{reg.head_full_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">РНОКПП:</span>
                          <span className="ml-2 font-medium">{reg.head_rnokpp}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <span className="ml-2 font-medium">{reg.head_email}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Телефон:</span>
                          <span className="ml-2 font-medium">{reg.head_phone}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Подано:</span>
                          <span className="ml-2 font-medium">
                            {new Date(reg.created_at).toLocaleDateString('uk-UA')}
                          </span>
                        </div>
                      </div>

                      {reg.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-700">
                            <strong>Причина відхилення:</strong> {reg.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => downloadProtocol(reg.id)}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Завантажити протокол
                      </button>
                      {reg.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(reg.id)}
                            disabled={processing}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            Схвалити
                          </button>
                          <button
                            onClick={() => setSelectedRegistration(reg)}
                            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Відхилити
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Rejection Modal */}
        {selectedRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Відхилити заявку
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ОСББ: {selectedRegistration.osbb_name}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Причина відхилення *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Вкажіть причину відхилення заявки..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedRegistration(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Скасувати
                </button>
                <button
                  onClick={() => handleReject(selectedRegistration.id)}
                  disabled={processing || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Відхилити
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminRegistrationsPage;


