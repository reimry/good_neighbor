import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function DatabaseAdminPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Organizations state
  const [organizations, setOrganizations] = useState([]);
  const [orgsTotal, setOrgsTotal] = useState(0);
  const [orgsFilters, setOrgsFilters] = useState({ status: '', search: '' });
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedOrgUsers, setSelectedOrgUsers] = useState([]);
  const [selectedOrgUsersTotal, setSelectedOrgUsersTotal] = useState(0);
  const [selectedOrgUsersPage, setSelectedOrgUsersPage] = useState(1);
  const [selectedOrgApartments, setSelectedOrgApartments] = useState([]);
  const [selectedOrgApartmentsTotal, setSelectedOrgApartmentsTotal] = useState(0);
  const [selectedOrgApartmentsPage, setSelectedOrgApartmentsPage] = useState(1);
  const [selectedOrgDetailTab, setSelectedOrgDetailTab] = useState('users'); // 'users' or 'apartments'

  // Edit modals
  const [editingUser, setEditingUser] = useState(null);
  const [editingOrg, setEditingOrg] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchOrganizations();
  }, [orgsFilters]);

  // Fetch selected organization's users and apartments
  useEffect(() => {
    if (selectedOrg) {
      fetchSelectedOrgUsers();
      fetchSelectedOrgApartments();
    }
  }, [selectedOrg, selectedOrgUsersPage, selectedOrgApartmentsPage]);


  const fetchOrganizations = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        limit: '1000', // Get all for the sidebar list
        offset: '0',
        ...(orgsFilters.status && { status: orgsFilters.status }),
        ...(orgsFilters.search && { search: orgsFilters.search })
      });
      const response = await api.get(`/internal/db/organizations?${params}`);
      setOrganizations(response.data.organizations);
      setOrgsTotal(response.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading organizations');
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedOrgUsers = async () => {
    if (!selectedOrg) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: String((selectedOrgUsersPage - 1) * 20),
        osbb_id: String(selectedOrg.id)
      });
      const response = await api.get(`/internal/db/users?${params}`);
      setSelectedOrgUsers(response.data.users);
      setSelectedOrgUsersTotal(response.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading organization users');
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedOrgApartments = async () => {
    if (!selectedOrg) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: String((selectedOrgApartmentsPage - 1) * 20),
        osbb_id: String(selectedOrg.id)
      });
      const response = await api.get(`/internal/db/apartments?${params}`);
      setSelectedOrgApartments(response.data.apartments);
      setSelectedOrgApartmentsTotal(response.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading organization apartments');
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
      setError(err.response?.data?.error || 'Error loading user data');
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
      if (selectedOrg) {
        fetchSelectedOrgUsers();
        fetchSelectedOrgApartments();
        fetchOrganizations();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.delete(`/internal/db/users/${userId}`);
      if (selectedOrg) {
        fetchSelectedOrgUsers();
        fetchSelectedOrgApartments();
        // Refresh organization stats
        fetchOrganizations();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting user');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
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
      alert('Password changed successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Error changing password');
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
      setError(err.response?.data?.error || 'Error loading organization data');
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
      const orgId = editingOrg.id;
      setShowOrgModal(false);
      setEditingOrg(null);
      await fetchOrganizations();
      // If we edited the selected org, update it
      if (selectedOrg && selectedOrg.id === orgId) {
        // Refresh the selected org data
        const updatedOrgsResponse = await api.get(`/internal/db/organizations?limit=1000`);
        const updatedOrg = updatedOrgsResponse.data.organizations.find(o => o.id === orgId);
        if (updatedOrg) {
          setSelectedOrg(updatedOrg);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating organization');
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

      {/* Organizations Hybrid Layout */}
      <div className="flex flex-col lg:flex-row gap-4 min-h-[600px]">
        {/* Left Sidebar - Organizations List */}
        <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b border-neutral-200">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Search</label>
                <input
                  type="text"
                  value={orgsFilters.search}
                  onChange={(e) => {
                    setOrgsFilters({ ...orgsFilters, search: e.target.value });
                  }}
                  placeholder="Name, EDRPOU..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                />
              </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                  <select
                    value={orgsFilters.status}
                    onChange={(e) => {
                      setOrgsFilters({ ...orgsFilters, status: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Organizations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-neutral-500">Loading...</div>
              ) : organizations.length === 0 ? (
                <div className="p-4 text-center text-neutral-500">No organizations found</div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        setSelectedOrg(org);
                        setSelectedOrgUsersPage(1);
                        setSelectedOrgApartmentsPage(1);
                        setSelectedOrgDetailTab('users');
                      }}
                      className={`w-full text-left p-4 hover:bg-neutral-50 transition-colors ${
                        selectedOrg?.id === org.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm text-neutral-900 line-clamp-1">{org.full_name}</h3>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded flex-shrink-0 ${
                          org.status === 'approved' ? 'bg-green-100 text-green-800' :
                          org.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {org.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mb-1">EDRPOU: {org.edrpou}</p>
                      <p className="text-xs text-neutral-600 mb-2 line-clamp-1">
                        {org.address_city && `${org.address_city}, ${org.address_street} ${org.address_building}`}
                      </p>
                      <div className="flex gap-3 text-xs text-neutral-500">
                        <span>👥 {org.user_count || 0} users</span>
                        <span>🏠 {org.apartment_count || 0} apts</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        {/* Right Panel - Selected Organization Details */}
        <div className="flex-1 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          {selectedOrg ? (
              <>
                {/* Organization Header */}
                <div className="p-6 border-b border-neutral-200 bg-neutral-50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-2">{selectedOrg.full_name}</h3>
                      <div className="space-y-1 text-sm text-neutral-600">
                        <p><strong>EDRPOU:</strong> {selectedOrg.edrpou}</p>
                        {selectedOrg.address_city && (
                          <p><strong>Address:</strong> {selectedOrg.address_city}, {selectedOrg.address_street} {selectedOrg.address_building}</p>
                        )}
                        {selectedOrg.authorized_person && (
                          <p><strong>Authorized Person:</strong> {selectedOrg.authorized_person}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-sm rounded ${
                        selectedOrg.status === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedOrg.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedOrg.status}
                      </span>
                      <button
                        onClick={() => handleEditOrg(selectedOrg)}
                        className="px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detail Tabs */}
                <div className="border-b border-neutral-200">
                  <nav className="flex">
                    <button
                      onClick={() => setSelectedOrgDetailTab('users')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 ${
                        selectedOrgDetailTab === 'users'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      Users ({selectedOrgUsersTotal})
                    </button>
                    <button
                      onClick={() => setSelectedOrgDetailTab('apartments')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 ${
                        selectedOrgDetailTab === 'apartments'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      Apartments ({selectedOrgApartmentsTotal})
                    </button>
                  </nav>
                </div>

                {/* Detail Content */}
                <div className="flex-1 overflow-y-auto">
                  {selectedOrgDetailTab === 'users' ? (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200">
                          <thead className="bg-neutral-50 sticky top-0">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">ID</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Phone</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Email</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Role</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Apartment</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-neutral-200">
                            {loading ? (
                              <tr>
                                <td colSpan="7" className="px-6 py-4 text-center">Loading...</td>
                              </tr>
                            ) : selectedOrgUsers.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-neutral-500">No users found</td>
                              </tr>
                            ) : (
                              selectedOrgUsers.map((user) => (
                                <tr key={user.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{user.id}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{user.full_name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{user.phone || '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{user.email || '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs rounded ${
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
                      {selectedOrgUsersTotal > 20 && (
                        <div className="bg-neutral-50 px-6 py-3 flex items-center justify-between border-t">
                          <div className="text-sm text-neutral-700">
                            Showing {((selectedOrgUsersPage - 1) * 20) + 1} - {Math.min(selectedOrgUsersPage * 20, selectedOrgUsersTotal)} of {selectedOrgUsersTotal}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedOrgUsersPage(p => Math.max(1, p - 1))}
                              disabled={selectedOrgUsersPage === 1}
                              className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => setSelectedOrgUsersPage(p => p + 1)}
                              disabled={selectedOrgUsersPage * 20 >= selectedOrgUsersTotal}
                              className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200">
                          <thead className="bg-neutral-50 sticky top-0">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">ID</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Number</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Area (m²)</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Balance (UAH)</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Residents</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-neutral-200">
                            {loading ? (
                              <tr>
                                <td colSpan="5" className="px-6 py-4 text-center">Loading...</td>
                              </tr>
                            ) : selectedOrgApartments.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-neutral-500">No apartments found</td>
                              </tr>
                            ) : (
                              selectedOrgApartments.map((apt) => (
                                <tr key={apt.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{apt.id}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{apt.number}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{apt.area}</td>
                                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                    parseFloat(apt.balance) < 0 ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {parseFloat(apt.balance).toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{apt.resident_count || 0}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {/* Pagination */}
                      {selectedOrgApartmentsTotal > 20 && (
                        <div className="bg-neutral-50 px-6 py-3 flex items-center justify-between border-t">
                          <div className="text-sm text-neutral-700">
                            Showing {((selectedOrgApartmentsPage - 1) * 20) + 1} - {Math.min(selectedOrgApartmentsPage * 20, selectedOrgApartmentsTotal)} of {selectedOrgApartmentsTotal}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedOrgApartmentsPage(p => Math.max(1, p - 1))}
                              disabled={selectedOrgApartmentsPage === 1}
                              className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => setSelectedOrgApartmentsPage(p => p + 1)}
                              disabled={selectedOrgApartmentsPage * 20 >= selectedOrgApartmentsTotal}
                              className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-neutral-500">
                <div className="text-center">
                  <p className="text-lg mb-2">Select an organization</p>
                  <p className="text-sm">Choose an organization from the list to view its users and apartments</p>
                </div>
              </div>
            )}
        </div>
      </div>

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
