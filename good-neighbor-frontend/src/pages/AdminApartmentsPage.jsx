import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';

const AdminApartmentsPage = () => {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [newCode, setNewCode] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/apartments');
      setApartments(response.data.apartments);
    } catch (err) {
      setError('Помилка завантаження квартир');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async (apartmentId, role) => {
    setGenerating(true);
    setError('');
    setNewCode(null);
    
    try {
      const response = await api.post('/admin/invitations/generate', {
        apartment_id: apartmentId,
        role: role
      });
      setNewCode(response.data);
      fetchApartments(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка генерації коду');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'activated':
        return 'bg-green-100 text-green-800';
      case 'invited':
        return 'bg-yellow-100 text-yellow-800';
      case 'not_invited':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'activated':
        return 'Активовано';
      case 'invited':
        return 'Запрошено';
      case 'not_invited':
        return 'Не запрошено';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link to="/admin" className="text-gray-400 hover:text-gray-600">
            ← Назада
          </Link>
          <Logo type="acronym" className="h-10" />
          <h1 className="text-lg font-bold text-gray-900 ml-2">Управління квартирами</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {newCode && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            <p className="font-semibold">Код запрошення згенеровано!</p>
            <p className="mt-1">Код: <span className="font-mono font-bold text-lg">{newCode.code}</span></p>
            <p className="text-sm mt-1">Квартира: {newCode.apartment}, Роль: {newCode.role === 'owner' ? 'Власник' : 'Орендар'}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Квартира
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Площа
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Баланс
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Власник
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Коди запрошення / Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apartments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">№{apt.number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{apt.area} м²</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          apt.balance < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {apt.balance.toFixed(2)} грн
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {apt.owner || '-'}
                        </div>
                        {apt.phone && (
                          <div className="text-xs text-gray-500">{apt.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(apt.status)}`}>
                          {getStatusText(apt.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {/* Invitation Codes Display */}
                        {apt.invitation_codes && apt.invitation_codes.length > 0 && (
                          <div className="mb-2 space-y-1">
                            {apt.invitation_codes.map((code, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className={`font-mono text-xs px-2 py-1 rounded ${
                                  code.is_used 
                                    ? 'bg-neutral-200 text-neutral-600 line-through' 
                                    : 'bg-accent-100 text-accent-800 font-semibold'
                                }`}>
                                  {code.code}
                                </span>
                                <span className="text-xs text-neutral-500">
                                  {code.role === 'owner' ? 'Власник' : 'Орендар'}
                                </span>
                                {code.is_used ? (
                                  <span className="text-xs text-neutral-400">
                                    (Використано {code.used_at ? new Date(code.used_at).toLocaleDateString('uk-UA') : ''})
                                  </span>
                                ) : (
                                  <span className="text-xs text-accent-600 font-medium">Активний</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Generate Buttons */}
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleGenerateCode(apt.id, 'owner')}
                            disabled={generating}
                            className="text-xs px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Згенерувати код для власника"
                          >
                            {apt.invitation_codes?.some(c => !c.is_used && c.role === 'owner') ? 'Регенерувати (Власник)' : 'Код (Власник)'}
                          </button>
                          <button
                            onClick={() => handleGenerateCode(apt.id, 'tenant')}
                            disabled={generating}
                            className="text-xs px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Згенерувати код для орендаря"
                          >
                            {apt.invitation_codes?.some(c => !c.is_used && c.role === 'tenant') ? 'Регенерувати (Орендар)' : 'Код (Орендар)'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {apartments.length === 0 && !loading && (
          <div className="bg-white rounded-lg p-12 text-center border-dashed border-2 border-gray-200">
            <p className="text-gray-500">Немає квартир для відображення</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminApartmentsPage;


