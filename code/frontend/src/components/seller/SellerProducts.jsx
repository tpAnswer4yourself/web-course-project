import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Upload, X, Package, Layers, Coins } from 'lucide-react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

function SellerProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]); // мои товары
  const [categories, setCategories] = useState([]); // существующие категории
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // стейты модального окна формы
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  //стейты полей формы
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [specs, setSpecs] = useState([{ key: '', value: '' }]); // конструктор характеристик товара

  // загрузка моих товаров и сущ. категорий для селекта в форме
  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/products/my-products'),
      api.get('/categories/')
    ])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data);
        setCategories(catRes.data);
      })
      .catch((err) => {
        console.error(err);
        setError('Не удалось загрузить товары.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // открытие модального окна создания
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setStockQuantity('');
    setCategoryId(categories[0]?.id || '');
    setImageUrl('');
    setSpecs([{ key: '', value: '' }]);
    setIsModalOpen(true);
  };

  // открытие модального окна редактирования
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setTitle(product.title);
    setDescription(product.description || '');
    setPrice(product.price);
    setStockQuantity(product.stock_quantity);
    setCategoryId(product.category_id);
    setImageUrl(product.image_url || '');
    
    // преобразование JSONB атрибутов обратно в массив ключ-значение для формы
    // если у характеристики товара несколько значений, разделенных запятой, то
    // у данного товара эта характеристика будет селектором в карточке
    if (product.attributes && Object.keys(product.attributes).length > 0) {
      const loadedSpecs = Object.entries(product.attributes).map(([key, value]) => ({
        key,
        value: Array.isArray(value) ? value.join(', ') : String(value)
      }));
      setSpecs(loadedSpecs);
    } else {
      setSpecs([{ key: '', value: '' }]);
    }
    
    setIsModalOpen(true);
  };

  // обработчик удаления товара
  const handleDeleteProduct = (productId) => {
    if (window.confirm('Вы действительно хотите удалить этот товар?')) {
      api.delete(`/products/${productId}`)
        .then(() => {
          loadData();
        })
        .catch((err) => {
          alert(err.response?.data?.detail || "Ошибка при удалении товара!");
        });
    }
  };

  // обработчик загрузки изображения на сервер
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImageUrl(res.data.image_url);
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка загрузки изображения');
    } finally {
      setUploadingImage(false);
    }
  };

  // конструктор характеристики
  const handleAddSpecField = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  // деструктор характеристики
  const handleRemoveSpecField = (idx) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  // изменение характеристики
  const handleSpecChange = (idx, field, val) => {
    const newSpecs = [...specs];
    newSpecs[idx][field] = val;
    setSpecs(newSpecs);
  };

  // отправка формы на сервер (создание товара или редактирование)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const attributes = {};
    specs.forEach((spec) => {
      if (spec.key.trim() && spec.value.trim()) {
        const val = spec.value.trim();
        if (val.includes(',')) { // !!!!!! если значение содержит запятые, сохраняем его как массив
          attributes[spec.key.trim()] = val.split(',').map(item => item.trim());
        } else {
          attributes[spec.key.trim()] = val; // иначе как обычную строку
        }
      }
    });

    const payload = {
      title,
      description: description || null,
      price: parseFloat(price),
      stock_quantity: parseInt(stockQuantity),
      category_id: parseInt(categoryId),
      image_url: imageUrl || null,
      attributes
    };

    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products/', payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка сохранения товара.');
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="h-96 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Мои товары</h1>
          <p className="text-slate-500 text-sm">Управление каталогом и складскими запасами вашей продукции</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/10 transition cursor-pointer"
        >
          <Plus size={18} />Добавить товар
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Package size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">В вашем каталоге еще нет товаров.</p>
          <button 
            onClick={handleOpenCreateModal}
            className="mt-4 text-blue-600 font-semibold hover:underline"
          >
            Создать первый товар
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-4 px-6">Товар</th>
                  <th className="py-4 px-6">Категория</th>
                  <th className="py-4 px-6">Стоимость</th>
                  <th className="py-4 px-6">Остаток</th>
                  <th className="py-4 px-6 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {products.map((product) => {
                  const imgUrl = `http://localhost:8000${product.image_url}`;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-6 flex items-center gap-4 min-w-[250px]">
                        <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center p-1.5 shrink-0">
                          <img src={imgUrl} alt={product.title} className="max-w-full max-h-full object-contain" />
                        </div>
                        <span 
                       onClick={() => navigate(`/product/${product.id}`)}
                       className="font-bold text-slate-800 line-clamp-1 hover:text-blue-600 transition cursor-pointer"
                     >
                       {product.title}
                     </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {categories.find(c => c.id === product.category_id)?.name || 'Загрузка...'}
                      </td>
                      <td className="py-4 px-6 font-semibold font-mono text-slate-900">
                        {Number(product.price).toLocaleString('ru-RU')} ₽
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold`}>
                          {product.stock_quantity} шт
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEditModal(product)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Редактировать товар"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Удалить товар"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">
                {editingProduct ? 'Редактирование товара' : 'Добавление нового товара'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-700">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Наименование товара *</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Смартфон Apple iPhone 15 Pro"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Цена, ₽ *</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Coins size={14} />
                    </div>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="99990"
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Количество на складе *</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Package size={14} />
                    </div>
                    <input 
                      type="number" 
                      required
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      placeholder="15"
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Категория техники *</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Layers size={14} />
                  </div>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Описание</label>
                <textarea 
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите преимущества, состояние и особенности товара..."
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Изображение товара</label>
                <div className="flex items-center gap-4">
                  {imageUrl ? (
                    <div className="relative w-16 h-16 bg-slate-50 border border-slate-200 rounded-lg p-1 flex items-center justify-center shrink-0">
                      <img src={`http://localhost:8000${imageUrl}`} alt="Превью" className="max-w-full max-h-full object-contain" />
                      <button 
                        type="button" 
                        onClick={() => setImageUrl('')}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow transition cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-16 h-16 bg-slate-50 border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/10 rounded-lg flex flex-col items-center justify-center text-slate-400 transition cursor-pointer shrink-0">
                      <Upload size={18} />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                  <span className="text-xs text-slate-400">
                    {uploadingImage ? 'Файл загружается на сервер...' : imageUrl ? '' : 'Выберите фото JPG или PNG'}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Характеристики</label>
                  <button
                    type="button"
                    onClick={handleAddSpecField}
                    className="text-xs font-bold text-blue-600 hover:text-blue-500 transition cursor-pointer"
                  >
                    Добавить параметр
                  </button>
                </div>
                
                <div className="space-y-2">
                  {specs.map((spec, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        placeholder="Бренд..."
                        value={spec.key}
                        onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                        className="w-1/2 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                      />
                      <input 
                        type="text" 
                        placeholder="Apple..."
                        value={spec.value}
                        onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                        className="w-1/2 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecField(idx)}
                        className="p-1.5 text-slate-300 hover:text-red-500 transition cursor-pointer"
                        disabled={specs.length <= 1}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition cursor-pointer"
                >
                  {editingProduct ? 'Сохранить изменения' : 'Создать товар'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerProducts;