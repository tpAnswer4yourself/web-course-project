import { useState, useEffect } from 'react';
import { Edit2, Trash2, X, Phone, Shield, UserCheck } from 'lucide-react';
import api from '../../api/axios';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [roleId, setRoleId] = useState('');

  const loadUsers = () => {
    setLoading(true);
    api.get('/users/')
      .then((res) => {
        setUsers(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError('Не удалось загрузить список пользователей.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFirstName(user.first_name);
    setLastName(user.last_name);
    setMiddleName(user.middle_name || '');
    setPhoneNumber(user.phone_number || '');
    setRoleId(user.role_id);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (userId) => {
    setError('');
    if (window.confirm('Вы действительно хотите удалить этого пользователя из системы?')) {
      api.delete(`/users/${userId}`)
        .then(() => {
          loadUsers();
        })
        .catch((err) => {
          setError(err.response?.data?.detail || 'Ошибка при удалении пользователя.');
        });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName || null,
      phone_number: phoneNumber || null,
      role_id: parseInt(roleId)
    };

    try {
      await api.patch(`/users/${editingUser.id}`, payload);
      setIsModalOpen(false);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при обновлении профиля пользователя.');
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="h-96 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Управление пользователями</h1>
        <p className="text-slate-500 text-sm">Модерирование учетных записей пользователей системы</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6">Пользователь</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Телефон</th>
                <th className="py-4 px-6">Роль в системе</th>
                <th className="py-4 px-6">Дата создания аккаунта</th>
                <th className="py-4 px-6 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {users.map((item) => {
                const fullName = `${item.last_name} ${item.first_name} ${item.middle_name || ''}`;
                const regDate = new Date(item.created_at).toLocaleDateString('ru-RU');

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 min-w-[200px]">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{fullName}</span>
                        <span className="text-xs text-slate-400 font-mono mt-0.5">Логин: {item.login}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {item.email}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-mono">
                      {item.phone_number || '—'}
                    </td>

                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold border uppercase tracking-wider ${
                        item.role_id === 3 ? "bg-red-50 text-red-700 border-red-200" :
                        item.role_id === 2 ? "bg-purple-50 text-purple-700 border-purple-200" :
                        "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {item.role_id === 3 ? "Администратор" : item.role_id === 2 ? "Продавец" : "Покупатель"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-500 font-mono">
                      {regDate}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleOpenEditModal(item)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Редактировать пользователя"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Удалить пользователя из системы"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <UserCheck className="text-blue-600" size={20} />Изменение данных пользователя
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Имя *</label>
                  <input 
                    type="text" 
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Фамилия *</label>
                  <input 
                    type="text" 
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Отчество</label>
                <input 
                  type="text" 
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Номер телефона</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone size={14} />
                  </div>
                  <input 
                    type="text" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Роль в системе *</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Shield size={14} />
                  </div>
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
                  >
                    <option value={1}>Покупатель</option>
                    <option value={2}>Продавец</option>
                    <option value={3}>Администратор</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition cursor-pointer"
                >
                  Сохранить изменения
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;