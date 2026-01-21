import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('phone'); // 'phone' or 'password'
  const [formData, setFormData] = useState({
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      setProfile(response.data);
      setFormData(prev => ({ ...prev, phone: response.data.phone }));
    } catch (err) {
      setError('Помилка завантаження профілю');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await api.patch('/profile/phone', { phone: formData.phone });
      setSuccess('Номер телефону успішно оновлено');
      setProfile(prev => ({ ...prev, phone: formData.phone }));
      // Update user in context/localStorage
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...savedUser, phone: formData.phone }));
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка оновлення телефону');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.new_password !== formData.confirm_password) {
      setError('Нові паролі не співпадають');
      return;
    }

    if (formData.new_password.length < 6) {
      setError('Новий пароль має бути мінімум 6 символів');
      return;
    }

    setSaving(true);

    try {
      await api.patch('/profile/password', {
        current_password: formData.current_password,
        new_password: formData.new_password
      });
      setSuccess('Пароль успішно змінено');
      setFormData({
        phone: profile?.phone || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка зміни паролю');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600">
            ← Назад
          </Link>
          <Logo type="acronym" className="h-10" />
          <h1 className="text-lg font-bold text-gray-900 ml-2">Профіль</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Profile Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Особиста інформація</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">ПІБ</span>
              <span className="font-medium text-gray-900">{profile?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Телефон</span>
              <span className="font-medium text-gray-900">{profile?.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Роль</span>
              <span className="font-medium text-gray-900">
                {profile?.role === 'admin' ? 'Адміністратор' : profile?.role === 'owner' ? 'Власник' : 'Орендар'}
              </span>
            </div>
            {profile?.apartment && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Квартира</span>
                  <span className="font-medium text-gray-900">№{profile.apartment.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Площа</span>
                  <span className="font-medium text-gray-900">{profile.apartment.area} м²</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => {
                  setActiveTab('phone');
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium text-center ${
                  activeTab === 'phone'
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Змінити телефон
              </button>
              <button
                onClick={() => {
                  setActiveTab('password');
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium text-center ${
                  activeTab === 'password'
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Змінити пароль
              </button>
            </nav>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            {activeTab === 'phone' ? (
              <form onSubmit={handlePhoneUpdate} className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Новий номер телефону
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+380501234567"
                    pattern="\+380\d{9}"
                  />
                  <p className="mt-1 text-xs text-gray-500">Формат: +380XXXXXXXXX</p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Збереження...' : 'Оновити телефон'}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
                    Поточний пароль
                  </label>
                  <input
                    type="password"
                    id="current_password"
                    required
                    value={formData.current_password}
                    onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                    Новий пароль
                  </label>
                  <input
                    type="password"
                    id="new_password"
                    required
                    minLength={6}
                    value={formData.new_password}
                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">Мінімум 6 символів</p>
                </div>
                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                    Підтвердити новий пароль
                  </label>
                  <input
                    type="password"
                    id="confirm_password"
                    required
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Збереження...' : 'Змінити пароль'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;


