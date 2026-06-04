import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Minus, Plus, CreditCard, Calendar, MapPin } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axios';

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]); // стейт корзины / массив добавленных товаров
  const [address, setAddress] = useState(''); // стейт адреса доставки
  const [deliveryDate, setDeliveryDate] = useState(''); // стейт желаемой даты доставки

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // функция для получения сегодняшней даты
  // сделано для того, чтобы покупатель не смог поставить дату доставки раньше сегодняшнего дня
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayDateString();

  // подгрузка корзины из localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Ошибка парсинга корзины", e);
      }
    }
  }, []);

  // функция обновления стейта корзины
  const updateCartState = (newCart) => {
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  // обработчик изменения кол-ва у товара в корзине
  const handleQuantityChange = (index, delta) => {
    setError('');
    const newCart = [...cartItems];
    const item = newCart[index];
    
    const newQuantity = item.quantity + delta;

    if (newQuantity < 1) return;
    if (newQuantity > item.product.stock_quantity) {
      setError(`Доступно только ${item.product.stock_quantity} единиц товара!`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    item.quantity = newQuantity;
    updateCartState(newCart);
  };

  // удаление товара из корзины
  const handleRemoveItem = (index) => {
    const newCart = cartItems.filter((_, i) => i !== index);
    updateCartState(newCart);
  };

  // расчеты для формирования чека заказа
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0); // количество товаров в заказе
  const totalPrice = cartItems.reduce((acc, item) => acc + (Number(item.product.price) * item.quantity), 0); // общая сумма заказа

  // логика оформления заказа
  const handleCheckout = async () => {
    setError('');
    setSuccess('');

    if (!address.trim()) {
      setError('Пожалуйста, укажите адрес доставки.');
      return;
    }
    if (!deliveryDate) {
      setError('Пожалуйста, выберите дату получения.');
      return;
    }

    if (deliveryDate < todayStr) {
      setError('Ошибка: Дата доставки не может быть раньше сегодняшнего дня.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        delivery_address: address,
        delivery_date: deliveryDate,
        items: cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      };

      await api.post('/orders/', payload);
      
      setSuccess('Заказ успешно оформлен! Вы можете отследить его в личном кабинете.');
      updateCartState([]);
      setAddress('');
      setDeliveryDate('');
      
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Для оформления заказа необходимо авторизоваться!');
      } else {
        setError(err.response?.data?.detail || 'Произошла ошибка при оформлении заказа.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition w-fit"
        >
          <ArrowLeft size={18} />Назад к покупкам
        </button>

        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Корзина покупателя</h1>
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-4">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium">
            {success}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Ваша корзина пуста</h2>
            <p className="text-slate-500 mb-6">Перейдите в каталог, чтобы найти нужные товары.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-lg transition"
            >
              Перейти в каталог
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => {
                const imgUrl = `http://localhost:8000${item.product.image_url}`;
                const sellerName = item.product.vendor ? `${item.product.vendor.first_name} ${item.product.vendor.last_name}` : 'Неизвестный продавец';                
                const itemTotal = Number(item.product.price) * item.quantity;

                return (
                  <div key={index} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-2xl border border-slate-300 shadow-sm gap-4">
                    <div className="flex items-center gap-4 flex-1 w-full">
                      <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 p-2">
                        <img src={imgUrl} alt={item.product.title} className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="flex flex-col">
                        <h3 
                          onClick={() => navigate(`/product/${item.product.id}`)}
                          className="font-bold text-slate-900 text-sm sm:text-base hover:text-blue-600 cursor-pointer transition line-clamp-2"
                        >
                          {item.product.title}
                        </h3>
                        <span className="text-xs text-slate-500 mt-1">Продавец: {sellerName}</span>
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <div className="flex gap-2 mt-1.5">
                            {Object.entries(item.selectedOptions).map(([k, v]) => (
                              <span key={k} className="text-[14px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {k}: {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-8">
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg">
                        <button 
                          onClick={() => handleQuantityChange(index, -1)}
                          className="p-2 text-slate-500 hover:text-blue-600 transition disabled:opacity-30"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-slate-900">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => handleQuantityChange(index, 1)}
                          className="p-2 text-slate-500 hover:text-blue-600 transition disabled:opacity-30"
                          disabled={item.quantity >= item.product.stock_quantity}
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="flex flex-col text-right min-w-[100px]">
                        <span className="text-xs text-slate-400 font-medium">Всего:</span>
                        <span className="text-lg font-bold text-slate-900 font-mono">
                          {itemTotal.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>

                      <button 
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-300 hover:text-red-500 transition p-2"
                        title="Удалить из корзины"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl border border-slate-800 shadow-sm p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Итоговый чек заказа</h2>
              <div className="space-y-3 text-sm text-slate-600 mb-6 border-b border-slate-100 pb-6">
                <div className="flex justify-between">
                  <span>Товары ({totalItemsCount} шт)</span>
                  <span className="font-mono">{totalPrice.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span>Доставка</span>
                  <span>Бесплатно</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-base font-bold text-slate-900">Общая стоимость</span>
                <span className="text-2xl font-bold text-blue-600 font-mono">
                  {totalPrice.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                    <MapPin size={14}/> Адрес доставки заказа
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Укажите город, улицу, номер дома..."
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                    <Calendar size={14}/> Удобная дата получения
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-3 rounded-xl transition shadow-md shadow-blue-600/20"
              >
                <CreditCard size={18} />
                {loading ? 'Оформление...' : 'Оформить заказ'}
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Cart;