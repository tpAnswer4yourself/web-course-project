import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, User, Phone } from 'lucide-react';
import api from '../api/axios';

function Login() {
  const navigate = useNavigate();
  const [isLoginTab, setIsLoginTab] = useState(true); // стейт вход/регистрация
  const [error, setError] = useState(''); // стейт для ошибок
  const [successMessage, setSuccessMessage] = useState(''); // стейт успеха
  const [loading, setLoading] = useState(false); // стейт для лоадбара

  // состояния для ВХОДА
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // состояния для РЕГИСТРАЦИИ
  const [regData, setRegData] = useState({
    login: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    phone_number: '',
    role_id: 1
  });

  // универсальный обработчик событий изменения полей ввода
  const handleRegChange = (e) => {
    const { name, value } = e.target;
    setRegData(prev => ({...prev, [name]: value}));
  };

  // логика обработки входа
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('username', loginUsername);
      params.append('password', loginPassword);

      const response = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      localStorage.setItem('token', response.data.access_token);
      navigate('/');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  // логика обработки регистрации аккаунта
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const payload = { ...regData };
      if (!payload.phone_number) delete payload.phone_number;
      if (!payload.middle_name) delete payload.middle_name;

      await api.post('/auth/register', payload);
      
      setSuccessMessage('Регистрация успешна! Теперь вы можете войти.');
      setLoginUsername(regData.login);
      setIsLoginTab(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при регистрации.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full mt-36 bg-white flex flex-col justify-center py-6 sm:px-6 lg:px-8 text-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-extrabold text-slate-950 tracking-tight">
          {isLoginTab ? 'Вход в личный кабинет' : 'Регистрация покупателя'}
        </h2>
        <p className="mt-1.5 text-center text-sm text-gray-500">
          {isLoginTab ? 'Еще нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button
            onClick={() => {
              setIsLoginTab(!isLoginTab);
              setError('');
              setSuccessMessage('');
            }}
            className="font-semibold text-blue-600 hover:text-blue-500 focus:outline-none transition"
          >
            {isLoginTab ? 'Зарегистрироваться' : 'Войти в кабинет'}
          </button>
        </p>
      </div>
      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 shadow-lg border border-gray-200 rounded-2xl sm:px-8">
          {error && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-2.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm text-center font-medium">
              {successMessage}
            </div>
          )}

          {/* ФОРМА ВХОДА */}
          {isLoginTab ? (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Логин или Email</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Mail size={16} /></div>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="block w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-slate-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                    placeholder="ivan_dev"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Пароль</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Lock size={16} /></div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="block w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-slate-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:bg-blue-800"
                >
                  <LogIn size={16} />
                  {loading ? 'Вход...' : 'Войти'}
                </button>
              </div>
            </form>
          ) : (
            // ФОРМА РЕГИСТРАЦИИ
            <form className="space-y-3.5" onSubmit={handleRegisterSubmit}>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Имя *</label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={regData.first_name}
                  onChange={handleRegChange}
                  className="block w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-slate-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                  placeholder="Иван"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Фамилия *</label>
                <input
                  type="text"
                  name="last_name"
                  required
                  value={regData.last_name}
                  onChange={handleRegChange}
                  className="block w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-slate-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                  placeholder="Иванов"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Отчество (при наличии)</label>
                <input
                  type="text"
                  name="middle_name"
                  value={regData.middle_name}
                  onChange={handleRegChange}
                  className="block w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-slate-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                  placeholder="Иванович"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Логин *</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400"><User size={14} /></div>
                  <input
                    type="text"
                    name="login"
                    required
                    value={regData.login}
                    onChange={handleRegChange}
                    className="block w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-slate-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                    placeholder="qwerty123"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email *</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400"><Mail size={14} /></div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={regData.email}
                    onChange={handleRegChange}
                    className="block w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-slate-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                    placeholder="mail@test.ru"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Телефон</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400"><Phone size={14} /></div>
                  <input
                    type="text"
                    name="phone_number"
                    value={regData.phone_number}
                    onChange={handleRegChange}
                    className="block w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-slate-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                    placeholder="+7 (999) 999-99-99"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Пароль *</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400"><Lock size={14} /></div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={regData.password}
                    onChange={handleRegChange}
                    className="block w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-slate-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:bg-blue-800"
                >
                  <UserPlus size={16} />
                  {loading ? 'Создание...' : 'Зарегистрироваться'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;