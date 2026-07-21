import { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  IndianRupee,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  ChevronLeft,
  Save,
  Edit2
} from 'lucide-react';
import { cashService } from '../services/api';
import toast from 'react-hot-toast';

const CashBook = ({ _isVapor, _user }) => {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // view: 'list' | 'transaction'
  const [view, setView] = useState('list');
  const [modalType, setModalType] = useState('Cash In'); // 'Cash In' or 'Cash Out'
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Deposit'); // 'Deposit' or 'Withdrawal'
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const fetchCashData = async () => {
    try {
      setLoading(true);
      const res = await cashService.getCashTransactions();
      setTransactions(res.data.transactions);
      setBalance(res.data.balance);
    } catch (error) {
      console.error(error);
      toast.error('Failed to retrieve cash ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashData();
  }, []);

  const handleOpenTransactionPage = (type, tx = null) => {
    setModalType(type);
    if (tx) {
      setSource(tx.source);
      setAmount(tx.amount);
      setReferenceNumber(tx.referenceNumber || '');
      setNotes(tx.notes || '');
      setEditingId(tx._id);
    } else {
      setSource(type === 'Cash In' ? 'Deposit' : 'Withdrawal');
      setAmount('');
      setReferenceNumber('');
      setNotes('');
      setEditingId(null);
    }
    setView('transaction');
  };

  const handleCancel = () => {
    setEditingId(null);
    setView('list');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const payload = {
        txType: modalType,
        amount: Number(amount),
        source,
        referenceNumber,
        notes,
      };

      if (editingId) {
        await cashService.updateCashTransaction(editingId, payload);
        toast.success(`${modalType} successfully updated!`);
      } else {
        await cashService.createCashTransaction(payload);
        toast.success(`${modalType} successfully logged!`);
      }
      setEditingId(null);
      setView('list');
      fetchCashData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to register cash transaction');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this cash transaction log?')) {
      try {
        await cashService.deleteCashTransaction(id);
        toast.success('Cash log removed');
        fetchCashData();
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete cash transaction');
      }
    }
  };

  // Calculations
  const cashInTotal = transactions
    .filter((tx) => tx.txType === 'Cash In')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const cashOutTotal = transactions
    .filter((tx) => tx.txType === 'Cash Out')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const cardClass = 'bg-white shadow-sm border-gray-200';
  const textClass = 'text-gray-900';
  const subtextClass = 'text-gray-500';
  const inputClass = 'block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-pharmacy-500 focus:ring-2 focus:ring-pharmacy-500/20 focus:outline-none transition-colors';

  // ─── TRANSACTION RECORDING PAGE (CENTERED) ──────────────────────────────────
  if (view === 'transaction') {
    return (
      <div className="flex flex-col items-center py-8 min-h-[70vh] animate-fadeIn px-4 sm:px-0">
        {/* Back Button */}
        <div className="w-full max-w-md mb-4">
          <button
            onClick={handleCancel}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-semibold text-gray-700 flex items-center gap-1.5 bg-white shadow-sm"
          >
            <ChevronLeft size={14} /> Back to Cash Book
          </button>
        </div>

        {/* Centered Form Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden w-full max-w-md">
          {/* Card Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3 ${
              modalType === 'Cash In' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <IndianRupee size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Edit' : 'Record'} {modalType}</h3>
            <p className="text-sm text-gray-500 mt-1">{editingId ? 'Update this manual transaction record.' : 'Log a manual transaction to reconcile your cash book.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-700">Amount (₹) <span className="text-red-500">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-700">Action Source / Category</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className={inputClass}
              >
                {modalType === 'Cash In' ? (
                  <>
                    <option value="Deposit">Deposit (Safe Transfer)</option>
                    <option value="Sale">Sale Payment (Manual)</option>
                  </>
                ) : (
                  <>
                    <option value="Withdrawal">Withdrawal (To Safe / Bank)</option>
                    <option value="Purchase">Purchase Bill (Manual)</option>
                    <option value="Expense">Office Expense (Manual)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-700">Reference Code / Safe Link</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. SAFE-FLOW-001"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-700">Notes / Purpose Details</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe where the cash is going or coming from..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex justify-center gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn-primary ${
                  modalType === 'Cash In' ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-600' : 'bg-rose-600 hover:bg-rose-500 border-rose-600'
                }`}
              >
                <Save size={14} />
                {editingId ? `Update ${modalType}` : `Confirm ${modalType}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fadeIn duration-500">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${textClass}`}>Cash Book Ledger</h2>
          <p className={`text-sm ${subtextClass}`}>Manage cash safe boxes, track cash-in-hand transactions, and reconcile drawer float.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => handleOpenTransactionPage('Cash In')}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all bg-emerald-600 hover:bg-emerald-500"
          >
            <Plus size={14} />
            Cash Deposit (In)
          </button>
          <button
            onClick={() => handleOpenTransactionPage('Cash Out')}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all bg-rose-600 hover:bg-rose-50"
            style={{ backgroundColor: '#e11d48' }} // Rose-600 override
          >
            <Minus size={14} />
            Cash Withdrawal (Out)
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className={`p-6 rounded-xl border flex items-center justify-between ${cardClass}`}>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>Cash in Hand</span>
            <h3 className={`text-3xl font-extrabold mt-1 ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ₹{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className={`p-3 rounded-lg ${balance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <IndianRupee size={26} />
          </div>
        </div>

        <div className={`p-6 rounded-xl border flex items-center justify-between ${cardClass}`}>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>Total Cash Inflow</span>
            <h3 className="text-2xl font-extrabold mt-1 text-emerald-600">
              +₹{cashInTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <ArrowDownLeft size={24} />
          </div>
        </div>

        <div className={`p-6 rounded-xl border flex items-center justify-between ${cardClass}`}>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${subtextClass}`}>Total Cash Outflow</span>
            <h3 className="text-2xl font-extrabold mt-1 text-rose-600">
              -₹{cashOutTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-3 rounded-lg bg-rose-50 text-rose-600">
            <ArrowUpRight size={24} />
          </div>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className={`overflow-hidden border rounded-xl ${cardClass}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className={`font-bold text-sm uppercase tracking-wider ${subtextClass} flex items-center gap-2`}>
            <Clock size={16} />
            Cash Flow Audit History
          </h3>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            {transactions.length} records
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-pharmacy-600" />
            <span className={`text-sm ${subtextClass}`}>Loading cash records...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <Clock size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className={`text-lg font-semibold ${textClass}`}>No Transactions Found</h3>
            <p className={`text-sm ${subtextClass} mt-1`}>All POS cash receipts or safe additions will register here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider">Date / Time</th>
                  <th className="px-6 py-3.5 text-center font-bold uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3.5 text-center font-bold uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider">Ref / Purpose</th>
                  <th className="px-6 py-3.5 text-center font-bold uppercase tracking-wider">Cashier</th>
                  <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3.5 text-center font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="transition-colors border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-xs text-gray-600 font-medium">
                      {new Date(tx.createdAt || tx.expenseDate).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center justify-center gap-1 mx-auto w-24 ${
                        tx.txType === 'Cash In' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {tx.txType === 'Cash In' ? <Plus size={10} /> : <Minus size={10} />}
                        {tx.txType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        tx.source === 'Sale' ? 'bg-green-50 text-green-700 border border-green-200' :
                        tx.source === 'Purchase' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        tx.source === 'Expense' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>{tx.source}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        {tx.referenceNumber && <span className="font-semibold text-gray-900 font-mono text-xs">{tx.referenceNumber}</span>}
                        <span className={`text-xs ${subtextClass} truncate max-w-xs`}>{tx.notes}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-700 text-xs">
                      {tx.recordedBy}
                    </td>
                    <td className={`px-6 py-4 text-right font-extrabold ${
                      tx.txType === 'Cash In' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {tx.txType === 'Cash In' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenTransactionPage(tx.txType, tx)}
                          title="Edit cash entry"
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx._id)}
                          title="Delete cash entry"
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashBook;
