import React from 'react';

const BalanceWidget = ({ balance, lastUpdate }) => {
  const isDebt = balance < 0;
  const absBalance = Math.abs(balance).toFixed(2);
  const dateStr = lastUpdate ? new Date(lastUpdate).toLocaleDateString('uk-UA') : 'Сьогодні';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200">
      <h3 className="text-neutral-600 text-sm font-medium uppercase tracking-wider mb-2">
        Ваш Баланс
      </h3>
      <div className="flex items-baseline mb-2">
        <span className={`text-4xl font-bold font-heading ${isDebt ? 'text-warning-500' : 'text-accent-500'}`}>
          {isDebt ? '-' : ''}{absBalance}
        </span>
        <span className="text-neutral-700 text-xl ml-1">грн</span>
      </div>
      <div className="text-sm text-neutral-600 flex items-center">
         {isDebt ? (
             <span className="flex items-center text-warning-600 bg-warning-50 px-2 py-1 rounded text-xs font-medium">
                ⚠️ Заборгованість
             </span>
         ) : (
            <span className="flex items-center text-accent-600 bg-accent-50 px-2 py-1 rounded text-xs font-medium">
                ✅ Все сплачено
            </span>
         )}
         <span className="ml-auto text-xs text-neutral-500">Оновлено: {dateStr}</span>
      </div>
    </div>
  );
};

export default BalanceWidget;
