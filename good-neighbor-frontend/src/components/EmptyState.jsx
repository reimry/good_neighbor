import React from 'react';
import { FileText, Wrench } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = FileText, 
  title, 
  description,
  actionLabel = 'Зв\'язатися з адміністратором',
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-12 px-4">
      <div className="text-gray-300 mb-6">
        <Icon size={80} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 text-center max-w-md mb-6">{description}</p>
      )}
      {onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
