import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/internal/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Завантаження...</div>
      </div>
    );
  }

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
              className="border-b-2 border-primary-500 py-4 px-1 text-sm font-medium text-primary-500"
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
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-neutral-700 hover:text-primary-500 hover:border-primary-500"
            >
              Управління БД
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6 text-neutral-900">Статистика системи</h2>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* OSBB Stats */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">ОСББ</h3>
              <div className="text-3xl font-bold text-primary-500">{stats.osbb.total}</div>
              <div className="text-sm text-neutral-600 mt-2">
                Активних: {stats.osbb.active} | Очікують: {stats.osbb.pending}
              </div>
            </div>

            {/* Users Stats */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">Користувачі</h3>
              <div className="text-3xl font-bold text-primary-500">
                {Object.values(stats.users).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-sm text-neutral-600 mt-2">
                Адміністраторів: {stats.users.admin || 0} | Власників: {stats.users.owner || 0}
              </div>
            </div>

            {/* Votings Stats */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">Голосування</h3>
              <div className="text-3xl font-bold text-primary-500">{stats.votings.total}</div>
              <div className="text-sm text-neutral-600 mt-2">
                Активних: {stats.votings.active} | Завершених: {stats.votings.finished}
              </div>
            </div>

            {/* Bills Stats */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">Рахунки</h3>
              <div className="text-3xl font-bold text-primary-500">{stats.bills.total}</div>
              <div className="text-sm text-neutral-600 mt-2">
                Сума: {stats.bills.total_amount.toFixed(2)} грн | Місяців: {stats.bills.months_count}
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {stats && stats.recent_activity && stats.recent_activity.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-neutral-900">Остання активність (7 днів)</h3>
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
      </main>
    </div>
  );
}

