import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function SuperadminsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [superadmins, setSuperadmins] = useState([]);
  const [superadminsTotal, setSuperadminsTotal] = useState(0);
  const [superadminsPage, setSuperadminsPage] = useState(1);
  const [superadminsFilters, setSuperadminsFilters] = useState({ search: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchSuperadmins();
  }, [superadminsPage, superadminsFilters]);

  const fetchSuperadmins = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: String((superadminsPage - 1) * 20),
        superadmins_only: 'true',
        ...(superadminsFilters.search && { search: superadminsFilters.search })
      });
      const response = await api.get(`/internal/db/users?${params}`);
      setSuperadmins(response.data.users);
      setSuperadminsTotal(response.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading superadmins');
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
      fetchSuperadmins();
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
      fetchSuperadmins();
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

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-neutral-900">Superadmins Management</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-purple-800">
          <strong>⚠️ Internal Use Only:</strong> This page shows only superadmin users. These users have global access and are not associated with any specific OSBB organization.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Search</label>
          <input
            type="text"
            value={superadminsFilters.search}
            onChange={(e) => {
              setSuperadminsFilters({ ...superadminsFilters, search: e.target.value });
              setSuperadminsPage(1);
            }}
            placeholder="Name, login_id, email..."
            className="w-full px-3 py-2 border border-neutral-300 rounded-md"
          />
        </div>
      </div>

      {/* Superadmins Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-purple-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Login ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Password</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : superadmins.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-neutral-500">No superadmins found</td>
                </tr>
              ) : (
                superadmins.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{user.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">{user.login_id || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{user.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{user.email || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      {(user.password_hash && user.password_hash.trim() !== '') || (user.passwordHash && user.passwordHash.trim() !== '') ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-green-600 font-medium">✓ Set</span>
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
            Showing {((superadminsPage - 1) * 20) + 1} - {Math.min(superadminsPage * 20, superadminsTotal)} of {superadminsTotal}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSuperadminsPage(p => Math.max(1, p - 1))}
              disabled={superadminsPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setSuperadminsPage(p => p + 1)}
              disabled={superadminsPage * 20 >= superadminsTotal}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {showUserModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Superadmin</h3>
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
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Login ID</label>
                  <input
                    type="text"
                    value={editingUser.login_id || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, login_id: e.target.value })}
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
    </div>
  );
}
