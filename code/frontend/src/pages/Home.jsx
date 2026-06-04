import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, XCircle } from 'lucide-react';
import Header from '../components/Header';
import PromoBanner from '../components/PromoBanner';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import api from '../api/axios';

// главная страница сайта
function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]); // товары
  const [loading, setLoading] = useState(false); // стейт лоадбара

  // состояния фильтрации
  const [searchParams] = useSearchParams(); // из URL извлекаем параметры поисковые
  const categoryId = searchParams.get('category_id');  // категория текущая
  const searchQuery = searchParams.get('search'); // поиск
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [selectedAttributes, setSelectedAttributes] = useState({}); // стейт динамических фильтров характеристик

  // при переключении категории - сброс фильтров
  useEffect(() => {
    setSelectedAttributes({});
  }, [categoryId]);

  useEffect(() => {
    const params = {};
    if (categoryId) params.category_id = categoryId;
    if (searchQuery) params.search = searchQuery;
    if (searchParams.get('min_price')) params.min_price = searchParams.get('min_price');
    if (searchParams.get('max_price')) params.max_price = searchParams.get('max_price');

    api.get('/products/', { params })
      .then((response) => setProducts(response.data))
      .catch((error) => console.error("Ошибка при получении товаров:", error))
      .finally(() => setLoading(false));
      
  }, [searchParams, categoryId, searchQuery]);

  // применение фильтров цены
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    if (minPrice) params.set('min_price', minPrice);
    else params.delete('min_price');
    
    if (maxPrice) params.set('max_price', maxPrice);
    else params.delete('max_price');
    
    navigate(`/?${params.toString()}`);
  };

  // мемоизация, автоматическая подборка фильтров-селекторов
  const availableFilters = useMemo(() => {
    const filters = {};

    products.forEach((product) => {
      if (product.attributes) {
        Object.entries(product.attributes).forEach(([key, value]) => {
          if (!filters[key]) {
            filters[key] = new Set(); // если нету такой характеристики в фильтрах, добавляем
          }
          // пробегаемся по значениям, если значение - массив, то добавляем каждый элемент в SET
          if (Array.isArray(value)) {
            value.forEach(val => filters[key].add(val));
          } else if (value !== null && value !== undefined) { // если значение - строка, добавляем напрямую в SET
            filters[key].add(value);
          }
        });
      }
    });

    // преобразуем сет в обычные массивы и оставляем только те фильтры, где два и больше значения
    const result = {};
    Object.entries(filters).forEach(([key, valueSet]) => {
      if (valueSet.size > 1) {
        result[key] = Array.from(valueSet);
      }
    });

    return result;
  }, [products]);


  // логика фильтрации по фильтрам-селекторам
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // проверка каждой выбранной характеристики
      for (const [key, selectedValue] of Object.entries(selectedAttributes)) {
        if (!selectedValue) continue;

        const productValue = product.attributes?.[key];

        if (Array.isArray(productValue)) {
          if (!productValue.includes(selectedValue)) return false;
        } else {
          if (String(productValue) !== String(selectedValue)) return false;
        }
      }
      return true;
    });
  }, [products, selectedAttributes]);

  // обработчик выбора селекторов
  const handleAttributeFilterChange = (key, value) => {
    setSelectedAttributes((prev) => ({...prev, [key]: value}));
  };

  // обработка сброса всех фильтров
  const resetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedAttributes({});
    if (categoryId) {
      navigate(`/?category_id=${categoryId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {(!searchQuery && !categoryId) && <PromoBanner />}
        <section id="catalog-section" className="space-y-4 pt-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {searchQuery ? `Результаты поиска: «${searchQuery}»` : categoryId ? 'Товары в категории' : 'Все товары'}
            </h2>
            <span className="text-sm text-slate-500 font-medium mt-1 block">
              Найдено моделей: {filteredProducts.length}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
            <div className="flex items-center text-slate-700 font-semibold text-sm gap-2 mr-2">
              <SlidersHorizontal size={18} className="text-blue-600"/>
              Фильтры:
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="number" 
                placeholder="Цена от, ₽" 
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-32 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-400">-</span>
              <input 
                type="number" 
                placeholder="до, ₽" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-32 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button 
                onClick={applyFilters}
                className="bg-blue-600 hover:bg-blue-505 hover:bg-blue-500 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition"
              >
                ОК
              </button>
            </div>

            {Object.entries(availableFilters).map(([filterName, values]) => (
              <div key={filterName} className="flex items-center">
                <select
                  value={selectedAttributes[filterName] || ''}
                  onChange={(e) => handleAttributeFilterChange(filterName, e.target.value)}
                  className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">{filterName}</option>
                  {values.map((val) => (
                    <option key={val} value={val}>{String(val)}</option>
                  ))}
                </select>
              </div>
            ))}

            {(searchParams.get('min_price') || searchParams.get('max_price') || searchQuery || Object.values(selectedAttributes).some(Boolean)) && (
              <button 
                onClick={resetFilters}
                className="flex items-center gap-1 text-slate-500 hover:text-red-500 text-sm font-medium transition ml-auto"
              >
                <XCircle size={16} /> Сбросить всё
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-lg font-medium">К сожалению, по вашему запросу ничего не найдено.</p>
              <button onClick={resetFilters} className="mt-4 text-blue-600 font-semibold hover:underline">
                Сбросить фильтры
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Home;