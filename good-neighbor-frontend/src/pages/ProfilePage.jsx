import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { User, Phone, Shield, Home, Square, Mail, Edit2, Save, X } from 'lucide-react';

const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('phone'); // 'phone' or 'password'
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
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
      setFormData(prev => ({
        ...prev,
        full_name: response.data.full_name || '',
        phone: response.data.phone || '',
        email: response.data.email || ''
      }));
    } catch (err) {
      setError('Помилка завантаження профілю');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const updateData = {};
      if (formData.full_name !== profile?.full_name) {
        updateData.full_name = formData.full_name;
      }
      if (formData.phone !== profile?.phone) {
        updateData.phone = formData.phone;
      }
      if (formData.email !== profile?.email && formData.email) {
        updateData.email = formData.email;
      }

      if (Object.keys(updateData).length === 0) {
        setError('Немає змін для збереження');
        setSaving(false);
        return;
      }

      const response = await api.patch('/profile', updateData);
      setSuccess('Профіль успішно оновлено');
      setProfile(prev => ({ ...prev, ...response.data.user }));
      setIsEditing(false);
      
      // Update user in context/localStorage
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...savedUser, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update AuthContext if updateUser function exists
      if (updateUser) {
        updateUser(updatedUser);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Помилка оновлення профілю');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      email: profile?.email || '',
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setError('');
    setSuccess('');
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Особиста інформація</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Редагувати
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                  Скасувати
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ПІБ */}
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary-100 flex-shrink-0">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="full_name" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      ПІБ *
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base font-semibold text-gray-900"
                    />
                  </div>
                </div>

                {/* Телефон */}
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary-100 flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="phone" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Телефон *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base font-semibold text-gray-900"
                      placeholder="+380501234567"
                      pattern="\+380\d{9}"
                    />
                    <p className="mt-1 text-xs text-gray-500">Формат: +380XXXXXXXXX</p>
                  </div>
                </div>

                {/* Email (if exists) */}
                {profile?.email !== undefined && (
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary-100 flex-shrink-0">
                      <Mail className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="email" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base font-semibold text-gray-900"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Збереження...' : 'Зберегти зміни'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ПІБ */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary-100 flex-shrink-0">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    ПІБ
                  </label>
                  <p className="text-base font-semibold text-gray-900">{profile?.full_name}</p>
                </div>
              </div>

              {/* Телефон */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary-100 flex-shrink-0">
                  <Phone className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Телефон
                  </label>
                  <p className="text-base font-semibold text-gray-900">{profile?.phone}</p>
                </div>
              </div>

              {/* Email (if exists) */}
              {profile?.email !== undefined && (
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary-100 flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Email
                    </label>
                    <p className="text-base font-semibold text-gray-900">{profile?.email || 'Не вказано'}</p>
                  </div>
                </div>
              )}

              {/* Роль */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary-100 flex-shrink-0">
                  <Shield className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Роль
                  </label>
                  <p className="text-base font-semibold text-gray-900">
                    {profile?.role === 'admin' ? 'Адміністратор' : profile?.role === 'owner' ? 'Власник' : 'Орендар'}
                  </p>
                </div>
              </div>

              {/* Квартира */}
              {profile?.apartment && (
                <>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary-100 flex-shrink-0">
                      <Home className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Квартира
                      </label>
                      <p className="text-base font-semibold text-gray-900">№{profile.apartment.number}</p>
                    </div>
                  </div>

                  {/* Площа */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary-100 flex-shrink-0">
                      <Square className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Площа
                      </label>
                      <p className="text-base font-semibold text-gray-900">{profile.apartment.area} м²</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
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


