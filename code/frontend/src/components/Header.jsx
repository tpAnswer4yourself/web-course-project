import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, LogIn, User, Laptop } from 'lucide-react';
import api from '../api/axios';

// компонент двухуровневой шапки сайта
function Header() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [searchParams] = useSearchParams(); // извлекает параметры из URL-строки и записывает в массив
    const activeCategoryId = searchParams.get('category_id'); // состояние активной категории
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || ''); // состояние контента поисковой строки
    const [categories, setCategories] = useState([]); // существующие категории, подтягиваются из БД

    // юзэффект, подгружающий категории с сервера.
    useEffect(() => {
        api.get('/categories/')
            .then((response) => {
                setCategories(response.data);
            })
            .catch((error) => {
                console.error("Ошибка при получении категорий:", error);
            });
    }, []);

    // перенаправление в ЛК, обработчик кнопки ЛИЧНЫЙ КАБИНЕТ
    const handleCabinetClick = () => {
        navigate('/dashboard');
    };

    // обработчик клика по категории на нижнем ярусе шапки
    const handleCategoryClick = (categoryId) => {
        if (categoryId === 'all') {
            navigate('/');
        } else {
            navigate(`/?category_id=${categoryId}`); //добавляет в URL параметр с категорией
        }
    };

    // функция поиска
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // если какая-то категория активна, то поиск товаров будет производиться именно в ней
            const catParam = activeCategoryId ? `category_id=${activeCategoryId}&` : '';
            navigate(`/?${catParam}search=${encodeURIComponent(searchQuery)}`);
        } else {
            navigate('/');
        }
    };

    return (
        <header className="bg-slate-900 text-white w-full shadow-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-4">
                <Link to="/" className="flex items-center gap-2 text-white">
                    <Laptop className="text-blue-500" size={24} />
                    <span className="hidden text-xl font-bold tracking-tight sm:block">Tech<span className="text-blue-500">Marketplace</span></span>
                </Link>

                <div className="flex flex-1 max-w-md items-center" id="search-container">
                    <form onSubmit={handleSearchSubmit} className="flex flex-1 max-w-md items-center" id="search-container">
                        <div className="relative w-full">
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Поиск товаров..."
                                className="w-full rounded-lg bg-slate-800 py-2 pl-4 pr-10 text-sm text-slate-100 placeholder-slate-400 border border-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                                type="text"
                            />
                        </div>
                    </form>
                </div>

                <div id="action-buttons" className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/cart')}
                        className="relative flex items-center space-x-2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition cursor-pointer"
                        id="cart-btn"
                    >
                        <ShoppingCart size={18} className="text-blue-500" /><span>Корзина</span>
                    </button>

                    {token ? (
                        <button
                            onClick={handleCabinetClick}
                            className="flex items-center space-x-2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition cursor-pointer"
                        >
                            <User size={18} className="text-blue-500" /><span>Кабинет</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/10 hover:bg-blue-500 hover:shadow-lg transition cursor-pointer"
                        >
                            <LogIn size={18} /><span>Войти</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-11 items-center space-x-2 overflow-x-auto py-1 scrollbar-none">
                    <button
                        onClick={() => handleCategoryClick('all')}
                        className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition cursor-pointer ${!activeCategoryId
                            ? 'bg-blue-600 border border-blue-500 text-white'
                            : 'bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700'
                            }`}
                    >
                        Все категории
                    </button>

                    {categories.map((category) => {
                        const isCategoryActive = activeCategoryId === String(category.id);
                        return (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryClick(category.id)}
                                className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition cursor-pointer ${isCategoryActive
                                    ? 'bg-blue-600 border border-blue-500 text-white'
                                    : 'bg-slate-800/40 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 hover:border-slate-700'
                                    }`}
                            >
                                {category.name}
                            </button>
                        );
                    })}
                </div>
            </div>
        </header>
    );
}

export default Header;