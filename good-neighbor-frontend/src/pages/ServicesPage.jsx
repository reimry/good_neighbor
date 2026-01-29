import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';
import BalanceWidget from '../components/BalanceWidget';
import EmptyState from '../components/EmptyState';
import { Wrench } from 'lucide-react';

const ServicesPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/services');
      console.log('Services data:', response.data);
      setData(response.data);
      // Select the most recent month by default
      if (response.data && response.data.months && response.data.months.length > 0) {
        setSelectedMonth(response.data.months[0]);
      }
    } catch (err) {
      console.error('Failed to fetch services', err);
      console.error('Error details:', err.response?.data || err.message);
      // Set empty data structure to prevent crashes
      setData({ balance: 0, months: [] });
    } finally {
      setLoading(false);
    }
  };

  const getServiceTypeName = (type) => {
    const names = {
      'rent': 'Орендна плата',
      'water': 'Водопостачання',
      'electricity': 'Електроенергія',
      'heating': 'Опалення',
      'maintenance': 'Утримання будинку',
      'garbage': 'Вивіз сміття',
      'other': 'Інше'
    };
    return names[type] || type;
  };

  const formatMonth = (dateInput) => {
    // Handle both Date objects and date strings
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) {
      return 'Невірна дата';
    }
    const months = [
      'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
      'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Ensure data exists to prevent crashes
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-400 hover:text-gray-600">
              ← Назад
            </Link>
            <Logo type="acronym" className="h-10" />
            <h1 className="text-lg font-bold text-gray-900 ml-2">Послуги та платежі</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <EmptyState
              icon={Wrench}
              title="Немає даних про послуги та платежі"
              description="Зверніться до адміністратора для отримання детальної інформації"
              actionLabel="Зв'язатися з адміністратором"
              onAction={() => {
                window.location.href = 'mailto:admin@osbb.com';
              }}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600">
            ← Назад
          </Link>
          <Logo type="acronym" className="h-10" />
          <h1 className="text-lg font-bold text-gray-900 ml-2">Послуги та платежі</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Balance Widget */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <BalanceWidget 
            balance={Number(data?.balance || 0)} 
            lastUpdate={new Date()}
          />
        </div>

        {/* Month Selector */}
        {data?.months && data.months.length > 0 ? (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Оберіть місяць</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {data.months.map((monthData, index) => {
                  // Ensure month is a Date object
                  const monthDate = monthData.month instanceof Date 
                    ? monthData.month 
                    : new Date(monthData.month);
                  const monthKey = monthDate.toISOString().substring(0, 7);
                  const selectedMonthKey = selectedMonth?.month 
                    ? (selectedMonth.month instanceof Date 
                      ? selectedMonth.month 
                      : new Date(selectedMonth.month)).toISOString().substring(0, 7)
                    : null;
                  const isSelected = selectedMonthKey === monthKey;
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedMonth(monthData)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {formatMonth(monthDate)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Month Details */}
            {selectedMonth && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {formatMonth(selectedMonth.month instanceof Date 
                      ? selectedMonth.month 
                      : new Date(selectedMonth.month))}
                  </h2>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Загалом</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedMonth.total.toFixed(2)} грн
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedMonth.bills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {getServiceTypeName(bill.service_type)}
                        </div>
                        {bill.description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {bill.description}
                          </div>
                        )}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {parseFloat(bill.amount).toFixed(2)} грн
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <EmptyState
              icon={Wrench}
              title="Немає даних про послуги та платежі"
              description="Зверніться до адміністратора для отримання детальної інформації"
              actionLabel="Зв'язатися з адміністратором"
              onAction={() => {
                // You can add navigation to contact admin or open a modal
                window.location.href = 'mailto:admin@osbb.com';
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default ServicesPage;


