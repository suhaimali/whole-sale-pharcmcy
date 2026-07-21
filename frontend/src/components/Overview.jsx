import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  AlertTriangle,
  Calendar,
  AlertCircle,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { productService, saleService, purchaseService } from '../services/api';
import toast from 'react-hot-toast';

const Overview = ({ isVapor, user }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    inventoryValue: 0,
    pendingPurchases: 0,
    lowStockCount: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, saleRes, purRes] = await Promise.all([
          productService.getProducts(),
          saleService.getSales(),
          purchaseService.getPurchases(),
        ]);

        const products = prodRes.data;
        const sales = saleRes.data;
        const purchases = purRes.data;

        // Calculate statistics
        const totalSalesSum = sales.reduce((sum, s) => sum + s.totalAmount, 0);
        const invVal = products.reduce((sum, p) => sum + p.quantity * p.price, 0);
        const pendingPur = purchases.filter(
          (p) => p.status === 'Ordered' || p.paymentStatus === 'Pending'
        ).length;
        const lowStock = products.filter((p) => p.quantity <= 15);

        setStats({
          totalSales: totalSalesSum,
          inventoryValue: invVal,
          pendingPurchases: pendingPur,
          lowStockCount: lowStock.length,
        });

        setLowStockProducts(lowStock.slice(0, 5));

        // Expiring products (within 3 months or already expired)
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        const expiring = products
          .filter((p) => p.expiryDate && new Date(p.expiryDate) <= threeMonthsFromNow)
          .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
          .slice(0, 5);
        setExpiringProducts(expiring);

        // Chart Data: Group sales & purchases by date (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const dailyData = last7Days.map((date) => {
          const dateSales = sales
            .filter((s) => s.createdAt && s.createdAt.startsWith(date))
            .reduce((sum, s) => sum + s.totalAmount, 0);

          const datePurchases = purchases
            .filter((p) => p.createdAt && p.createdAt.startsWith(date))
            .reduce((sum, p) => sum + p.totalAmount, 0);

          const displayDate = new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          return {
            date: displayDate,
            Sales: Number(dateSales.toFixed(2)),
            Purchases: Number(datePurchases.toFixed(2)),
          };
        });

        setChartData(dailyData);

        // Pie Data: Group products quantity by Category
        const categories = {};
        products.forEach((p) => {
          categories[p.category] = (categories[p.category] || 0) + p.quantity;
        });

        const formattedPie = Object.keys(categories).map((cat) => ({
          name: cat,
          value: categories[cat],
        }));

        setPieData(formattedPie.length ? formattedPie : [{ name: 'Empty', value: 0 }]);
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        toast.error('Failed to retrieve dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-purple-600 border-purple-200"></div>
      </div>
    );
  }

  // Theme configuration
  const cardBgClass = isVapor ? 'glass-panel shadow-glow-purple border-purple-500/10' : 'bg-white border-gray-100 shadow-sm';
  const labelTextClass = isVapor ? 'text-purple-300' : 'text-gray-500';
  const valueTextClass = isVapor ? 'text-white' : 'text-gray-900';

  const PIE_COLORS = isVapor
    ? ['#a78bfa', '#f472b6', '#22d3ee', '#34d399'] // Vapor colors: violet, pink, cyan, green
    : ['#3b82f6', '#10b981', '#f59e0b', '#ec4899']; // Classic colors: blue, green, yellow, pink

  return (
    <div className="space-y-8 animate-fadeIn duration-500">
      {/* Welcome banner */}
      <div className="p-6 rounded-2xl border bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent">
        <h2 className="text-2xl font-extrabold tracking-tight">
          Hello, {user.username}!
        </h2>
        <p className="mt-1 text-sm text-blue-100">
          Welcome to your overview of the Suhaim Soft ERP. System is running healthy.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Sales Card */}
        <div className={`p-6 rounded-xl border flex items-center justify-between ${cardBgClass} transition-all duration-300 hover:scale-[1.02]`}>
          <div className="space-y-1">
            <span className={`text-xs font-semibold uppercase tracking-wider ${labelTextClass}`}>Total Sales</span>
            <h3 className={`text-2xl font-bold ${valueTextClass}`}>₹{stats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
          <div className={`p-3 rounded-lg ${isVapor ? 'bg-purple-950/50 text-purple-400 border border-purple-500/30' : 'bg-blue-50 text-blue-600'}`}>
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Inventory Card */}
        <div className={`p-6 rounded-xl border flex items-center justify-between ${cardBgClass} transition-all duration-300 hover:scale-[1.02]`}>
          <div className="space-y-1">
            <span className={`text-xs font-semibold uppercase tracking-wider ${labelTextClass}`}>Stock Value</span>
            <h3 className={`text-2xl font-bold ${valueTextClass}`}>₹{stats.inventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
          <div className={`p-3 rounded-lg ${isVapor ? 'bg-pink-950/50 text-pink-400 border border-pink-500/30' : 'bg-green-50 text-green-600'}`}>
            <Package size={24} />
          </div>
        </div>

        {/* Purchases Card */}
        <div className={`p-6 rounded-xl border flex items-center justify-between ${cardBgClass} transition-all duration-300 hover:scale-[1.02]`}>
          <div className="space-y-1">
            <span className={`text-xs font-semibold uppercase tracking-wider ${labelTextClass}`}>Active Orders</span>
            <h3 className={`text-2xl font-bold ${valueTextClass}`}>{stats.pendingPurchases} POs</h3>
          </div>
          <div className={`p-3 rounded-lg ${isVapor ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-500/30' : 'bg-yellow-50 text-yellow-600'}`}>
            <ShoppingCart size={24} />
          </div>
        </div>

        {/* Low Stock Card */}
        <div className={`p-6 rounded-xl border flex items-center justify-between ${cardBgClass} transition-all duration-300 hover:scale-[1.02]`}>
          <div className="space-y-1">
            <span className={`text-xs font-semibold uppercase tracking-wider ${labelTextClass}`}>Low Stock Alerts</span>
            <h3 className={`text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-red-500 font-extrabold' : valueTextClass}`}>{stats.lowStockCount} Items</h3>
          </div>
          <div className={`p-3 rounded-lg ${stats.lowStockCount > 0 ? 'bg-red-950/50 text-red-400 border border-red-500/30 animate-pulse' : (isVapor ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30' : 'bg-red-50 text-red-600')}`}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Trend Chart */}
        <div className={`p-6 rounded-xl border lg:col-span-2 ${cardBgClass}`}>
          <div className="flex items-center gap-2 mb-6">
            <Activity size={20} className={isVapor ? 'text-purple-400' : 'text-blue-600'} />
            <h4 className={`font-bold ${valueTextClass}`}>Cashflow Trend (Last 7 Days)</h4>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isVapor ? '#8b5cf6' : '#3b82f6'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={isVapor ? '#8b5cf6' : '#3b82f6'} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="purGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isVapor ? '#ec4899' : '#10b981'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={isVapor ? '#ec4899' : '#10b981'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isVapor ? 'rgba(139,92,246,0.1)' : '#e5e7eb'} />
                <XAxis dataKey="date" stroke={isVapor ? '#a78bfa' : '#6b7280'} tick={{ fontSize: 11 }} />
                <YAxis stroke={isVapor ? '#a78bfa' : '#6b7280'} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={
                    isVapor
                      ? { background: '#1c1936', border: '1px solid rgba(139,92,246,0.4)', borderRadius: '8px', color: '#f3e8ff' }
                      : { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }
                  }
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area type="monotone" dataKey="Sales" stroke={isVapor ? '#8b5cf6' : '#3b82f6'} strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="Purchases" stroke={isVapor ? '#ec4899' : '#10b981'} strokeWidth={2.5} fillOpacity={1} fill="url(#purGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className={`p-6 rounded-xl border ${cardBgClass}`}>
          <div className="flex items-center gap-2 mb-6">
            <Package size={20} className={isVapor ? 'text-pink-400' : 'text-green-600'} />
            <h4 className={`font-bold ${valueTextClass}`}>Inventory Distribution</h4>
          </div>
          <div className="h-72 flex flex-col justify-between">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={
                      isVapor
                        ? { background: '#1c1936', border: '1px solid rgba(139,92,246,0.4)', borderRadius: '8px', color: '#f3e8ff' }
                        : { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom legends list */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {pieData.map((d, index) => (
                <div key={d.name} className="flex items-center gap-1.5 font-medium">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  ></span>
                  <span className={`truncate ${isVapor ? 'text-purple-200' : 'text-gray-600'}`}>{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alert Listings: Low stock & Upcoming Expiries */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Low Stock Warning List */}
        <div className={`p-6 rounded-xl border ${cardBgClass}`}>
          <div className="flex items-center gap-2 mb-4 border-b pb-3 border-gray-100 dark:border-purple-500/10">
            <AlertTriangle className="text-red-500" size={20} />
            <h4 className={`font-bold ${valueTextClass}`}>Low Stock Operations Alert</h4>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className={`text-sm ${isVapor ? 'text-purple-300/60' : 'text-gray-400'} py-4 text-center`}>All items are adequately stocked.</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((p) => (
                <div key={p._id} className={`flex items-center justify-between p-3 rounded-lg border ${isVapor ? 'bg-purple-950/20 border-red-500/20 hover:border-red-500/40' : 'bg-red-50/50 border-red-100 hover:border-red-200'} transition-all`}>
                  <div>
                    <h5 className={`text-sm font-semibold ${valueTextClass}`}>{p.name}</h5>
                    <p className={`text-xs ${labelTextClass}`}>SKU: {p.sku} | Category: {p.category}</p>
                  </div>
                  <span className="text-xs font-extrabold text-red-500 bg-red-100 dark:bg-red-950/60 dark:text-red-400 px-2.5 py-1.5 rounded-full">
                    {p.quantity} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiring Soon List */}
        <div className={`p-6 rounded-xl border ${cardBgClass}`}>
          <div className="flex items-center gap-2 mb-4 border-b pb-3 border-gray-100 dark:border-purple-500/10">
            <Calendar className="text-orange-500" size={20} />
            <h4 className={`font-bold ${valueTextClass}`}>Near Expiry Tracking</h4>
          </div>
          {expiringProducts.length === 0 ? (
            <p className={`text-sm ${isVapor ? 'text-purple-300/60' : 'text-gray-400'} py-4 text-center`}>No products expiring in the near future.</p>
          ) : (
            <div className="space-y-3">
              {expiringProducts.map((p) => {
                const isExpired = new Date(p.expiryDate) < new Date();
                return (
                  <div key={p._id} className={`flex items-center justify-between p-3 rounded-lg border ${isVapor ? 'bg-purple-950/20 border-orange-500/20 hover:border-orange-500/40' : 'bg-orange-50/50 border-orange-100 hover:border-orange-200'} transition-all`}>
                    <div>
                      <h5 className={`text-sm font-semibold ${valueTextClass}`}>{p.name}</h5>
                      <p className={`text-xs ${labelTextClass}`}>Batch: {p.batchNumber || 'N/A'} | Supplier: {p.supplier || 'N/A'}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1 ${isExpired ? 'text-red-500 bg-red-100 dark:bg-red-950/60' : 'text-orange-600 bg-orange-100 dark:bg-orange-950/60 dark:text-orange-400'}`}>
                      <AlertCircle size={12} />
                      {isExpired ? 'Expired' : new Date(p.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
