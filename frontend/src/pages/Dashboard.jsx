import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LogOut,
  LayoutDashboard,
  Pill,
  ShoppingCart,
  Package,
  FileText,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

// Sub-components
import Overview from '../components/Overview';
import Inventory from '../components/Inventory';
import Sales from '../components/Sales';
import Purchases from '../components/Purchases';
import Expenses from '../components/Expenses';
import Reports from '../components/Reports';
import CashBook from '../components/CashBook';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (!user) return null;

  // Role Access configuration
  const hasAccess = (allowedRoles) => {
    return allowedRoles.includes(user.role);
  };

  // Define sidebar navigation items with role-access constraints
  const navigationItems = [
    {
      id: 'overview',
      name: 'Overview Dashboard',
      icon: LayoutDashboard,
      roles: ['Administrator', 'Admin', 'Manager', 'Sales Staff', 'Purchase Staff', 'Accountant', 'Inventory Staff'],
    },
    {
      id: 'inventory',
      name: 'Inventory System',
      icon: Package,
      roles: ['Administrator', 'Admin', 'Manager', 'Sales Staff', 'Purchase Staff', 'Inventory Staff'],
    },
    {
      id: 'sales',
      name: 'POS Invoicing',
      icon: ShoppingCart,
      roles: ['Administrator', 'Admin', 'Manager', 'Sales Staff'],
    },
    {
      id: 'purchases',
      name: 'Replenishments',
      icon: FileText,
      roles: ['Administrator', 'Admin', 'Manager', 'Purchase Staff'],
    },
    {
      id: 'expenses',
      name: 'Expenses Tracker',
      icon: Briefcase,
      roles: ['Administrator', 'Admin', 'Manager', 'Accountant'],
    },
    {
      id: 'reports',
      name: 'Reports & History',
      icon: TrendingUp,
      roles: ['Administrator', 'Admin', 'Manager', 'Accountant'],
    },
    {
      id: 'cashbook',
      name: 'Cash Book Flow',
      icon: DollarSign,
      roles: ['Administrator', 'Admin', 'Manager', 'Accountant'],
    },
  ];

  // Filter items based on logged-in user role
  const allowedNavItems = navigationItems.filter((item) => hasAccess(item.roles));

  // Auto fallback active tab if current user role does not have access
  const isCurrentTabAllowed = allowedNavItems.some((item) => item.id === activeTab);
  if (!isCurrentTabAllowed && allowedNavItems.length > 0) {
    setActiveTab(allowedNavItems[0].id);
  }

  // Render view matching selected tab
  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview': return <Overview user={user} />;
      case 'inventory': return <Inventory user={user} />;
      case 'sales': return <Sales user={user} />;
      case 'purchases': return <Purchases user={user} />;
      case 'expenses': return <Expenses user={user} />;
      case 'reports': return <Reports user={user} />;
      case 'cashbook': return <CashBook user={user} />;
      default: return <Overview user={user} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-gray-50 text-gray-900">
      
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 z-30 flex items-center justify-between px-6 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white bg-pharmacy-600">
            <Pill size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-1.5">
            Suhaim Soft ERP
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* User profile metadata */}
          <div className="hidden md:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border bg-gray-100 border-gray-200 text-gray-700">
            <ShieldCheck size={14} className="text-pharmacy-600" />
            <span className="font-bold">{user.username}</span>
            <span className="opacity-50">|</span>
            <span className="font-medium truncate max-w-[80px]">{user.role}</span>
          </div>
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-semibold transition-all border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            title="Logout"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main workspace layout */}
      <div className="flex-1 flex pt-16">
        
        {/* Sidebar Nav */}
        <aside className="fixed top-16 bottom-0 left-0 w-64 z-20 hidden md:flex flex-col justify-between py-6 px-4 bg-white border-r border-gray-200">
          <div className="space-y-6">
            <span className="text-[10px] font-bold uppercase tracking-wider pl-2 text-gray-500">
              Enterprise Modules
            </span>

            <nav className="space-y-1.5">
              {allowedNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${isActive ? 'bg-pharmacy-50 text-pharmacy-700 border-l-4 border-pharmacy-600' : 'text-gray-600 hover:bg-gray-100 border-l-4 border-transparent'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={18}
                        className={`transition-colors ${isActive ? 'text-pharmacy-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                      />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight
                      size={14}
                      className={`opacity-0 group-hover:opacity-100 transition-all text-gray-400 ${isActive ? 'translate-x-0.5 opacity-100 text-pharmacy-400' : ''}`}
                    />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer brand details */}
          <div className="px-2 pt-4 border-t border-gray-100 text-[10px] text-gray-400">
            <div>Suhaim Soft &copy; 2026</div>
            <div className="mt-0.5 truncate font-mono">Role: {user.role}</div>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 min-w-0 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>

        {/* Bottom Nav Bar for Mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-30 flex justify-around items-center px-2 shadow-lg">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            // Clean up name for short display
            const displayName = 
              item.id === 'overview' ? 'Home' :
              item.id === 'inventory' ? 'Inventory' :
              item.id === 'sales' ? 'Billing' :
              item.id === 'purchases' ? 'Procure' :
              item.id === 'expenses' ? 'Expenses' :
              item.id === 'reports' ? 'Reports' :
              item.id === 'cashbook' ? 'Cash' :
              item.name;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition-all ${
                  isActive ? 'text-pharmacy-600' : 'text-gray-500'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-pharmacy-600' : 'text-gray-400'} />
                <span className="mt-1">{displayName}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

