import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';

const RegisterOSBBPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: EDRPOU verification
  const [edrpou, setEdrpou] = useState('');
  const [osbbData, setOsbbData] = useState(null);

  // Step 2: Head identity verification
  const [headData, setHeadData] = useState({
    rnokpp: '',
    full_name: ''
  });
  const [verificationData, setVerificationData] = useState(null);

  // Step 3: Final submission
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirm_password: ''
  });
  const [pdfFile, setPdfFile] = useState(null);

  // Step 1: Verify EDRPOU
  const handleVerifyEDRPOU = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/register/verify-edrpou', { edrpou });
      setOsbbData(response.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка перевірки EDRPOU');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Head identity
  const handleVerifyHead = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/register/verify-head', {
        edrpou,
        head_rnokpp: headData.rnokpp,
        head_full_name: headData.full_name
      });
      setVerificationData(response.data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка перевірки особи Голови ОСББ');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Submit registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirm_password) {
      setError('Паролі не співпадають');
      return;
    }

    if (formData.password.length < 8) {
      setError('Пароль має бути мінімум 8 символів');
      return;
    }

    if (!pdfFile) {
      setError('Необхідно завантажити протокол призначення (PDF)');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('edrpou', edrpou);
      formDataToSend.append('head_rnokpp', headData.rnokpp);
      formDataToSend.append('head_full_name', headData.full_name);
      formDataToSend.append('head_email', formData.email);
      formDataToSend.append('head_phone', formData.phone);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('protocol_pdf', pdfFile);

      const response = await api.post('/register/submit', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(response.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка подачі заявки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link to="/login" className="text-gray-400 hover:text-gray-600">
            ← Назад
          </Link>
          <Logo type="acronym" className="h-10" />
          <h1 className="text-lg font-bold text-gray-900 ml-2">Реєстрація Голови ОСББ</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step >= s
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {s}
                  </div>
                  <div className="mt-2 text-xs text-center text-gray-600">
                    {s === 1 && 'Перевірка EDRPOU'}
                    {s === 2 && 'Перевірка особи'}
                    {s === 3 && 'Подача заявки'}
                  </div>
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > s ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
              <p className="text-sm mt-2">Перенаправлення на сторінку входу...</p>
            </div>
          )}

          {/* Step 1: EDRPOU Verification */}
          {step === 1 && (
            <form onSubmit={handleVerifyEDRPOU} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Крок 1: Перевірка EDRPOU
                </h2>
                <p className="text-gray-600 mb-6">
                  Введіть 8-значний код ЄДРПОУ вашого ОСББ для перевірки в Єдиному державному реєстрі
                </p>
              </div>

              <div>
                <label htmlFor="edrpou" className="block text-sm font-medium text-gray-700 mb-2">
                  Код ЄДРПОУ *
                </label>
                <input
                  type="text"
                  id="edrpou"
                  required
                  maxLength={8}
                  pattern="[0-9]{8}"
                  value={edrpou}
                  onChange={(e) => setEdrpou(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="12345678"
                />
                <p className="mt-1 text-xs text-gray-500">Рівно 8 цифр</p>
              </div>

              <button
                type="submit"
                disabled={loading || edrpou.length !== 8}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Перевірка...' : 'Перевірити EDRPOU'}
              </button>
            </form>
          )}

          {/* Step 2: Head Identity Verification */}
          {step === 2 && osbbData && (
            <div>
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Знайдено ОСББ:</h3>
                <p className="text-blue-800 font-medium">{osbbData.full_name}</p>
                <p className="text-blue-700 text-sm mt-1">
                  {osbbData.address.city}, {osbbData.address.street}, {osbbData.address.building}
                </p>
                <p className="text-blue-700 text-sm mt-1">
                  Авторизована особа: {osbbData.authorized_person}
                </p>
              </div>

              <form onSubmit={handleVerifyHead} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Крок 2: Перевірка особи Голови ОСББ
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Введіть ваш РНОКПП та ПІБ для перевірки в Державному реєстрі речових прав
                  </p>
                </div>

                <div>
                  <label htmlFor="rnokpp" className="block text-sm font-medium text-gray-700 mb-2">
                    РНОКПП (Індивідуальний податковий номер) *
                  </label>
                  <input
                    type="text"
                    id="rnokpp"
                    required
                    maxLength={10}
                    pattern="[0-9]{10}"
                    value={headData.rnokpp}
                    onChange={(e) =>
                      setHeadData({ ...headData, rnokpp: e.target.value.replace(/\D/g, '') })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="1234567890"
                  />
                  <p className="mt-1 text-xs text-gray-500">Рівно 10 цифр</p>
                </div>

                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                    ПІБ (повністю) *
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    required
                    value={headData.full_name}
                    onChange={(e) =>
                      setHeadData({ ...headData, full_name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Петренко Іван Олександрович"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Має співпадати з авторизованою особою в ЄДР
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Назад
                  </button>
                  <button
                    type="submit"
                    disabled={loading || headData.rnokpp.length !== 10 || !headData.full_name}
                    className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Перевірка...' : 'Перевірити особу'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Final Submission */}
          {step === 3 && verificationData && (
            <div>
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Особу підтверджено!</h3>
                <p className="text-green-800 text-sm">
                  Знайдено {verificationData.properties?.length || 0} об'єктів нерухомості
                </p>
                {verificationData.total_voting_weight && (
                  <p className="text-green-800 text-sm">
                    Загальна площа: {verificationData.total_voting_weight.toFixed(2)} м²
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Крок 3: Створення облікового запису
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Завантажте протокол призначення та створіть обліковий запис
                  </p>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="head@osbb.example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    pattern="\+380\d{9}"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+380501234567"
                  />
                  <p className="mt-1 text-xs text-gray-500">Формат: +380XXXXXXXXX</p>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Пароль *
                  </label>
                  <input
                    type="password"
                    id="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">Мінімум 8 символів</p>
                </div>

                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                    Підтвердити пароль *
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

                <div>
                  <label htmlFor="protocol_pdf" className="block text-sm font-medium text-gray-700 mb-2">
                    Протокол призначення (PDF) *
                  </label>
                  <input
                    type="file"
                    id="protocol_pdf"
                    required
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files[0])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Максимальний розмір: 5MB. Тільки PDF файли.
                  </p>
                  {pdfFile && (
                    <p className="mt-2 text-sm text-green-600">✓ Файл вибрано: {pdfFile.name}</p>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Назад
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Подача заявки...' : 'Подати заявку'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RegisterOSBBPage;


