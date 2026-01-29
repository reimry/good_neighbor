import React from 'react';
import { Wallet } from 'lucide-react';

const BalanceWidget = ({ balance, lastUpdate }) => {
  const isDebt = balance < 0;
  const absBalance = Math.abs(balance).toFixed(2);
  const dateStr = lastUpdate ? new Date(lastUpdate).toLocaleDateString('uk-UA') : 'Сьогодні';

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
      isDebt 
        ? 'border-orange-500 bg-red-50/30' 
        : 'border-transparent border-neutral-200'
    } border-r border-t border-b`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${isDebt ? 'bg-orange-100' : 'bg-primary-100'}`}>
          <Wallet className={`h-5 w-5 ${isDebt ? 'text-orange-600' : 'text-primary-600'}`} />
        </div>
        <h3 className="text-neutral-600 text-sm font-medium uppercase tracking-wider">
          Ваш Баланс
        </h3>
      </div>
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
