import { useNavigate } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';

//компонент маленькой карточки товара (для сетки)
function ProductCard({ product }) {
  const navigate = useNavigate();
  const formattedPrice = Number(product.price).toLocaleString('ru-RU');
  const imageUrl = `http://localhost:8000${product.image_url}`

  const sellerName = product.vendor ? `${product.vendor.first_name} ${product.vendor.last_name}` : 'Неизвестный продавец';

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:translate-y-[-4px] hover:border-blue-200 hover:shadow-xl transition duration-300 cursor-pointer">
      <div className="relative aspect-video w-full overflow-hidden bg-slate-50 flex items-center justify-center p-4">
        <img
          alt={product.title}
          className="h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition duration-500"
          src={imageUrl}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 bg-slate-900/20">
          <button
            onClick={() => navigate(`/product/${product.id}`)}
            className="rounded-full bg-white/90 p-3 text-slate-900 shadow-lg hover:scale-110 transition cursor-pointer"
          >
            <Eye size={20} className="text-blue-600" />
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 space-y-2">
        <div className="flex items-center justify-end">
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded ${product.stock_quantity > 0
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-red-600 bg-red-50'
              }`}
          >
            {product.stock_quantity > 0
              ? `В наличии: ${product.stock_quantity} шт`
              : 'Нет в наличии'
            }
          </span>
        </div>
        <h3
          onClick={() => navigate(`/product/${product.id}`)}
          className="font-sans text-sm font-semibold text-slate-800 line-clamp-2 hover:text-blue-600 transition min-h-[40px]"
        >
          {product.title}
        </h3>
        <div className="flex items-center space-x-1 text-xs text-slate-500">
          <span className="font-medium text-slate-400">Продавец:</span>
          <span className="font-semibold text-slate-700 underline truncate max-w-[130px]">
            {sellerName}
          </span>
        </div>
        <div className="pt-2 flex items-center justify-between border-t border-slate-50 mt-auto">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Стоимость</span>
            <span className="text-lg font-extrabold text-slate-900 font-mono">
              {formattedPrice} <span className="text-sm font-sans font-normal text-slate-500">₽</span>
            </span>
          </div>

          <button
            className="rounded-xl bg-blue-600 p-2 text-white shadow-md shadow-blue-500/10 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 hover:shadow-lg transition cursor-pointer"
            title="Добавить в корзину"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;