import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function InternalDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/internal/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      // Error handling is done by the API interceptor (redirects to login)
      // Only set error if it's not an auth error (401/403)
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        const errorMessage = err.response?.data?.error || err.message || 'Error loading statistics';
        console.error('Dashboard stats error:', err.response?.data || err);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-neutral-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-neutral-900">Ecosystem Overview</h2>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* OSBB Stats */}
          <div className="bg-neutral-100 p-6 rounded-lg border border-neutral-200" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
            <h3 className="text-sm font-medium text-neutral-600 mb-3 uppercase tracking-wide">OSBB Organizations</h3>
            <div className="text-5xl font-bold text-neutral-900 mb-2">
              {stats.osbb?.total ?? 0}
            </div>
            <div className="text-xs text-neutral-600 mt-3 space-y-1">
              <div className="flex justify-between">
                <span>Approved:</span>
                <span className="font-semibold text-neutral-800">{stats.osbb?.active ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending:</span>
                <span className="font-semibold text-neutral-800">{stats.osbb?.pending ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Users Stats */}
          <div className="bg-neutral-100 p-6 rounded-lg border border-neutral-200" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
            <h3 className="text-sm font-medium text-neutral-600 mb-3 uppercase tracking-wide">Users</h3>
            <div className="text-5xl font-bold text-neutral-900 mb-2">
              {stats.users ? Object.values(stats.users).reduce((a, b) => (a || 0) + (b || 0), 0) : 0}
            </div>
            <div className="text-xs text-neutral-600 mt-3 space-y-1">
              <div className="flex justify-between">
                <span>Admins:</span>
                <span className="font-semibold text-neutral-800">{stats.users?.admin || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Owners:</span>
                <span className="font-semibold text-neutral-800">{stats.users?.owner || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Tenants:</span>
                <span className="font-semibold text-neutral-800">{stats.users?.tenant || 0}</span>
              </div>
            </div>
          </div>

          {/* Votings Stats */}
          <div className="bg-neutral-100 p-6 rounded-lg border border-neutral-200" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
            <h3 className="text-sm font-medium text-neutral-600 mb-3 uppercase tracking-wide">Votings</h3>
            <div className="text-5xl font-bold text-neutral-900 mb-2">
              {stats.votings?.total ?? 0}
            </div>
            <div className="text-xs text-neutral-600 mt-3 space-y-1">
              <div className="flex justify-between">
                <span>Active:</span>
                <span className="font-semibold text-neutral-800">{stats.votings?.active ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Finished:</span>
                <span className="font-semibold text-neutral-800">{stats.votings?.finished ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Bills Stats */}
          <div className="bg-neutral-100 p-6 rounded-lg border border-neutral-200" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
            <h3 className="text-sm font-medium text-neutral-600 mb-3 uppercase tracking-wide">Bills</h3>
            <div className="text-5xl font-bold text-neutral-900 mb-2">
              {stats.bills?.total ?? 0}
            </div>
            <div className="text-xs text-neutral-600 mt-3 space-y-1">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-semibold text-neutral-800">{stats.bills?.total_amount ? stats.bills.total_amount.toFixed(2) : '0.00'} UAH</span>
              </div>
              <div className="flex justify-between">
                <span>Months:</span>
                <span className="font-semibold text-neutral-800">{stats.bills?.months_count ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats && stats.recent_activity && stats.recent_activity.length > 0 && (
        <div className="bg-neutral-100 p-6 rounded-lg border border-neutral-200" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
          <h3 className="text-lg font-semibold mb-4 text-neutral-800 uppercase tracking-wide">Recent Activity (7 days)</h3>
          <div className="space-y-2">
            {stats.recent_activity.map((activity, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-neutral-300">
                <span className="text-neutral-700 text-sm">{activity.action_type}</span>
                <span className="font-semibold text-neutral-900">{activity.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
