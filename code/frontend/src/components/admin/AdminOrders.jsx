import { useState, useEffect } from 'react';
import { ClipboardList, User, MapPin, Calendar, Mail, Phone } from 'lucide-react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadAllOrders = () => {
    setLoading(true);
    api.get('/orders/')
      .then((res) => {
        const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setOrders(sorted);
      })
      .catch((err) => {
        console.error(err);
        setError('Не удалось загрузить список всех заказов.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAllOrders();
  }, []);

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await api.patch(`/orders/items/${itemId}/status`, { status: newStatus });
      setOrders(prevOrders => 
        prevOrders.map(order => ({
          ...order,
          items: order.items.map(item => 
            item.id === itemId ? { ...item, status: newStatus } : item
          )
        }))
      );
    } catch (err) {
      console.error(err);
      alert('Не удалось изменить статус доставки.');
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="h-96 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Глобальный мониторинг заказов</h1>
        <p className="text-slate-500 text-sm">Просмотр всех финансовых транзакций платформы и разрешение споров по доставке</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <ClipboardList size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">В системе еще не сделано ни одного заказа.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const shortOrderId = order.id.slice(0, 8).toUpperCase();
            const orderDate = new Date(order.created_at).toLocaleDateString('ru-RU');
            const deliveryDate = new Date(order.delivery_date).toLocaleDateString('ru-RU');
            const customerName = order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'Покупатель';

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 text-sm text-slate-500">
                  <div>
                    <span className="font-semibold text-slate-800">Заказ: </span>
                    <span className="font-mono font-bold text-slate-900 uppercase">#{shortOrderId}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <span className='text-base'>Итого: {Number(order.total_price).toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div>
                    <span>Оформлен: </span>
                    <span className="font-semibold text-slate-800">{orderDate}</span>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 text-xs">
                  <div className="space-y-2 border-r border-slate-100 pr-4 last:border-r-0">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Контакты Покупателя</span>
                    <div className="space-y-1.5 text-slate-600">
                      <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                        <User size={14} className="text-slate-400" />
                        <span>{customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-400" />
                        <span>{order.customer?.email}</span>
                      </div>
                      {order.customer?.phone_number && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-slate-400" />
                          <span>{order.customer.phone_number}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Логистическая информация</span>
                    <div className="space-y-1.5 text-slate-600">
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                        <span>Адрес: <strong className="text-slate-800">{order.delivery_address}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span>Планируемая дата вручения: <strong className="text-slate-800">{deliveryDate}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-slate-50/30">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Состав заказа</span>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => {
                      const imgUrl = `http://localhost:8000${item.product.image_url}`;

                      return (
                        <div key={idx} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-200 transition">
                          <div className="flex items-center gap-3 min-w-0 flex-1 w-full sm:w-auto">
                            <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg p-1 flex items-center justify-center shrink-0">
                              <img src={imgUrl} alt={item.product?.title || 'Товар'} className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="min-w-0">
                              <h4 
                                onClick={() => navigate(`/product/${item.product_id}`)}
                                className="font-bold text-slate-800 text-xs sm:text-sm truncate hover:text-blue-600 transition cursor-pointer"
                              >
                                {item.product?.title || `Товар ID: ${item.product_id.slice(0, 8).toUpperCase()}`}
                              </h4>
                              <span className="text-[11px] text-slate-400 font-semibold">
                                {item.quantity} шт • {Number(item.price_at_purchase).toLocaleString('ru-RU')} ₽/ед
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 w-full sm:w-auto">
                            <div className="relative w-full sm:w-40">
                              <select
                                value={item.status}
                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                className={`w-full text-[10px] font-bold rounded-lg border px-2 py-1.5 focus:outline-none focus:ring-1 cursor-pointer transition uppercase tracking-wider}`}
                              >
                                <option value="В обработке">В обработке</option>
                                <option value="В пути">В пути</option>
                                <option value="Доставлен">Доставлен</option>
                                <option value="Отменен">Отменен</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default AdminOrders;