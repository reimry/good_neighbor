import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import NewsCard from '../components/NewsCard';
import Logo from '../components/Logo';

const NewsListPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [news, setNews] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    
    // Determine back button destination
    const getBackPath = () => {
        // Check if we came from admin panel
        const state = location.state;
        if (state?.from === '/admin' || document.referrer.includes('/admin')) {
            return '/admin';
        }
        return '/dashboard';
    };

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/news?page=${page}&limit=10`);
                setNews(response.data.news);
                setTotalPages(response.data.pages);
            } catch (err) {
                console.error('Failed to fetch news', err);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, [page]);

    return (
        <div className="min-h-screen bg-gray-50">
             <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
                     <button 
                        onClick={() => navigate(getBackPath())} 
                        className="text-gray-400 hover:text-gray-600"
                     >
                        ← Назад
                     </button>
                    <Logo type="acronym" className="h-10" />
                    <h1 className="text-lg font-bold text-gray-900 ml-2">Новини будинку</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                {loading ? (
                     <div className="flex justify-center py-12">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                     </div>
                ) : (
                    <>
                        {news.length > 0 ? (
                            <div className="space-y-4">
                                {news.map(item => (
                                    <NewsCard 
                                        key={item.id} 
                                        news={item} 
                                        onDelete={() => {
                                            // Refresh news list
                                            const fetchNews = async () => {
                                                setLoading(true);
                                                try {
                                                    const response = await api.get(`/news?page=${page}&limit=10`);
                                                    setNews(response.data.news);
                                                    setTotalPages(response.data.pages);
                                                } catch (err) {
                                                    console.error('Failed to fetch news', err);
                                                } finally {
                                                    setLoading(false);
                                                }
                                            };
                                            fetchNews();
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                             <div className="bg-white rounded-lg p-12 text-center border-dashed border-2 border-gray-200">
                                <p className="text-gray-500">Архів новин порожній</p>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-8">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className={`px-4 py-2 rounded text-sm ${page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white border hover:bg-gray-50'}`}
                                >
                                    Назад
                                </button>
                                <span className="px-4 py-2 text-sm text-gray-600">
                                    Сторінка {page} з {totalPages}
                                </span>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                     className={`px-4 py-2 rounded text-sm ${page === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white border hover:bg-gray-50'}`}
                                >
                                    Далі
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default NewsListPage;
