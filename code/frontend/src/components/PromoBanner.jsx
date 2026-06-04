import Cpu from 'lucide-react';

// компонент представляет собой CTA-блок на главной странице
function PromoBanner() {
  const handleScrollToProducts = () => {
    const element = document.getElementById('catalog-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-lg">
      <div className="flex-1 space-y-4 text-center md:text-left z-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Новая коллекция техники от лучших продавцов!</h2>
        <p className="text-slate-400 text-sm max-w-lg mx-auto md:mx-0">
          Покупайте оригинальную электронику напрямую от проверенных ритейлеров с гарантией качества и быстрой доставкой.
        </p>
        <button
          onClick={handleScrollToProducts}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/10 hover:bg-blue-500 hover:shadow-lg transition cursor-pointer"
        >
          Перейти в каталог
        </button>
      </div>
      <div className="w-full md:w-1/3 aspect-video bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center justify-center relative overflow-hidden shrink-0">
        <Cpu className="text-blue-500 stroke-[1.5] animate-pulse" size={140} />
      </div>
    </div>
  );
}

export default PromoBanner;