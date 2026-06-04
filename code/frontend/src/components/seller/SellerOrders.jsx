import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, User, MapPin, Calendar, Mail, Phone } from 'lucide-react';
import api from '../../api/axios';

function SellerOrders() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]); // стейт сделанных заказов
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // загрузка заказов с сервера
  useEffect(() => {
    api.get('/orders/seller-items')
      .then((res) => {
        setItems(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError('Не удалось загрузить список заказов.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // логика смены статуса у позиции заказа
  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await api.patch(`/orders/items/${itemId}/status`, { status: newStatus });
      
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId ? { ...item, status: newStatus } : item
        )
      );
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Не удалось изменить статус заказа.');
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="h-96 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Заказы покупателей</h1>
        <p className="text-slate-500 text-sm">Обработка входящих заказов, сборка посылок и обновление статусов отправки</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <ClipboardList size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Новых заказов на продажу пока нет.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-4 px-6">Заказ</th>
                  <th className="py-4 px-6">Покупатель</th>
                  <th className="py-4 px-6">Адрес и дата доставки</th>
                  <th className="py-4 px-6">Количество</th>
                  <th className="py-4 px-6">Итого</th>
                  <th className="py-4 px-6">Статус заказа</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {items.map((item) => {
                  const imgUrl = `http://localhost:8000${item.product.image_url}` ;
                  const shortOrderId = item.order_id.slice(0, 8).toUpperCase();
                  const totalSum = Number(item.price_at_purchase) * item.quantity;

                  const customer = item.order?.customer;
                  const customerName = customer ? `${customer.first_name} ${customer.last_name}` : 'Загрузка...';
                  const deliveryAddress = item.order?.delivery_address || 'Не указан';
                  const deliveryDate = item.order?.delivery_date 
                    ? new Date(item.order.delivery_date).toLocaleDateString('ru-RU') 
                    : 'Не указана';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-6 flex items-center gap-4 min-w-[240px]">
                        <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex items-center justify-center shrink-0">
                          <img src={imgUrl} alt={item.product?.title || 'Товар'} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] text-slate-400 font-bold font-mono">#{shortOrderId}</span>
                          <span 
                            onClick={() => navigate(`/product/${item.product_id}`)}
                            className="font-bold text-slate-800 line-clamp-1 mt-0.5 hover:text-blue-600 transition cursor-pointer"
                          >
                            {item.product?.title || 'Загрузка...'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 min-w-[200px]">
                        <div className="flex flex-col space-y-1 text-xs">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <User size={12} className="text-slate-400" /> {customerName}
                          </span>
                          {customer && (
                            <>
                              <span className="text-slate-500 flex items-center gap-1">
                                <Mail size={12} className="text-slate-400" /> {customer.email}
                              </span>
                              {customer.phone_number && (
                                <span className="text-slate-500 flex items-center gap-1">
                                  <Phone size={12} className="text-slate-400" /> {customer.phone_number}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 min-w-[220px]">
                        <div className="flex flex-col space-y-1 text-xs text-slate-600">
                          <span className="flex items-start gap-1">
                            <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{deliveryAddress}</span>
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Calendar size={12} className="text-slate-400" /> Доставка: {deliveryDate}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-semibold text-slate-600">
                        {item.quantity} шт
                      </td>

                      <td className="py-4 px-6 font-bold font-mono text-slate-900">
                        {totalSum.toLocaleString('ru-RU')} ₽
                      </td>

                      <td className="py-4 px-6">
                        <div className="relative w-40">
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className={`w-full text-[11px] font-bold rounded-lg border px-2 py-2 focus:outline-none focus:ring-1 cursor-pointer transition uppercase tracking-wider`}
                          >
                            <option value="В обработке">В обработке</option>
                            <option value="В пути">В пути</option>
                            <option value="Доставлен">Доставлен</option>
                            <option value="Отменен">Отменен</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerOrders;