import { Link, useLocation } from 'react-router-dom';
import { useInternalAuth } from '../contexts/InternalAuthContext';

export default function InternalLayout({ children }) {
  const { user, logout } = useInternalAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary-500">Internal Management</h1>
              <p className="text-sm text-neutral-600">Good Neighbor Ecosystem Administration</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-neutral-700">Super Admin: {user?.full_name || 'Unknown'}</span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
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
              to="/internal/dashboard"
              className={`py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                isActive('/internal/dashboard')
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-700 hover:text-primary-500 hover:border-primary-500'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/internal/database"
              className={`py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                isActive('/internal/database')
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-700 hover:text-primary-500 hover:border-primary-500'
              }`}
            >
              Database Management
            </Link>
            <Link
              to="/internal/registrations"
              className={`py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                isActive('/internal/registrations')
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-700 hover:text-primary-500 hover:border-primary-500'
              }`}
            >
              Registrations
            </Link>
            <Link
              to="/internal/audit-logs"
              className={`py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                isActive('/internal/audit-logs')
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-700 hover:text-primary-500 hover:border-primary-500'
              }`}
            >
              Audit Logs
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
