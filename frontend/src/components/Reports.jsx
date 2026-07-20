import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Loader2,
  Clock,
  ArrowRightLeft
} from 'lucide-react';
import { saleService, purchaseService, expenseService } from '../services/api';
import toast from 'react-hot-toast';

const Reports = ({ _isVapor, _user }) => {
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, purRes, expRes] = await Promise.all([
        saleService.getSales(),
        purchaseService.getPurchases(),
        expenseService.getExpenses()
      ]);
      setSales(salesRes.data);
      setPurchases(purRes.data);
      setExpenses(expRes.data);
    } catch (error) {
      console.error(error);
      const msg = error?.response?.data?.message || error.message || 'Unknown error';
      toast.error(`Failed to load transaction reports: ${msg}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  // Calculations
  const revenue = sales
    .filter((s) => s.type === 'Invoice')
    .reduce((sum, s) => sum + s.totalAmount, 0);

  const totalPurchases = purchases
    .filter((p) => p.type === 'Bill' && p.status === 'Received')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const netProfit = revenue - totalPurchases - totalExpenses;

  // Build Chronological Timeline (Bill History)
  const timeline = [];

  sales.forEach((s) => {
    timeline.push({
      id: s._id,
      date: new Date(s.createdAt),
      number: s.invoiceNumber,
      type: s.type || 'Invoice',
      displayType: 
        s.type === 'Return' ? 'Sales Return' :
        s.type === 'Estimate' ? 'Quotation' :
        s.type === 'Order' ? 'Sales Order' :
        s.type === 'Challan' ? 'Delivery Challan' : 'Sales Invoice',
      party: s.customerName,
      amount: s.totalAmount,
      status: s.paymentStatus || 'Paid',
      original: s,
      entity: 'sale'
    });
  });

  purchases.forEach((p) => {
    timeline.push({
      id: p._id,
      date: new Date(p.createdAt),
      number: p.purchaseOrderNumber,
      type: p.type || 'Bill',
      displayType: 
        p.type === 'Return' ? 'Purchase Return' :
        p.type === 'Order' ? 'Purchase Order' : 'Purchase Bill',
      party: p.supplierName,
      amount: p.totalAmount,
      status: p.status,
      original: p,
      entity: 'purchase'
    });
  });

  expenses.forEach((e) => {
    timeline.push({
      id: e._id,
      date: new Date(e.expenseDate),
      number: `EXP-${e._id.substring(e._id.length - 4).toUpperCase()}`,
      type: 'Expense',
      displayType: `Expense (${e.category})`,
      party: e.title,
      amount: e.amount,
      status: 'Paid',
      original: e,
      entity: 'expense'
    });
  });

  // Sort timeline chronologically descending
  const sortedTimeline = timeline.sort((a, b) => b.date - a.date);

  const cardClass = 'bg-white shadow-sm border-gray-200';
  const textClass = 'text-gray-900';
  const subtextClass = 'text-gray-500';

  // ─── MAIN LIST VIEW ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fadeIn duration-500 relative">
      {/* Header Panel */}
      <div className="flex flex-col gap-2">
        <h2 className={`text-2xl font-bold tracking-tight ${textClass}`}>Reports & Bill History</h2>
        <p className={`text-sm ${subtextClass}`}>Overview cashflow performance metrics, profit statements, and complete transaction timeline.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-pharmacy-600" />
          <span className={`text-sm ${subtextClass}`}>Loading financial reports...</span>
        </div>
      ) : (
        <>
          {/* Key Financial stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className={`p-5 rounded-xl border flex items-center justify-between ${cardClass}`}>
              <div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>Total Revenue</span>
                <h3 className="text-xl font-extrabold text-green-600">${revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="p-2.5 rounded-lg bg-green-50 text-green-600"><TrendingUp size={20} /></div>
            </div>

            <div className={`p-5 rounded-xl border flex items-center justify-between ${cardClass}`}>
              <div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>Inventory Procures</span>
                <h3 className={`text-xl font-extrabold ${textClass}`}>${totalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600"><ShoppingBag size={20} /></div>
            </div>

            <div className={`p-5 rounded-xl border flex items-center justify-between ${cardClass}`}>
              <div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>Overhead Expenses</span>
                <h3 className={`text-xl font-extrabold ${textClass}`}>${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="p-2.5 rounded-lg bg-red-50 text-red-600"><TrendingDown size={20} /></div>
            </div>

            <div className={`p-5 rounded-xl border flex items-center justify-between ${cardClass}`}>
              <div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>Net Profit</span>
                <h3 className={`text-xl font-extrabold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className={`p-2.5 rounded-lg ${netProfit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <DollarSign size={20} />
              </div>
            </div>
          </div>

          {/* Timeline Table */}
          <div className={`p-5 rounded-xl border ${cardClass} flex flex-col`}>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <h3 className={`font-bold text-sm uppercase tracking-wider ${subtextClass} flex items-center gap-2`}>
                <Clock size={16} className="text-gray-400" /> Transactional Bill History
              </h3>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                {sortedTimeline.length} Entries
              </span>
            </div>
            <div className="overflow-x-auto">
              {sortedTimeline.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ArrowRightLeft size={36} className="text-gray-300 mb-2" />
                  <span className="text-xs font-semibold text-gray-500">No transaction logs available</span>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-100 z-10">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Doc Number</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Party</th>
                      <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {sortedTimeline.map((item) => (
                      <tr key={`${item.entity}-${item.id}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-gray-900 font-mono text-sm">{item.number}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-900 font-medium text-sm">{item.party}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${
                            item.entity === 'sale'
                              ? (item.type === 'Return' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700')
                              : (item.entity === 'purchase' ? (item.type === 'Return' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700') : 'bg-gray-100 text-gray-700')
                          }`}>{item.displayType}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                          {item.date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`font-bold text-base ${item.entity === 'sale' && item.type !== 'Return' ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {item.entity === 'sale' && item.type !== 'Return' ? '+' : '-'}₹{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;

