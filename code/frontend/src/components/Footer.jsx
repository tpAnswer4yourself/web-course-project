import React from 'react';
// Компонент подвала сайта
function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm py-8 border-t border-slate-800 mt-10" id="app-footer">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-slate-300">
          <span className="text-white font-bold tracking-tight text-base">Tech<span className="text-blue-500">Marketplace</span></span>
          <span>-</span>
          <span>Все права защищены &copy;</span>
        </div>
        <div className="text-center sm:text-right space-y-1">
          <p>Выполнил: Нестерчук Антон Васильевич, группа 241-326</p>
          <p className="text-[12px] text-slate-500">Курсовой проект по дисциплине «Разработка веб-приложений»</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;