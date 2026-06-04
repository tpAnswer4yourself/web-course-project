import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, CheckCircle, X } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import api from '../api/axios';

function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null); // стейт товара
    const [similarProducts, setSimilarProducts] = useState([]); // стейт массив похожих товаров
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showToast, setShowToast] = useState(false); // стейт кастомного алерта
    const [selectedOptions, setSelectedOptions] = useState({}); // стейт опций у товара

    // загрузка информации о товаре с сервера
    useEffect(() => {
        api.get(`/products/${id}`)
            .then((response) => {
                setProduct(response.data);

                if (response.data.attributes) {
                    const defaults = {};
                    // преобразование словаря в массив из массивов
                    Object.entries(response.data.attributes).forEach(([key, value]) => {
                        if (Array.isArray(value) && value.length > 0) {
                            defaults[key] = value[0];
                        }
                    });
                    setSelectedOptions(defaults);
                }

                return api.get(`/products/?category_id=${response.data.category_id}`);
            })
            .then((response) => {
                // похожие товары до 4штук, берутся из той же категории
                const filteredSimilar = response.data.filter(p => p.id !== id).slice(0, 4);
                setSimilarProducts(filteredSimilar);
            })
            .catch((err) => {
                console.error(err);
                setError('Не удалось загрузить товар. Возможно, он был удален.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    
    // эффект для алерта
    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    // обработчик клика по кнопке селектора
    const handleOptionSelect = (key, option) => {
        setSelectedOptions(prev => ({ ...prev, [key]: option }));
    };

    // функция добавления товара в корзину
    const addToCart = () => {
        const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const itemIndex = existingCart.findIndex(item =>
            item.product.id === product.id &&
            JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions)
        );

        if (itemIndex > -1) {
            if (existingCart[itemIndex].quantity < product.stock_quantity) {
                existingCart[itemIndex].quantity += 1;
            }
        } else {
            existingCart.push({
                product: product,
                quantity: 1,
                selectedOptions: selectedOptions
            });
        }

        localStorage.setItem('cart', JSON.stringify(existingCart));
        setShowToast(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <div className="flex-1 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col justify-center items-center">
                    <p className="text-xl text-slate-500 mb-4">{error}</p>
                    <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Вернуться назад</button>
                </div>
                <Footer />
            </div>
        );
    }

    const imageUrl = `http://localhost:8000${product.image_url}`;
    const sellerName = product.vendor ? `${product.vendor.first_name} ${product.vendor.last_name}` : 'Неизвестный продавец';
    const formattedPrice = Number(product.price).toLocaleString('ru-RU');
    const arrayAttributes = product.attributes ? Object.entries(product.attributes).filter(([_, value]) => Array.isArray(value)) : [];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition"
                >
                    <ArrowLeft size={18} />
                    Назад к покупкам
                </button>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 lg:p-10">
                        <div className="aspect-square bg-slate-50 rounded-xl flex items-center justify-center p-8 border border-slate-100">
                            <img
                                src={imageUrl}
                                alt={product.title}
                                className="max-w-full max-h-full object-contain filter drop-shadow-md"
                            />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                                {product.title}
                            </h1>
                            <div className="flex items-center gap-2 text-sm mb-6">
                                <span className="text-slate-500">Продавец:</span>
                                <span className="font-semibold text-slate-700">{sellerName}</span>
                            </div>
                            <div className="mb-6">
                                <span className="text-sm text-slate-500 block mb-1">Стоимость</span>
                                <div className="text-4xl font-black text-slate-900 font-mono tracking-tight">
                                    {formattedPrice} <span className="text-2xl font-sans font-medium text-slate-500">₽</span>
                                </div>
                                <div
                                    className={`mt-2 inline-block px-3 py-1 text-xs font-bold rounded ${product.stock_quantity > 0
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-red-50 text-red-700'
                                        }`}
                                >
                                    {product.stock_quantity > 0
                                        ? `В наличии: ${product.stock_quantity} шт`
                                        : 'Нет в наличии'
                                    }
                                </div>
                            </div>

                            {arrayAttributes.length > 0 && (
                                <div className="mb-8 space-y-4">
                                    {arrayAttributes.map(([key, values]) => (
                                        <div key={key}>
                                            <span className="text-sm font-semibold text-slate-900 block mb-2">
                                                {key}: <span className="text-slate-500 font-normal">{selectedOptions[key]}</span>
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {values.map((option) => (
                                                    <button
                                                        key={option}
                                                        onClick={() => handleOptionSelect(key, option)}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition cursor-pointer ${selectedOptions[key] === option
                                                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/50'
                                                            }`}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-auto pt-6 border-t border-slate-100">
                                <button
                                    onClick={addToCart}
                                    disabled={product.stock_quantity < 1}
                                    className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition active:scale-[0.98]"
                                >
                                    <ShoppingCart size={20} />
                                    {product.stock_quantity > 0 ? 'Добавить в корзину' : 'Нет в наличии'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 space-y-12">
                    <div>
                        <h2 className="text-3xl font-normal text-slate-900 mb-4 tracking-tight">О товаре</h2>
                        <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {product.description || 'Описание для данного товара пока не добавлено продавцом.'}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-normal text-slate-900 mb-4 tracking-tight">Характеристики</h2>
                        {product.attributes && Object.keys(product.attributes).length > 0 ? (
                            <ul className="space-y-3 max-w-2xl">
                                {Object.entries(product.attributes).map(([key, value]) => (
                                    <li key={key} className="flex text-sm">
                                        <span className="text-slate-500 w-1/2">{key}</span>
                                        <span className="font-medium text-slate-900 w-1/2">
                                            {Array.isArray(value) ? value.join(', ') : String(value)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-400">Характеристики не указаны</p>
                        )}
                    </div>

                </div>

                {similarProducts.length > 0 && (
                    <div className="pt-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Похожие предложения</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {similarProducts.map((simProduct) => (
                                <ProductCard key={simProduct.id} product={simProduct} />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <Footer />

            {showToast && (
                <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <div className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-lg shrink-0">
                        <CheckCircle size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm">Добавлено в корзину</p>
                        <p className="text-slate-400 text-xs mt-0.5 truncate max-w-[180px]">
                            {product.title}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowToast(false)}
                        className="text-slate-500 hover:text-slate-300 ml-2 transition cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default ProductDetails;