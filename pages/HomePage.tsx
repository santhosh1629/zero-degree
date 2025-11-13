import React from 'react';
import { useNavigate } from 'react-router-dom';
import DynamicBackground from '../components/student/DynamicBackground';
import Typewriter from 'typewriter-effect';

// A fun, cartoonish Samosa character with boxing gloves.
const SamosaFighter = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <g transform="rotate(-15 50 50)">
            <path d="M 50,10 L 90,90 L 10,90 Z" fill="#FBBF24" stroke="#B45309" strokeWidth="4" />
            <path d="M 50,10 C 60,20 80,40 90,90" fill="none" stroke="#F59E0B" strokeWidth="3" />
            <circle cx="45" cy="40" r="4" fill="white" /><circle cx="45" cy="40" r="2" fill="black" />
            <circle cx="60" cy="45" r="4" fill="white" /><circle cx="60" cy="45" r="2" fill="black" />
            <path d="M 48,55 Q 55,65 62,55" stroke="black" strokeWidth="2" fill="none" />
            <circle cx="20" cy="70" r="10" fill="#DC2626" stroke="#991B1B" strokeWidth="2"/>
            <circle cx="80" cy="70" r="10" fill="#DC2626" stroke="#991B1B" strokeWidth="2"/>
        </g>
    </svg>
);

// An 'angry' or 'hangry' bowl of noodles.
const NoodlesBeast = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <path d="M 10,50 C 10,80 90,80 90,50" fill="#F87171" stroke="#B91C1C" strokeWidth="3" />
        <path d="M 10,50 Q 50,40 90,50" fill="#FEF3C7" />
        <path d="M 20,48 C 30,30 40,50 50,35 S 70,50 80,40" stroke="#FBBF24" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M 25,50 C 35,35 45,55 55,40 S 75,55 85,45" stroke="#FCD34D" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M 30 30 Q 35 20 40 30 T 50 30" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
        <path d="M 60 28 Q 65 18 70 28 T 80 28" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"/>
        <path d="M 30,60 L 45,65" stroke="black" strokeWidth="4" strokeLinecap="round"/>
        <path d="M 70,60 L 55,65" stroke="black" strokeWidth="4" strokeLinecap="round"/>
    </svg>
);

// A spinning Parotta looking like a UFO.
const ParottaUfo = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <g>
            <ellipse cx="50" cy="50" rx="45" ry="25" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2"/>
            <path d="M 15,50 C 30,40 70,40 85,50" stroke="#FCD34D" strokeWidth="2" fill="none" />
            <path d="M 25,50 C 40,45 60,45 75,50" stroke="#FBBF24" strokeWidth="1.5" fill="none" />
            <ellipse cx="50" cy="50" rx="20" ry="10" fill="#FBBF24" opacity="0.5"/>
        </g>
    </svg>
);


const HomePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <>
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-textPrimary overflow-hidden p-4">
            <DynamicBackground gradientClassName="bg-home-violet-gradient" />
            <div className="absolute inset-0 z-10 bg-background/60"></div>

            {/* Adjusted SVG characters for better responsiveness */}
            <div aria-hidden="true" className="absolute top-1/4 left-5 sm:left-10 opacity-70 w-20 h-20 sm:w-24 sm:h-24 hidden md:block animate-float" style={{animationDuration: '7s'}}>
                <SamosaFighter />
            </div>
            <div aria-hidden="true" className="absolute bottom-1/4 right-5 sm:right-10 opacity-70 w-24 h-24 sm:w-32 sm:h-32 hidden md:block animate-float" style={{animationDuration: '5s', animationDelay: '1s'}}>
                <NoodlesBeast />
            </div>
             <div aria-hidden="true" className="absolute bottom-1/2 left-1/4 opacity-60 w-20 h-20 hidden lg:block animate-float animate-spin" style={{animationDuration: '8s', animationDelay: '2s'}}>
                <ParottaUfo />
            </div>

            <main className="relative z-20 flex flex-col items-center justify-center text-center">
                 {/* Responsive heading */}
                 <h1 className="font-heading text-3xl sm:text-5xl lg:text-7xl font-black whitespace-nowrap" style={{ textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
                    <span className="text-textPrimary">🍿𝐒𝐚𝐧𝐠𝐞𝐞𝐭𝐡𝐚✨𝐂𝐢𝐧𝐞𝐦𝐚𝐬🎬</span>
                </h1>

                {/* Responsive typewriter */}
                <div className="mt-4 h-10 text-center animate-fade-in-down" style={{animationDelay: '0.5s', textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>
                    <Typewriter
                        options={{
                            strings: [
                            "MOVIE MUNCHIES, DELIVERED.",
                            "SKIP THE INTERVAL RUSH.",
                            "SNACKS FOR YOUR SHOWTIME.",
                            "EAT. WATCH. REPEAT.",
                            ],
                            autoStart: true,
                            loop: true,
                            delay: 75,
                            deleteSpeed: 50,
                            wrapperClassName: "text-lg sm:text-xl lg:text-2xl font-black text-textSecondary",
                            cursorClassName: "text-lg sm:text-xl lg:text-2xl font-black text-primary",
                        }}
                    />
                </div>
                
                <div className="mt-10 flex flex-col sm:flex-row gap-6 w-full max-w-xs sm:max-w-md animate-fade-in-down" style={{animationDelay: '0.8s'}}>
                    <button
                        onClick={() => navigate('/customer/menu')}
                        className="btn-3d w-full bg-primary border-primary-dark text-background font-black py-3 px-4 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/40"
                    >
                        Order Snacks
                    </button>
                    <button
                        onClick={() => navigate('/login-owner')}
                        className="btn-3d w-full bg-surface-light border-surface text-textPrimary font-black py-3 px-4 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-surface-light/30"
                    >
                        I'm a Cinema Owner
                    </button>
                </div>
                <div className="mt-6 w-full max-w-xs sm:max-w-md animate-fade-in-down" style={{animationDelay: '1.1s'}}>
                    <button
                        onClick={() => navigate('/owner/scan-terminal')}
                        className="w-full text-textSecondary/90 font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:bg-surface-light/20"
                    >
                        Staff / QR Scan Terminal
                    </button>
                </div>
            </main>
        </div>
        </>
    );
};

export default HomePage;
