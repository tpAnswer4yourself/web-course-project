import { Users, Layers, ShieldAlert, FileText, LogOut, ArrowLeft, Laptop } from 'lucide-react';

function AdminSidebar({ activeTab, setActiveTab, user, onLogout }) {
  const menuItems = [
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'categories', label: 'Категории', icon: Layers },
    { id: 'products', label: 'Модерация товаров', icon: ShieldAlert },
    { id: 'orders', label: 'Все заказы', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col h-screen sticky top-0 border-r border-slate-800 shrink-0">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-800">
        <Laptop className="text-blue-500" size={22} />
        <span className="text-lg font-bold text-white tracking-tight">
          Tech<span className="text-blue-500">Marketplace</span>
        </span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-red-600/10'
                  : 'hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950/40">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-blue-500 font-bold text-sm shrink-0">
            {user.first_name[0]}{user.last_name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{user.first_name} {user.last_name}</p>
            <p className="text-[14px] text-slate-500 truncate">Администратор</p>
          </div>
        </div>

        <button
          onClick={() => window.location.href = '/'}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 hover:text-slate-200 transition cursor-pointer"
        >
          <ArrowLeft size={14} />Вернуться на главную
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-blue-500 hover:bg-red-950/20 hover:text-blue-400 transition cursor-pointer"
        >
          <LogOut size={14} />Выйти из аккаунта
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;