import React, { useEffect, useState } from 'react';
import api from '../services/api';
import BalanceWidget from '../components/BalanceWidget';
import NewsCard from '../components/NewsCard';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard');
        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
      );
  }

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
                    <Link to="/services" className="text-gray-600 hover:text-primary-600 font-medium">Послуги</Link>
                </nav>
            </div>
            <div className="flex items-center gap-4">
                {user?.role === 'admin' ? (
                    <span className="text-sm text-gray-700 font-medium hidden sm:block">
                        Адміністратор
                    </span>
                ) : (
                    <span className="text-sm text-gray-700 font-medium hidden sm:block">
                        Кв. {data?.apartment?.number || '-'}
                    </span>
                )}
                <Link 
                    to="/profile"
                    className="text-sm text-gray-600 hover:text-primary-600 font-medium"
                >
                    Профіль
                </Link>
                {user?.role === 'admin' && (
                    <Link 
                        to="/admin"
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Адмін-панель
                    </Link>
                )}
                <button 
                    onClick={logout}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                >
                    Вийти
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Section */}
        <div>
            <h1 className="text-2xl font-bold text-gray-900">
                Вітаємо, {user?.full_name?.split(' ')[0]}!
            </h1>
            <p className="text-gray-500 text-sm">
                {user?.role === 'admin' 
                    ? 'Панель адміністратора ОСББ' 
                    : 'Огляд вашої квартири та новини будинку'}
            </p>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Balance & Info */}
            {user?.role !== 'admin' && data?.apartment && (
                <div className="space-y-6">
                    <BalanceWidget 
                        balance={Number(data?.apartment?.balance || 0)} 
                        lastUpdate={new Date()} // In real app, this comes from backend
                    />
                    
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-4">
                             Ваша квартира
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Номер</span>
                                <span className="font-semibold text-gray-900">{data?.apartment?.number || '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Площа</span>
                                <span className="font-semibold text-gray-900">{data?.apartment?.area ? `${data.apartment.area} м²` : '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Right Column: News Feed */}
            <div className={`${user?.role === 'admin' ? 'md:col-span-3' : 'md:col-span-2'} space-y-4`}>
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Останні новини</h2>
                    <Link to="/news" className="text-primary-600 text-sm font-medium hover:text-primary-700">
                        Всі новини →
                    </Link>
                </div>
                
                {data?.latest_news?.length > 0 ? (
                    <div className="space-y-4">
                        {data.latest_news.map(news => (
                            <NewsCard 
                                key={news.id} 
                                news={news} 
                                onDelete={() => {
                                    // Refresh news list
                                    const fetchData = async () => {
                                        try {
                                            const response = await api.get('/dashboard');
                                            setData(response.data);
                                        } catch (err) {
                                            console.error('Failed to fetch dashboard', err);
                                        }
                                    };
                                    fetchData();
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg p-8 text-center border-dashed border-2 border-gray-200">
                        <p className="text-gray-500">Новин поки немає</p>
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
