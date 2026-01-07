import React from 'react';

const NewsCard = ({ news }) => {
    const date = new Date(news.created_at).toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'long',
    });

  return (
    <div className={`rounded-lg p-5 border shadow-sm transition-shadow hover:shadow-md ${news.is_important ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
      <div className="flex justify-between items-start mb-2">
           {news.is_important && (
               <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                   Важливо
               </span>
           )}
           <span className="text-gray-400 text-xs ml-auto">{date}</span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2 font-heading">
        {news.title}
      </h3>
      <p className="text-gray-600 text-sm line-clamp-3">
        {news.content}
      </p>
    </div>
  );
};

export default NewsCard;
