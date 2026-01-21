import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function DatabaseAdminPage() {
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
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }
    if (newPassword.length < 6) {
      setError('Пароль має бути мінімум 6 символів');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.patch(`/internal/db/users/${editingUser.id}/password`, {
        new_password: newPassword
      });
      setShowPasswordReset(false);
      setNewPassword('');
      setConfirmPassword('');
      alert('Пароль успішно змінено!');
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка зміни пароля');
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
    <div>
      <h2 className="text-2xl font-bold mb-6 text-neutral-900">Database Management</h2>

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
            Users ({usersTotal})
          </button>
          <button
            onClick={() => setActiveTab('organizations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'organizations'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-neutral-700 hover:text-primary-500 hover:border-primary-500'
            }`}
          >
            Organizations ({orgsTotal})
          </button>
          <button
            onClick={() => setActiveTab('apartments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'apartments'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-neutral-700 hover:text-primary-500 hover:border-primary-500'
            }`}
          >
            Apartments ({aptsTotal})
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
                <label className="block text-sm font-medium text-neutral-700 mb-1">Role</label>
                <select
                  value={usersFilters.role}
                  onChange={(e) => {
                    setUsersFilters({ ...usersFilters, role: e.target.value });
                    setUsersPage(1);
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                  <option value="tenant">Tenant</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Search</label>
                <input
                  type="text"
                  value={usersFilters.search}
                  onChange={(e) => {
                    setUsersFilters({ ...usersFilters, search: e.target.value });
                    setUsersPage(1);
                  }}
                  placeholder="Name, phone, email..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Apartment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">OSBB</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Password</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center">Loading...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-neutral-500">No users found</td>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {user.apartment_number ? (
                          <span className="font-medium">
                            #{user.apartment_number}
                            {user.apartment_area && ` (${parseFloat(user.apartment_area).toFixed(1)} m²)`}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{user.osbb_name || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        {(user.password_hash && user.password_hash.trim() !== '') || (user.passwordHash && user.passwordHash.trim() !== '') ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-green-600 font-medium">✓ Set</span>
                            {/* Show test password hint for seeded users */}
                            {(user.phone && user.phone.startsWith('+380501234')) || (user.email && user.email.includes('@osbb')) || (user.email && user.email.includes('@example.com')) ? (
                              <span className="text-xs text-blue-600 font-semibold" title="Test user password">
                                Test: password123
                              </span>
                            ) : null}
                            <details className="text-xs">
                              <summary className="cursor-pointer text-neutral-500 hover:text-neutral-700 underline">
                                View hash
                              </summary>
                              <div className="mt-2">
                                <code 
                                  className="block text-xs bg-neutral-100 p-2 rounded break-all font-mono max-w-xs cursor-pointer hover:bg-neutral-200"
                                  onClick={(e) => {
                                    const hash = user.password_hash || user.passwordHash;
                                    navigator.clipboard.writeText(hash);
                                    e.target.classList.add('bg-green-100');
                                    setTimeout(() => e.target.classList.remove('bg-green-100'), 500);
                                  }}
                                  title="Click to copy"
                                >
                                  {user.password_hash || user.passwordHash || 'N/A'}
                                </code>
                                <span className="text-xs text-neutral-400 mt-1 block">Click to copy hash</span>
                                <span className="text-xs text-yellow-600 mt-1 block italic">⚠️ Cannot reverse to password</span>
                              </div>
                            </details>
                            <button
                              onClick={() => {
                                handleEditUser(user);
                                setShowPasswordReset(true);
                              }}
                              className="text-xs text-yellow-600 hover:text-yellow-700 underline mt-1"
                              title="Reset password"
                            >
                              Reset Password
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-red-600">✗ Not set</span>
                            <button
                              onClick={() => {
                                handleEditUser(user);
                                setShowPasswordReset(true);
                              }}
                              className="text-xs text-yellow-600 hover:text-yellow-700 underline mt-1"
                              title="Set password"
                            >
                              Set Password
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-primary-500 hover:text-primary-700 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>

            {/* Pagination */}
            <div className="bg-neutral-50 px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-neutral-700">
                Showing {((usersPage - 1) * 20) + 1} - {Math.min(usersPage * 20, usersTotal)} of {usersTotal}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                  disabled={usersPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setUsersPage(p => p + 1)}
                  disabled={usersPage * 20 >= usersTotal}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
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
                <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                <select
                  value={orgsFilters.status}
                  onChange={(e) => {
                    setOrgsFilters({ ...orgsFilters, status: e.target.value });
                    setOrgsPage(1);
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Search</label>
                <input
                  type="text"
                  value={orgsFilters.search}
                  onChange={(e) => {
                    setOrgsFilters({ ...orgsFilters, search: e.target.value });
                    setOrgsPage(1);
                  }}
                  placeholder="Name, EDRPOU..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Organizations Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">EDRPOU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center">Loading...</td>
                  </tr>
                ) : organizations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-neutral-500">No organizations found</td>
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
                        {org.user_count} users, {org.apartment_count} apartments
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEditOrg(org)}
                          className="text-primary-500 hover:text-primary-700"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>

            {/* Pagination */}
            <div className="bg-neutral-50 px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-neutral-700">
                Showing {((orgsPage - 1) * 20) + 1} - {Math.min(orgsPage * 20, orgsTotal)} of {orgsTotal}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setOrgsPage(p => Math.max(1, p - 1))}
                  disabled={orgsPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setOrgsPage(p => p + 1)}
                  disabled={orgsPage * 20 >= orgsTotal}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
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
              placeholder="Search by apartment number..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-md"
            />
          </div>

          {/* Apartments Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Area (m²)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Balance (UAH)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">OSBB</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Residents</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">Loading...</td>
                  </tr>
                ) : apartments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-neutral-500">No apartments found</td>
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
            </div>

            {/* Pagination */}
            <div className="bg-neutral-50 px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-neutral-700">
                Showing {((aptsPage - 1) * 20) + 1} - {Math.min(aptsPage * 20, aptsTotal)} of {aptsTotal}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAptsPage(p => Math.max(1, p - 1))}
                  disabled={aptsPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setAptsPage(p => p + 1)}
                  disabled={aptsPage * 20 >= aptsTotal}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit User</h3>
              <button
                type="button"
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                  setShowPasswordReset(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-neutral-500 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>
            
            {/* Password Reset Section */}
            {showPasswordReset ? (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold mb-3 text-yellow-800">Reset Password</h4>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                    >
                      Reset Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordReset(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="px-4 py-2 border border-neutral-300 rounded-md hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
                <div className="mt-3 text-xs text-neutral-600">
                  <strong>Note:</strong> Password hashes cannot be reversed. This will set a new password for the user.
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
                >
                  Reset Password
                </button>
              </div>
            )}
            
            <form onSubmit={handleSaveUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingUser.full_name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
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
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Role</label>
                  <select
                    value={editingUser.role || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                    <option value="tenant">Tenant</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    setShowPasswordReset(false);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-4 py-2 border border-neutral-300 rounded-md hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={showPasswordReset}
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
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
            <h3 className="text-xl font-bold mb-4">Edit Organization</h3>
            <form onSubmit={handleSaveOrg}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingOrg.full_name || ''}
                    onChange={(e) => setEditingOrg({ ...editingOrg, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">EDRPOU</label>
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
                    <label className="block text-sm font-medium text-neutral-700 mb-1">City</label>
                    <input
                      type="text"
                      value={editingOrg.address_city || ''}
                      onChange={(e) => setEditingOrg({ ...editingOrg, address_city: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Street</label>
                    <input
                      type="text"
                      value={editingOrg.address_street || ''}
                      onChange={(e) => setEditingOrg({ ...editingOrg, address_street: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Building</label>
                    <input
                      type="text"
                      value={editingOrg.address_building || ''}
                      onChange={(e) => setEditingOrg({ ...editingOrg, address_building: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Authorized Person</label>
                  <input
                    type="text"
                    value={editingOrg.authorized_person || ''}
                    onChange={(e) => setEditingOrg({ ...editingOrg, authorized_person: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                  <select
                    value={editingOrg.status || ''}
                    onChange={(e) => setEditingOrg({ ...editingOrg, status: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
