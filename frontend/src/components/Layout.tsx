import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarDays,
  Bell,
  BarChart3,
  Settings,
  Menu,
  X,
  Phone,
  ChevronRight,
} from 'lucide-react';
import { useUnreadNotificationCount } from '../hooks/useNotifications';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/follow-ups', label: 'Follow-ups', icon: Phone },
  { path: '/payments', label: 'Payments', icon: CreditCard },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count || 0;

  const appName = import.meta.env.VITE_APP_NAME || 'LeadFlow CRM';
  const currentPage = navItems.find((item) => location.pathname.startsWith(item.path))?.label || 'Dashboard';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-indigo-900 text-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-indigo-800">
          <h1 className="text-xl font-bold">{appName}</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            const showBadge = item.path === '/notifications' && unreadCount > 0;

            return (
              <NavLink
                key={item.path}
                to={item.path === '/dashboard' && location.pathname === '/' ? '/dashboard' : item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3 mt-1 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </div>
                {showBadge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-indigo-800">
          <div className="text-sm text-indigo-300">
            <p>© 2024 LeadFlow CRM</p>
            <p className="text-xs mt-1">v1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 mr-4"
            >
              <Menu className="w-6 h-6" />
            </button>
            <nav className="hidden sm:flex items-center text-sm text-gray-500">
              <span>Home</span>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="text-gray-900 font-medium">{currentPage}</span>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center text-sm text-gray-500">
              <span>BD User: Rahul Sharma</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
              RS
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
