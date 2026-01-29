import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import heroImage from '../assets/hero_main_image.jpg';
import fullnameLogoClean from '../assets/fullname_logo_clean.png';
import { Mail, Phone, Lock } from 'lucide-react';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Regular users login with phone (or email)
    // Backend will detect phone pattern and route accordingly
    const result = await login(phone, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Hero Area */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-primary-900/70"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <img 
            src={fullnameLogoClean} 
            alt="Добрий сусід" 
            className="h-32 mb-8"
            style={{
              filter: 'drop-shadow(6px 4px 12px rgba(255, 255, 255, 0.8)) drop-shadow(-6px 4px 20px rgba(255, 255, 255, 0.6)) drop-shadow(0 4px 30px rgba(255, 255, 255, 0.4)) drop-shadow(10px 0 50px rgba(255, 255, 255, 0.18)) drop-shadow(-10px 0 50px rgba(255, 255, 255, 0.18))'
            }}
          />
          <h1 className="text-4xl font-bold mb-4 text-center text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]">Добрий сусід</h1>
          <p className="text-xl text-center max-w-md text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]">Кабінет мешканця ОСББ</p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg space-y-8">
          <div className="flex flex-col items-center lg:hidden mb-8">
            <img 
              src={fullnameLogoClean} 
              alt="Добрий сусід" 
              className="h-24 mb-6"
              style={{
                filter: 'drop-shadow(0 0 6px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 12px rgba(0, 0, 0, 0.2))'
              }}
            />
            <h2 className="text-2xl font-extrabold text-gray-900 font-heading">
              Вхід в систему
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Кабінет мешканця ОСББ
            </p>
          </div>
          
          <div className="hidden lg:block mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900 font-heading text-center">
              Вхід в систему
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Кабінет мешканця ОСББ
            </p>
          </div>
            
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 p-4 border-l-4 border-red-400 shadow-sm">
                <div className="text-sm text-red-700 font-medium">{error}</div>
              </div>
            )}
            <div className="space-y-5">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-500 mb-2">Телефон або Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {phone.includes('@') ? (
                      <Mail className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Phone className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    required
                    className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 sm:text-sm bg-white shadow-sm hover:border-gray-400"
                    placeholder="+380XXXXXXXXX або email@example.com"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-500 mb-2">Пароль</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 sm:text-sm bg-white shadow-sm hover:border-gray-400"
                    placeholder="Ваш пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Увійти
              </button>
            </div>
          </form>
            
          <div className="text-center space-y-2">
            <Link to="/activate" className="block text-sm text-primary-600 hover:text-primary-500 font-medium">
              Активувати акаунт за кодом
            </Link>
            <Link to="/register-osbb" className="block text-sm text-primary-600 hover:text-primary-500 font-medium">
              Реєстрація Голови ОСББ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
