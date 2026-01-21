import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const adminCards = [
    {
      title: 'Створити новину',
      description: 'Опублікувати оголошення для жителів',
      link: '/admin/news/create',
      icon: '📢',
      color: 'bg-blue-500'
    },
    {
      title: 'Створити голосування',
      description: 'Запустити нове голосування',
      link: '/admin/votings/create',
      icon: '🗳️',
      color: 'bg-green-500'
    },
    {
      title: 'Управління квартирами',
      description: 'Перегляд квартир та генерація кодів запрошення',
      link: '/admin/apartments',
      icon: '🏠',
      color: 'bg-purple-500'
    },
    {
      title: 'Заявки на реєстрацію',
      description: 'Розгляд заявок на реєстрацію ОСББ',
      link: '/admin/registrations',
      icon: '📋',
      color: 'bg-indigo-500'
    },
    {
      title: 'Перегляд новин',
      description: 'Всі новини будинку',
      link: '/news',
      icon: '📰',
      color: 'bg-orange-500',
      state: { from: '/admin' }
    },
    {
      title: 'Перегляд голосувань',
      description: 'Всі голосування',
      link: '/votings',
      icon: '📊',
      color: 'bg-teal-500',
      state: { from: '/admin' }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Logo type="acronym" className="h-12" />
            <nav className="hidden md:flex gap-4">
              <Link to="/news" className="text-gray-600 hover:text-primary-600 font-medium">Новини</Link>
              <Link to="/votings" className="text-gray-600 hover:text-primary-600 font-medium">Голосування</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 font-medium hidden sm:block">
              Адміністратор
            </span>
            <button 
              onClick={logout}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Вийти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Панель адміністратора
          </h1>
          <p className="text-gray-600">
            Вітаємо, {user?.full_name}! Керуйте системою ОСББ
          </p>
        </div>

        {/* Admin Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards.map((card, index) => (
            <Link
              key={index}
              to={card.link}
              state={card.state}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className={`${card.color} text-white text-2xl p-3 rounded-lg`}>
                  {card.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {card.description}
                  </p>
                </div>
                <div className="text-gray-400 group-hover:text-primary-600 transition-colors">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

