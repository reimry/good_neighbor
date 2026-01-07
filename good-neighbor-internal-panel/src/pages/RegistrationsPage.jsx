import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function RegistrationsPage() {
  const { logout } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, [filter]);

  const fetchRegistrations = async () => {
    try {
      const response = await api.get('/internal/registrations', {
        params: { status: filter }
      });
      setRegistrations(response.data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Підтвердити схвалення заявки?')) return;

    try {
      await api.patch(`/internal/registrations/${id}/approve`);
      alert('Заявку схвалено успішно');
      fetchRegistrations();
      setSelectedRegistration(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Помилка схвалення заявки');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Вкажіть причину відхилення:');
    if (!reason) return;

    try {
      await api.patch(`/internal/registrations/${id}/reject`, { rejection_reason: reason });
      alert('Заявку відхилено');
      fetchRegistrations();
      setSelectedRegistration(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Помилка відхилення заявки');
    }
  };

  const viewProtocol = async (id) => {
    try {
      // Fetch PDF through API with authentication
      const response = await api.get(`/internal/registrations/${id}/protocol`, {
        responseType: 'blob' // Important: tell axios to handle as blob
      });
      
      // Create blob URL and open in new tab
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      // Clean up the blob URL when the window is closed or after 5 seconds
      if (newWindow) {
        newWindow.addEventListener('beforeunload', () => {
          window.URL.revokeObjectURL(url);
        });
      }
      // Fallback cleanup after 5 seconds
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error) {
      alert(error.response?.data?.error || 'Помилка завантаження протоколу');
    }
  };

  const viewDetails = async (id) => {
    try {
      const response = await api.get(`/internal/registrations/${id}`);
      setSelectedRegistration(response.data);
    } catch (error) {
      console.error('Error fetching registration details:', error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-500">Internal Panel</h1>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Вийти
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              to="/dashboard"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-neutral-700 hover:text-primary-500 hover:border-primary-500"
            >
              Дашборд
            </Link>
            <Link
              to="/registrations"
              className="border-b-2 border-primary-500 py-4 px-1 text-sm font-medium text-primary-500"
            >
              Заявки на реєстрацію
            </Link>
            <Link
              to="/audit-logs"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-neutral-700 hover:text-primary-500 hover:border-primary-500"
            >
              Журнал аудиту
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">Заявки на реєстрацію ОСББ</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-700'}`}
            >
              Очікують
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded ${filter === 'approved' ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-700'}`}
            >
              Схвалені
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded ${filter === 'rejected' ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-700'}`}
            >
              Відхилені
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Завантаження...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">ЄДРПОУ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Голова</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Дата</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Дії</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{reg.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{reg.edrpou}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{reg.head_full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{reg.head_email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${
                        reg.status === 'approved' ? 'bg-green-100 text-green-800' :
                        reg.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {reg.status === 'pending' ? 'Очікує' : reg.status === 'approved' ? 'Схвалено' : 'Відхилено'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {new Date(reg.created_at).toLocaleDateString('uk-UA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => viewDetails(reg.id)}
                        className="text-primary-500 hover:text-primary-600"
                      >
                        Деталі
                      </button>
                      <button
                        onClick={() => viewProtocol(reg.id)}
                        className="text-accent-500 hover:text-accent-600"
                      >
                        Протокол
                      </button>
                      {reg.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(reg.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Схвалити
                          </button>
                          <button
                            onClick={() => handleReject(reg.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Відхилити
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {registrations.length === 0 && (
              <div className="text-center py-8 text-neutral-500">Заявок не знайдено</div>
            )}
          </div>
        )}

        {/* Details Modal */}
        {selectedRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Деталі заявки #{selectedRegistration.id}</h3>
                <button
                  onClick={() => setSelectedRegistration(null)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <strong>ЄДРПОУ:</strong> {selectedRegistration.edrpou}
                </div>
                <div>
                  <strong>Назва ОСББ:</strong> {selectedRegistration.osbb_name || 'N/A'}
                </div>
                <div>
                  <strong>Голова:</strong> {selectedRegistration.head_full_name}
                </div>
                <div>
                  <strong>РНОКПП:</strong> {selectedRegistration.head_rnokpp}
                </div>
                <div>
                  <strong>Email:</strong> {selectedRegistration.head_email}
                </div>
                <div>
                  <strong>Телефон:</strong> {selectedRegistration.head_phone}
                </div>
                <div>
                  <strong>Адреса:</strong> {selectedRegistration.address ? JSON.stringify(selectedRegistration.address) : 'N/A'}
                </div>
                <div>
                  <strong>Статус:</strong> {selectedRegistration.status}
                </div>
                <div>
                  <strong>Дата створення:</strong> {new Date(selectedRegistration.created_at).toLocaleString('uk-UA')}
                </div>
                {selectedRegistration.status === 'pending' && (
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => {
                        handleApprove(selectedRegistration.id);
                        setSelectedRegistration(null);
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Схвалити
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedRegistration.id);
                        setSelectedRegistration(null);
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Відхилити
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

