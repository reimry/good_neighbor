import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInternalAuth } from '../../contexts/InternalAuthContext';

export default function InternalLoginPage() {
  const [login_id, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useInternalAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(login_id, password);
    
    if (result.success) {
      navigate('/internal/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-primary-500">
          Good Neighbor
        </h1>
        <h2 className="text-xl font-semibold text-center mb-6 text-neutral-900">
          Internal Management System
        </h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login_id" className="block text-sm font-medium text-neutral-900 mb-1">
              Login ID
            </label>
            <input
              id="login_id"
              type="text"
              value={login_id}
              onChange={(e) => setLoginId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Your login ID"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-900 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <a href="/" className="text-sm text-primary-500 hover:text-primary-600">
            ← Return to main application
          </a>
        </div>
      </div>
    </div>
  );
}
