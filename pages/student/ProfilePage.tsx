import React from 'react';
import { Link } from 'react-router-dom';

const HeartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>);
const ChatIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>);

const StudentPage: React.FC = () => {
    return (
        <div className="max-w-2xl mx-auto space-y-8 text-white">
            <h1 className="text-3xl font-bold font-heading text-center" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                Account
            </h1>

            <div className="grid grid-cols-1 gap-6">
                <Link to="/favourites" className="group block bg-surface/50 backdrop-blur-lg border border-surface-light p-6 rounded-2xl shadow-lg hover:bg-surface-light/30 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-6">
                        <div className="text-red-400 group-hover:text-red-300 transition-colors">
                            <HeartIcon />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold font-heading">Favourites</h2>
                            <p className="text-textSecondary mt-1">View and manage your saved food items.</p>
                        </div>
                    </div>
                </Link>

                <Link to="/feedback" className="group block bg-surface/50 backdrop-blur-lg border border-surface-light p-6 rounded-2xl shadow-lg hover:bg-surface-light/30 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-6">
                        <div className="text-primary group-hover:text-yellow-300 transition-colors">
                            <ChatIcon />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold font-heading">Feedback</h2>
                            <p className="text-textSecondary mt-1">Tell us what you think about our food.</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default StudentPage;