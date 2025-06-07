import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button'; // Assuming Button component exists and can be styled

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    // Adjusted background color to match the greenish tone in the image if possible, or keep it simple
    // Using a placeholder green color, replace with actual theme color if available
    <header className="bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">ZoneHub</Link>
        
        <nav className="flex items-center space-x-6">
          <Link to="/" className="hover:text-gray-200 transition-colors">
            Trang chủ
          </Link>
          <Link to="/search" className="hover:text-gray-200 transition-colors">
            Tìm sân
          </Link>
          {/* Keep Tìm đội as requested */}
          <Link to="/teams" className="hover:text-gray-200 transition-colors">
            Tìm đội
          </Link>
          
          {isAuthenticated ? (
            <div className="relative group">
              <button className="flex items-center space-x-1 hover:text-gray-200 transition-colors">
                <span>{user?.name || 'Tài khoản'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown styling can be adjusted later if needed */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Trang cá nhân
                </Link>
                
                {user?.role === 'owner' && (
                  <Link to="/owner/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Quản lý sân
                  </Link>
                )}
                
                {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Quản trị hệ thống
                  </Link>
                )}
                
                <button 
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="hover:text-gray-200 transition-colors">
                Đăng nhập
              </Link>
              {/* Apply green background to Đăng ký button as per image */}
              <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                <Link to="/register">
                  Đăng ký
                </Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;

