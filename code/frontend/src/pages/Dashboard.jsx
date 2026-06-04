import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, LogOut, Package, MapPin, Calendar, ClipboardList, LayoutDashboard } from 'lucide-react';

// общие элементы витрины
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axios';

// дашбоард продавца
import SellerSidebar from '../components/seller/SellerSidebar';
import SellerAnalytics from '../components/seller/SellerAnalytics';
import SellerProducts from '../components/seller/SellerProducts';
import SellerOrders from '../components/seller/SellerOrders';

// дашбоард админа
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminUsers from '../components/admin/AdminUsers';
import AdminCategories from '../components/admin/AdminCategories';
import AdminProducts from '../components/admin/AdminProducts';
import AdminOrders from '../components/admin/AdminOrders';

function Dashboard() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null); // стейт пользователя
  const [orders, setOrders] = useState([]); // стейт сделанных заказов
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewMode, setViewMode] = useState('cabinet'); // переключатель между ЛК и панелью управления

  // стейты для сайдбара, для продавцов и админов
  const [sellerTab, setSellerTab] = useState('analytics'); // для продавцов по умолч отображается компонент с аналитикой
  const [adminTab, setAdminTab] = useState('users'); // а для админа - компонент со всеми пользователями системы

  const token = localStorage.getItem('token');

  // подгрузка информации о пользователе и его заказах
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data);
        return api.get('/orders/my-orders');
      })
      .then((res) => {
        if (res) {
          const sortedOrders = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setOrders(sortedOrders);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Не удалось загрузить данные профиля.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, navigate]);

  // обработчик кнопки выхода из аккаунта
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // логика вывода панели для продавца
  if (user && user.role_id === 2 && viewMode === 'panel') {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <SellerSidebar 
          activeTab={sellerTab} 
          setActiveTab={setSellerTab} 
          user={user} 
          onLogout={handleLogout} 
        />
        <main className="flex-1 overflow-y-auto p-8">
          {sellerTab === 'analytics' && <SellerAnalytics />}
          {sellerTab === 'products' && <SellerProducts />}
          {sellerTab === 'orders' && <SellerOrders />}
        </main>
      </div>
    );
  }

  // логика вывода панели управления для администратора
  if (user && user.role_id === 3 && viewMode === 'panel') {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <AdminSidebar 
          activeTab={adminTab} 
          setActiveTab={setAdminTab} 
          user={user} 
          onLogout={handleLogout} 
        />
        <main className="flex-1 overflow-y-auto p-8">
          {adminTab === 'users' && <AdminUsers />}
          {adminTab === 'categories' && <AdminCategories />}
          {adminTab === 'products' && <AdminProducts />}
          {adminTab === 'orders' && <AdminOrders />}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Личный кабинет</h1>
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
              
              <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-slate-100">
                <div className="w-20 h-20 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold">
                  {user.first_name[0]}{user.last_name[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{user.first_name} {user.last_name}</h2>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border `}>
                  {user.role_id === 3 ? "Администратор" : user.role_id === 2 ? "Продавец" : "Покупатель"}
                </span>
              </div>

              <div className="space-y-4 text-sm text-slate-600 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <User size={16} className="text-slate-400" />
                  <span>{user.login || 'Логин'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-slate-400" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-slate-400" />
                  <span>{user.phone_number || 'Телефон не указан'}</span>
                </div>
              </div>

              <div className="space-y-3">
                {(user.role_id === 2 || user.role_id === 3) && (
                  <button 
                    onClick={() => setViewMode('panel')}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl shadow-md shadow-purple-600/10 transition cursor-pointer text-sm"
                  >
                    <LayoutDashboard size={16} /> Панель управления
                  </button>
                )}
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-semibold py-2.5 rounded-xl transition cursor-pointer text-sm"
                >
                  <LogOut size={16} />Выйти из аккаунта
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList size={22} className="text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Мои покупки</h2>
                </div>

                {orders.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                    <Package size={40} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Вы еще не совершили ни одного заказа.</p>
                    <button 
                      onClick={() => navigate('/')} 
                      className="mt-4 text-blue-600 font-semibold hover:underline"
                    >
                      Перейти к покупкам
                    </button>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 text-sm text-slate-500">
                        <div>
                          <span className="font-semibold text-slate-800">Заказ: </span>
                          <span className="font-mono font-bold text-slate-900 uppercase">#{order.id}</span>
                        </div>
                        <div>
                          <span>Дата: </span>
                          <span className="font-semibold text-slate-800">
                            {new Date(order.created_at).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <div>
                          <span>Сумма: </span>
                          <span className="font-bold text-blue-600 font-mono text-base">
                            {Number(order.total_price).toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      </div>

                      <div className="p-6 space-y-5">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-xs text-slate-500 pb-4 border-b border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-slate-400" />
                            <span>Адрес: <strong className="text-slate-700">{order.delivery_address}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-400" />
                            <span>Доставка: <strong className="text-slate-700">{new Date(order.delivery_date).toLocaleDateString('ru-RU')}</strong></span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {order.items.map((item, idx) => {
                            const itemImgUrl = `http://localhost:8000${item.product.image_url}`;
                            return (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition"
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1 border border-slate-200 shrink-0">
                                    <img 
                                      src={itemImgUrl} 
                                      alt={item.product?.title || "Товар"} 
                                      className="max-w-full max-h-full object-contain" 
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-slate-800 text-sm truncate">
                                      {item.product?.title || 'Загрузка названия...'}
                                    </h4>
                                    <span className="text-xs text-slate-500 font-medium">
                                      {item.quantity} шт. • {Number(item.price_at_purchase).toLocaleString('ru-RU')} ₽
                                    </span>
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider`}>
                                    {item.status}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Dashboard;