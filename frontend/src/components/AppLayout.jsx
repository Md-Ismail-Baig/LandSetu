import React, { useState } from 'react';
import { NavLink, Outlet, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import {
  Landmark,
  LayoutDashboard,
  Search,
  Layers,
  Cpu,
  Satellite,
  FileCheck2,
  FileText,
  Repeat,
  Scissors,
  ShieldCheck,
  Settings,
  User,
  Menu,
  X,
  ChevronRight,
  Shield,
  Users,
  LogOut,
  LandPlot,
  Building2,
  Lock
} from 'lucide-react';

export default function AppLayout() {
  const { user, loading, isCitizen, isOfficer, isAdmin, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return null;
  }

  // Auth Guard: Unauthenticated users are redirected to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }


  // Role-tailored navigation items
  let navItems = [];
  let governanceItems = [];

  if (isCitizen) {
    navItems = [
      { name: 'Citizen Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Parcel Search', path: '/search', icon: Search },
      { name: 'My Service Requests', path: '/service-requests', icon: FileCheck2 },
      { name: 'My Profile', path: '/profile', icon: User },
    ];
    governanceItems = [
      { name: 'Document Verification', path: '/document-verification', icon: FileText },
      { name: 'Land Sale / Transfer', path: '/land-transfer', icon: Repeat },
      { name: 'Parcel Subdivision', path: '/parcel-subdivision', icon: Scissors },
    ];
  } else if (isAdmin) {
    navItems = [
      { name: 'Admin Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'User Directory', path: '/admin/users', icon: Users },
      { name: 'Cadastral Search', path: '/search', icon: Search },
      { name: 'GIS Cadastre', path: '/gis-map', icon: Layers },
      { name: 'Global Service Requests', path: '/service-requests', icon: FileCheck2 },
      { name: 'Satellite Monitoring', path: '/change-monitoring', icon: Satellite },
      { name: 'Admin Profile', path: '/profile', icon: User },
    ];
    governanceItems = [
      { name: 'Blockchain & Audit Logs', path: '/blockchain-audit', icon: ShieldCheck },
      { name: 'System Settings', path: '/admin', icon: Settings },
    ];
  } else {
    // Officers (Revenue, Registration, Municipal)
    navItems = [
      { name: 'Officer Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Parcel Search', path: '/search', icon: Search },
      { name: 'GIS Map', path: '/gis-map', icon: Layers },
      { name: 'AI Assistant', path: '/ai-assistant', icon: Cpu },
      { name: 'Change Monitoring', path: '/change-monitoring', icon: Satellite },
      { name: 'Service Requests Queue', path: '/service-requests', icon: FileCheck2 },
      { name: 'Officer Profile', path: '/profile', icon: User },
    ];
    governanceItems = [
      { name: 'Document Verification', path: '/document-verification', icon: FileText },
      { name: 'Land Sale / Transfer', path: '/land-transfer', icon: Repeat },
      { name: 'Parcel Subdivision', path: '/parcel-subdivision', icon: Scissors },
      { name: 'Blockchain Audit', path: '/blockchain-audit', icon: ShieldCheck },
    ];
  }

  const getPageTitle = () => {
    const all = [...navItems, ...governanceItems];
    const current = all.find((item) => location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)));
    if (location.pathname === '/' || location.pathname === '/dashboard') return `${user?.role || 'Land'} Governance Dashboard`;
    return current ? current.name : 'LandSetu Platform';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-950/50 border border-emerald-400/30">
              <Landmark className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-serif font-bold text-lg text-white tracking-tight">LandSetu</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-1.5 py-0.2 rounded border border-emerald-500/30">
                  DPI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Digital Public Infrastructure</p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Role Card inside Sidebar */}
        <div className="p-3.5 m-3 bg-slate-800 rounded-xl border border-slate-700 text-xs shadow-inner">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Authenticated Role</span>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
            >
              Switch Role
            </button>
          </div>
          <div className="font-bold text-white flex items-center space-x-1.5 text-sm">
            <User className="h-4 w-4 text-emerald-400" />
            <span className="truncate">{user?.role || 'Citizen'}</span>
          </div>
          <div className="text-[11px] text-slate-200 font-medium truncate mt-0.5">{user?.name || user?.username}</div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 text-xs">
          {/* Active Primary Navigation */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              {isCitizen ? 'Citizen Services' : isAdmin ? 'Admin Operations' : 'Departmental Tools'}
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm font-bold'
                          : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{item.name}</span>
                    </div>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Governance / Future Modules */}
          {governanceItems.length > 0 && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Governance Modules
              </div>
              <nav className="space-y-1">
                {governanceItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition ${
                          isActive ? 'bg-slate-800 text-emerald-300 font-bold border border-slate-700' : ''
                        }`
                      }
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{item.name}</span>
                      </div>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>


        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] text-slate-400 font-mono">DPI Layer Active</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition flex items-center gap-1 text-[11px]"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Sticky Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          {/* Left: Mobile Menu Trigger + Breadcrumb */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-500 hidden sm:inline">LandSetu</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 hidden sm:inline" />
              <h1 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Right: Quick Role Switcher + Auth Info */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium border border-slate-200/80 transition"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="hidden sm:inline text-slate-500">Role:</span>
              <strong className="text-slate-900">{user?.role || 'Citizen'}</strong>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 ml-1">
                Switch
              </span>
            </button>

            <Link
              to="/profile"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="My Profile"
            >
              <User className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content Router Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Global Footer with Single Standard Professional Data Disclaimer */}
        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Landmark className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-800">LandSetu</span>
              <span className="hidden md:inline">— One Parcel. One Identity. One Integrated Land Ecosystem.</span>
            </div>
            <div className="text-[11px] text-slate-500 text-center sm:text-right max-w-2xl">
              <strong>Data Disclaimer:</strong> The information displayed on LandSetu uses fictional data for demonstration purposes and does not represent actual land records, ownership details, government records, or official transactions.
            </div>
          </div>
        </footer>
      </div>

      {/* Global Login / Switch Persona Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
