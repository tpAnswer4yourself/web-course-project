import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Layers, Tag } from 'lucide-react';
import api from '../../api/axios';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // стейты модалки
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [name, setName] = useState(''); // стейт названия категории

  // подгрузка с сервера категорий
  const loadCategories = () => {
    api.get('/categories/')
      .then((res) => {
        setCategories(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError('Не удалось загрузить список категорий.');
      })
      .finally(() => {
        setLoading(false);
      });
  }
//
  useEffect(() => {
    loadCategories()
  }, []);

  // открытие модалки создания
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setError('');
    setIsModalOpen(true);
  };

  // открытие модалки редактирования
  const handleOpenEditModal = (category) => {
    setEditingCategory(category);
    setName(category.name);
    setError('');
    setIsModalOpen(true);
  };

  // обрабокта удаления категории
  const handleDeleteCategory = (categoryId) => {
    setError('');
    if (window.confirm('Вы действительно хотите удалить эту категорию?')) {
      api.delete(`/categories/${categoryId}`)
        .then(() => {
          loadCategories();
        })
        .catch((err) => {
          setError(err.response?.data?.detail || 'Ошибка при удалении категории.');
        });
    }
  };

  // обработчик создания/редактирования формы
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, { name });
      } else {
        await api.post('/categories/', { name });
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при сохранении категории.');
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="h-96 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Категории электронной техники</h1>
          <p className="text-slate-500 text-sm">Управление справочником категорий товаров</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/10 transition cursor-pointer"
        >
          <Plus size={18} />Создать категорию
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Layers size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Справочник категорий пока пуст.</p>
          <button 
            onClick={handleOpenCreateModal}
            className="mt-4 text-blue-600 font-semibold hover:underline"
          >
            Создать первую категорию
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Название категории</th>
                <th className="py-4 px-6 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-6 font-mono font-semibold text-slate-400 text-xs">
                    #{category.id}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-800 capitalize">
                    {category.name}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenEditModal(category)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="Редактировать название"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Удалить категорию"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="text-blue-600" size={20} />
                {editingCategory ? 'Редактирование категории' : 'Создание категории'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-slate-700">  
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Название категории *</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Tag size={14} />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Периферия"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition cursor-pointer"
                >
                  {editingCategory ? 'Сохранить изменения' : 'Создать категорию'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCategories;