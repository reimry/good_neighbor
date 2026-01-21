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
      setError(err.response?.data?.error || 'Помилка завантаження статистики');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-neutral-600">Завантаження...</div>
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
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">OSBB Organizations</h3>
            <div className="text-3xl font-bold text-primary-500">{stats.osbb.total}</div>
            <div className="text-sm text-neutral-600 mt-2">
              Active: {stats.osbb.active} | Pending: {stats.osbb.pending}
            </div>
          </div>

          {/* Users Stats */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Users</h3>
            <div className="text-3xl font-bold text-primary-500">
              {Object.values(stats.users).reduce((a, b) => a + b, 0)}
            </div>
            <div className="text-sm text-neutral-600 mt-2">
              Admins: {stats.users.admin || 0} | Owners: {stats.users.owner || 0}
            </div>
          </div>

          {/* Votings Stats */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Votings</h3>
            <div className="text-3xl font-bold text-primary-500">{stats.votings.total}</div>
            <div className="text-sm text-neutral-600 mt-2">
              Active: {stats.votings.active} | Finished: {stats.votings.finished}
            </div>
          </div>

          {/* Bills Stats */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Bills</h3>
            <div className="text-3xl font-bold text-primary-500">{stats.bills.total}</div>
            <div className="text-sm text-neutral-600 mt-2">
              Total: {stats.bills.total_amount.toFixed(2)} UAH | Months: {stats.bills.months_count}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats && stats.recent_activity && stats.recent_activity.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-neutral-900">Recent Activity (7 days)</h3>
          <div className="space-y-2">
            {stats.recent_activity.map((activity, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-neutral-200">
                <span className="text-neutral-700">{activity.action_type}</span>
                <span className="font-semibold text-primary-500">{activity.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
