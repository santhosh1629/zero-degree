import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

const ZeroDegreeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v12M8 8l8 8M8 16l8-8" strokeWidth="1.5" />
    </svg>
);


const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const getHomeLink = () => {
      if (!user) return "/";
      switch(user.role) {
          case Role.STUDENT: return "/student/menu";
          case Role.CANTEEN_OWNER: return "/owner/dashboard";
          case Role.ADMIN: return "/admin/dashboard";
          default: return "/";
      }
  }

  return (
    <header className="bg-gray-800 shadow-md sticky top-0 z-50 border-b border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={getHomeLink()} className="flex items-center gap-2 text-2xl font-bold font-heading text-indigo-400">
            <ZeroDegreeIcon />
            Zero✦Degree
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-gray-300 hidden sm:inline">
                  Welcome, <span className="font-semibold text-white">{user.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-300"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;