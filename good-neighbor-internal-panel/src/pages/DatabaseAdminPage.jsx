import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function DatabaseAdminPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Users state
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersFilters, setUsersFilters] = useState({ role: '', search: '' });

  // Organizations state
  const [organizations, setOrganizations] = useState([]);
  const [orgsTotal, setOrgsTotal] = useState(0);
  const [orgsPage, setOrgsPage] = useState(1);
  const [orgsFilters, setOrgsFilters] = useState({ status: '', search: '' });

  // Apartments state
  const [apartments, setApartments] = useState([]);
  const [aptsTotal, setAptsTotal] = useState(0);
  const [aptsPage, setAptsPage] = useState(1);
  const [aptsFilters, setAptsFilters] = useState({ search: '' });

  // Edit modals
  const [editingUser, setEditingUser] = useState(null);
  const [editingOrg, setEditingOrg] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'organizations') {
      fetchOrganizations();
    } else if (activeTab === 'apartments') {
      fetchApartments();
    }
  }, [activeTab, usersPage, usersFilters, orgsPage, orgsFilters, aptsPage, aptsFilters]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: String((usersPage - 1) * 20),
        ...(usersFilters.role && { role: usersFilters.role }),
        ...(usersFilters.search && { search: usersFilters.search })
      });
      const response = await api.get(`/internal/db/users?${params}`);
      setUsers(response.data.users);
      setUsersTotal(response.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка завантаження користувачів');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: String((orgsPage - 1) * 20),
        ...(orgsFilters.status && { status: orgsFilters.status }),
        ...(orgsFilters.search && { search: orgsFilters.search })
      });
      const response = await api.get(`/internal/db/organizations?${params}`);
      setOrganizations(response.data.organizations);
      setOrgsTotal(response.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка завантаження організацій');
    } finally {
      setLoading(false);
    }
  };

  const fetchApartments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: String((aptsPage - 1) * 20),
        ...(aptsFilters.search && { search: aptsFilters.search })
      });
      const response = await api.get(`/internal/db/apartments?${params}`);
      setApartments(response.data.apartments);
      setAptsTotal(response.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка завантаження квартир');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (user) => {
    try {
      const response = await api.get(`/internal/db/users/${user.id}`);
      setEditingUser(response.data);
      setShowUserModal(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка завантаження даних користувача');
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.patch(`/internal/db/users/${editingUser.id}`, {
        full_name: editingUser.full_name,
        phone: editingUser.phone,
        email: editingUser.email,
        role: editingUser.role,
        apartment_id: editingUser.apartment_id,
        osbb_id: editingUser.osbb_id
      });
      setShowUserModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка оновлення користувача');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Ви впевнені, що хочете видалити цього користувача?')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.delete(`/internal/db/users/${userId}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка видалення користувача');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrg = async (org) => {
    try {
      const response = await api.get(`/internal/db/organizations/${org.id}`);
      setEditingOrg(response.data);
      setShowOrgModal(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка завантаження даних організації');
    }
  };

  const handleSaveOrg = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.patch(`/internal/db/organizations/${editingOrg.id}`, {
        full_name: editingOrg.full_name,
        edrpou: editingOrg.edrpou,
        address_city: editingOrg.address_city,
        address_street: editingOrg.address_street,
        address_building: editingOrg.address_building,
        authorized_person: editingOrg.authorized_person,
        status: editingOrg.status
      });
      setShowOrgModal(false);
      setEditingOrg(null);
      fetchOrganizations();
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка оновлення організації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-500">Internal Panel</h1>
            <div className="flex items-center gap-4">
              <span className="text-neutral-700">Супер-адміністратор</span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Вийти
              </button>
            </div>
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
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-neutral-700 hover:text-primary-500 hover:border-primary-500"
            >
              Заявки на реєстрацію
            </Link>
            <Link
              to="/audit-logs"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-neutral-700 hover:text-primary-500 hover:border-primary-500"
            >
              Журнал аудиту
            </Link>
            <Link
              to="/database"
              className="border-b-2 border-primary-500 py-4 px-1 text-sm font-medium text-primary-500"
            >
              Управління БД
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6 text-neutral-900">Управління базою даних</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-neutral-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-700 hover:text-primary-500 hover:border-primary-500'
              }`}
            >
              Користувачі ({usersTotal})
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'organizations'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-700 hover:text-primary-500 hover:border-primary-500'
              }`}
            >
              Організації ({orgsTotal})
            </button>
            <button
              onClick={() => setActiveTab('apartments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'apartments'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-700 hover:text-primary-500 hover:border-primary-500'
              }`}
            >
              Квартири ({aptsTotal})
            </button>
          </nav>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Роль</label>
                  <select
                    value={usersFilters.role}
                    onChange={(e) => {
                      setUsersFilters({ ...usersFilters, role: e.target.value });
                      setUsersPage(1);
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                  >
                    <option value="">Всі ролі</option>
                    <option value="admin">Адміністратор</option>
                    <option value="owner">Власник</option>
                    <option value="tenant">Орендар</option>
                    <option value="super_admin">Супер-адміністратор</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Пошук</label>
                  <input
                    type="text"
                    value={usersFilters.search}
                    onChange={(e) => {
                      setUsersFilters({ ...usersFilters, search: e.target.value });
                      setUsersPage(1);
                    }}
                    placeholder="ПІБ, телефон, email..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">ПІБ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Телефон</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Роль</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">OSBB</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Дії</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center">Завантаження...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-neutral-500">Користувачів не знайдено</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{user.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{user.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{user.phone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{user.email || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded ${
                            user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{user.osbb_name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-primary-500 hover:text-primary-700 mr-3"
                          >
                            Редагувати
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Видалити
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="bg-neutral-50 px-6 py-3 flex items-center justify-between">
                <div className="text-sm text-neutral-700">
                  Показано {((usersPage - 1) * 20) + 1} - {Math.min(usersPage * 20, usersTotal)} з {usersTotal}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                    disabled={usersPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => setUsersPage(p => p + 1)}
                    disabled={usersPage * 20 >= usersTotal}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Вперед
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Organizations Tab */}
        {activeTab === 'organizations' && (
          <div>
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Статус</label>
                  <select
                    value={orgsFilters.status}
                    onChange={(e) => {
                      setOrgsFilters({ ...orgsFilters, status: e.target.value });
                      setOrgsPage(1);
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                  >
                    <option value="">Всі статуси</option>
                    <option value="pending">Очікує</option>
                    <option value="approved">Схвалено</option>
                    <option value="rejected">Відхилено</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Пошук</label>
                  <input
                    type="text"
                    value={orgsFilters.search}
                    onChange={(e) => {
                      setOrgsFilters({ ...orgsFilters, search: e.target.value });
                      setOrgsPage(1);
                    }}
                    placeholder="Назва, ЄДРПОУ..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Organizations Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Назва</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">ЄДРПОУ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Адреса</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Статус</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Користувачі</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Дії</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center">Завантаження...</td>
                    </tr>
                  ) : organizations.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-neutral-500">Організацій не знайдено</td>
                    </tr>
                  ) : (
                    organizations.map((org) => (
                      <tr key={org.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{org.id}</td>
                        <td className="px-6 py-4 text-sm text-neutral-900">{org.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{org.edrpou}</td>
                        <td className="px-6 py-4 text-sm text-neutral-500">
                          {org.address_city && `${org.address_city}, ${org.address_street} ${org.address_building}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded ${
                            org.status === 'approved' ? 'bg-green-100 text-green-800' :
                            org.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {org.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {org.user_count} користувачів, {org.apartment_count} квартир
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleEditOrg(org)}
                            className="text-primary-500 hover:text-primary-700"
                          >
                            Редагувати
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="bg-neutral-50 px-6 py-3 flex items-center justify-between">
                <div className="text-sm text-neutral-700">
                  Показано {((orgsPage - 1) * 20) + 1} - {Math.min(orgsPage * 20, orgsTotal)} з {orgsTotal}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOrgsPage(p => Math.max(1, p - 1))}
                    disabled={orgsPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => setOrgsPage(p => p + 1)}
                    disabled={orgsPage * 20 >= orgsTotal}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Вперед
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Apartments Tab */}
        {activeTab === 'apartments' && (
          <div>
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <input
                type="text"
                value={aptsFilters.search}
                onChange={(e) => {
                  setAptsFilters({ ...aptsFilters, search: e.target.value });
                  setAptsPage(1);
                }}
                placeholder="Пошук за номером квартири..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              />
            </div>

            {/* Apartments Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Номер</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Площа (м²)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Баланс (грн)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">OSBB</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Мешканці</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center">Завантаження...</td>
                    </tr>
                  ) : apartments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-neutral-500">Квартир не знайдено</td>
                    </tr>
                  ) : (
                    apartments.map((apt) => (
                      <tr key={apt.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{apt.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{apt.number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{apt.area}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          parseFloat(apt.balance) < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {parseFloat(apt.balance).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{apt.osbb_name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{apt.resident_count || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="bg-neutral-50 px-6 py-3 flex items-center justify-between">
                <div className="text-sm text-neutral-700">
                  Показано {((aptsPage - 1) * 20) + 1} - {Math.min(aptsPage * 20, aptsTotal)} з {aptsTotal}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAptsPage(p => Math.max(1, p - 1))}
                    disabled={aptsPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => setAptsPage(p => p + 1)}
                    disabled={aptsPage * 20 >= aptsTotal}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Вперед
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showUserModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Редагувати користувача</h3>
              <form onSubmit={handleSaveUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">ПІБ</label>
                    <input
                      type="text"
                      value={editingUser.full_name || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Телефон</label>
                    <input
                      type="text"
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editingUser.email || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Роль</label>
                    <select
                      value={editingUser.role || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                      required
                    >
                      <option value="admin">Адміністратор</option>
                      <option value="owner">Власник</option>
                      <option value="tenant">Орендар</option>
                      <option value="super_admin">Супер-адміністратор</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserModal(false);
                      setEditingUser(null);
                    }}
                    className="px-4 py-2 border border-neutral-300 rounded-md hover:bg-neutral-50"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                  >
                    Зберегти
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Organization Modal */}
        {showOrgModal && editingOrg && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Редагувати організацію</h3>
              <form onSubmit={handleSaveOrg}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Назва</label>
                    <input
                      type="text"
                      value={editingOrg.full_name || ''}
                      onChange={(e) => setEditingOrg({ ...editingOrg, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">ЄДРПОУ</label>
                    <input
                      type="text"
                      value={editingOrg.edrpou || ''}
                      onChange={(e) => setEditingOrg({ ...editingOrg, edrpou: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Місто</label>
                      <input
                        type="text"
                        value={editingOrg.address_city || ''}
                        onChange={(e) => setEditingOrg({ ...editingOrg, address_city: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Вулиця</label>
                      <input
                        type="text"
                        value={editingOrg.address_street || ''}
                        onChange={(e) => setEditingOrg({ ...editingOrg, address_street: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Будинок</label>
                      <input
                        type="text"
                        value={editingOrg.address_building || ''}
                        onChange={(e) => setEditingOrg({ ...editingOrg, address_building: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Керівник</label>
                    <input
                      type="text"
                      value={editingOrg.authorized_person || ''}
                      onChange={(e) => setEditingOrg({ ...editingOrg, authorized_person: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Статус</label>
                    <select
                      value={editingOrg.status || ''}
                      onChange={(e) => setEditingOrg({ ...editingOrg, status: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                      required
                    >
                      <option value="pending">Очікує</option>
                      <option value="approved">Схвалено</option>
                      <option value="rejected">Відхилено</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOrgModal(false);
                      setEditingOrg(null);
                    }}
                    className="px-4 py-2 border border-neutral-300 rounded-md hover:bg-neutral-50"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                  >
                    Зберегти
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
