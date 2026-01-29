import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../assets/pattern.css';
import { Key, User, Phone, Lock } from 'lucide-react';
import fullnameLogoClean from '../assets/fullname_logo_clean.png';

const ActivatePage = () => {
  const [formData, setFormData] = useState({
    invitation_code: '',
    phone: '',
    full_name: '',
    password: ''
  });
  const [error, setError] = useState('');
  const { activate } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await activate(formData);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="h-screen pattern-bg flex items-center justify-center overflow-y-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="w-full max-w-lg my-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-5 sm:p-6 space-y-5">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <img src={fullnameLogoClean} alt="Добрий сусід" className="h-20 mb-4" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 text-center">
              Активація акаунту
            </h2>
            <p className="text-gray-600 text-center mt-1 text-sm">Введіть код запрошення та дані для активації</p>
          </div>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 p-3 border-l-4 border-red-400 shadow-sm">
                <div className="text-sm text-red-700 font-medium">{error}</div>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="invitation_code" className="block text-sm font-medium text-gray-500 mb-1.5">Код запрошення</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="invitation_code"
                    type="text"
                    required
                    className="appearance-none block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 sm:text-sm bg-white shadow-sm hover:border-gray-400"
                    placeholder="Код запрошення"
                    value={formData.invitation_code}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-500 mb-1.5">ПІБ</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="full_name"
                    type="text"
                    required
                    className="appearance-none block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 sm:text-sm bg-white shadow-sm hover:border-gray-400"
                    placeholder="ПІБ"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-500 mb-1.5">Телефон</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="phone"
                    type="text"
                    required
                    className="appearance-none block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 sm:text-sm bg-white shadow-sm hover:border-gray-400"
                    placeholder="+380XXXXXXXXX"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-500 mb-1.5">Пароль</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="password"
                    type="password"
                    required
                    className="appearance-none block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 sm:text-sm bg-white shadow-sm hover:border-gray-400"
                    placeholder="Придумайте пароль (мін. 6 символів)"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Активувати та увійти
              </button>
            </div>
          </form>
          
          <div className="text-center pt-2">
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-500">
              Вже маєте акаунт? Увійти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivatePage;
