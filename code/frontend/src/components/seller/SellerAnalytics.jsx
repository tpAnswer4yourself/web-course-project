import { useState, useEffect, useMemo } from 'react';
import { Download, Coins, ShoppingBag, Package, BarChart3 } from 'lucide-react';
import api from '../../api/axios';

const COLORS = [
  '#3b82f6', // синий
  '#f59e0b', // оранжевый
  '#ec4899', // розовый
  '#10b981', // зеленый
  '#8b5cf6', // фиолетовый
  '#06b6d4', // голубой
];

function SellerAnalytics() {
  const [stats, setStats] = useState(null); // стейт статистики продавца
  const [exporting, setExporting] = useState(false); // стейт для экспорта отчета
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError('Не удалось загрузить данные.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // логика динамического расчета круговой диаграммы 
  const donutChartStyle = useMemo(() => {
    if (!stats || stats.sales_by_category.length === 0 || stats.total_revenue === 0) return {};

    let accumulatedPercent = 0;
    const slices = stats.sales_by_category.map((item, idx) => {
      const percent = (item.revenue / stats.total_revenue) * 100;
      const start = accumulatedPercent;
      accumulatedPercent += percent;
      const color = COLORS[idx % COLORS.length];
      return `${color} ${start}% ${accumulatedPercent}%`;
    });

    return {
      background: `conic-gradient(${slices.join(', ')})`
    };
  }, [stats]);

  // обработка клика по экспорту csv
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await api.get('/analytics/export-csv', { responseType: 'blob' });
      const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', 'sales_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Ошибка при экспорте CSV:", err);
      alert("Не удалось скачать отчет.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-50 text-red-700 border border-red-200 rounded-2xl font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Аналитика продаж</h1>
          <p className="text-slate-500 text-sm">Сводный дашборд коммерческой деятельности магазина</p>
        </div>
        
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer shrink-0"
        >
          <Download size={16} />
          {exporting ? 'Выгрузка...' : 'Экспорт отчета (CSV)'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Общая выручка</span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {stats.total_revenue.toLocaleString('ru-RU')} ₽
            </p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-xl border border-emerald-100">
            <Coins size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Всего заказов</span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {stats.total_orders} шт
            </p>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3.5 rounded-xl border border-blue-100">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Продано единиц</span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {stats.total_items_sold} шт
            </p>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-3.5 rounded-xl border border-indigo-100">
            <Package size={24} />
          </div>
        </div>

      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <BarChart3 className="text-blue-600" size={20} />
          <h2 className="text-lg font-bold text-slate-900">Продажи по категориям техники</h2>
        </div>

        {stats.sales_by_category.length === 0 ? (
          <p className="text-slate-400 text-sm py-4">Данные для построения графика отсутствуют.</p>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-around gap-8 py-4">
            <div 
              className="w-44 h-44 rounded-full flex items-center justify-center relative shadow-inner shrink-0"
              style={donutChartStyle}
            >
              <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-md">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Всего продано</span>
                <span className="text-lg font-black text-slate-800 font-mono mt-0.5">{stats.total_items_sold} шт</span>
              </div>
            </div>

            <div className="flex-1 w-full max-w-md space-y-4">
              {stats.sales_by_category.map((item, idx) => {
                const percent = stats.total_revenue > 0 
                  ? (item.revenue / stats.total_revenue) * 100 
                  : 0;
                
                const color = COLORS[idx % COLORS.length];

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                        <span className="font-semibold text-slate-800 capitalize">{item.category}</span>
                      </div>
                      <span className="text-slate-500 font-medium">
                        <strong className="text-slate-900 font-mono">{item.revenue.toLocaleString('ru-RU')} ₽</strong> ({percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerAnalytics;