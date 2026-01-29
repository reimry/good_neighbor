import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import VotingCard from '../components/VotingCard';
import Logo from '../components/Logo';
import EmptyState from '../components/EmptyState';
import { FileText } from 'lucide-react';

const VotingsListPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [votings, setVotings] = useState([]);
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

    const fetchVotings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/votings');
            // Fetch clean details for each voting to ensure we get user_vote and results correctly 
            // (The list endpoint might be simplified in future, but for now it returns basic info. 
            //  Actually, let's just fetch the list. The list endpoint needs to include user_vote if we want to show active state correctly without N+1 calls.
            //  Wait, our backend GET /votings doesn't include user_vote or results logic yet. 
            //  It's better to fetch individual details for the list or update backend.
            //  Let's update frontend to fetch detail for each ID to gets results/user_vote. 
            //  Or better: Let's rely on the list for basic info and if needed, fetch details.
            //  Actually, for MVP, let's just use the GET /votings list.
            //  CRITICAL: The GET /votings logic I wrote earlier ONLY returns `SELECT * FROM votings`. 
            //  It DOES NOT return `user_vote`. So `VotingCard` won't know if user voted!
            //  I need to either update the backend list endpoint or fetch details for each card.
            //  Given MVP scale (few votings), fetching details for each is acceptable but slow.
            //  Let's do details fetch here in a wrapper loop.
            
            const listResponse = await api.get('/votings');
            const list = listResponse.data;

            const detailedVotings = await Promise.all(
                list.map(async (v) => {
                    const detail = await api.get(`/votings/${v.id}`);
                    return detail.data;
                })
            );
            
            setVotings(detailedVotings);
        } catch (err) {
            console.error('Failed to fetch votings', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVotings();
    }, []);

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
                    <h1 className="text-lg font-bold text-gray-900 ml-2">Голосування</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                {loading ? (
                     <div className="flex justify-center py-12">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                     </div>
                ) : (
                    <>
                        {votings.length > 0 ? (
                            <div className="space-y-6">
                                {votings.map(voting => (
                                    <VotingCard 
                                        key={voting.id} 
                                        voting={voting} 
                                        onVote={fetchVotings} // Refresh all on vote to update state
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <EmptyState
                                    icon={FileText}
                                    title="Немає активних або завершених голосувань"
                                    description="Коли адміністратор створить голосування, воно з'явиться тут"
                                    actionLabel="Зв'язатися з адміністратором"
                                    onAction={() => {
                                        // You can add navigation to contact admin or open a modal
                                        window.location.href = 'mailto:admin@osbb.com';
                                    }}
                                />
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default VotingsListPage;
