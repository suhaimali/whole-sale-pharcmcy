import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Loader2,
  ArrowLeft,
  Tag,
  Briefcase,
  Save
} from 'lucide-react';
import { expenseService } from '../services/api';
import toast from 'react-hot-toast';

const Expenses = ({ _user }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Miscellaneous');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = ['Rent', 'Salaries', 'Electricity', 'Internet', 'Marketing', 'Maintenance', 'Miscellaneous'];

  const inputClass = 'block w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-pharmacy-500 focus:ring-2 focus:ring-pharmacy-500/20 focus:outline-none transition-colors';

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await expenseService.getExpenses();
      setExpenses(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setCategory('Miscellaneous');
    setExpenseDate(new Date().toISOString().split('T')[0]);
  };

  const handleOpenForm = () => {
    resetForm();
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !amount) {
      toast.error('Please complete title and amount fields');
      return;
    }
    try {
      setSaving(true);
      await expenseService.createExpense({
        title,
        amount: Number(amount),
        category,
        expenseDate,
      });
      toast.success('Expense recorded successfully!');
      setShowForm(false);
      resetForm();
      fetchExpenses();
    } catch (error) {
      console.error(error);
      toast.error('Failed to record expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this expense record?')) {
      try {
        await expenseService.deleteExpense(id);
        toast.success('Expense record deleted');
        fetchExpenses();
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete expense record');
      }
    }
  };

  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const getCategoryBadge = (cat) => {
    const map = {
      'Rent': 'bg-amber-100 text-amber-800',
      'Salaries': 'bg-purple-100 text-purple-800',
      'Electricity': 'bg-yellow-100 text-yellow-800',
      'Internet': 'bg-sky-100 text-sky-800',
      'Marketing': 'bg-pink-100 text-pink-800',
      'Maintenance': 'bg-orange-100 text-orange-800',
    };
    return map[cat] || 'bg-gray-100 text-gray-800';
  };

  // ===== FORM PAGE VIEW =====
  if (showForm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fadeIn px-4">
        {/* Back Button */}
        <div className="w-full max-w-2xl mb-4">
          <button
            onClick={handleCancel}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900 flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft size={14} /> Back to Expenses
          </button>
        </div>

        {/* Centered Form Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden w-full max-w-2xl">
          {/* Card Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-50 text-red-500 mb-3">
              <DollarSign size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Record Business Expense</h2>
            <p className="text-sm text-gray-500 mt-1">Log a new overhead cost for your business.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Expense Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Expense Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Warehouse electricity bill"
                required
                autoFocus
                className={inputClass}
              />
            </div>

            {/* Amount + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expense Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Actions — centered */}
            <div className="flex items-center justify-center gap-3 pt-3 border-t border-gray-100">
              <button type="button" onClick={handleCancel} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ===== LIST PAGE VIEW =====
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Expenses Tracker</h2>
          <p className="text-sm text-gray-500">Track daily operational overheads, salaries, rent, and utilities.</p>
        </div>
        <button onClick={handleOpenForm} className="btn-primary">
          <Plus size={16} />
          Record Expense
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Expenses</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className="p-3 rounded-xl bg-red-50 text-red-500">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Expenses Count</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{expenses.length} Records</h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-500">
            <Briefcase size={24} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Avg. Expense</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              ${expenses.length > 0 ? (totalExpense / expenses.length).toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0.00'}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-orange-50 text-orange-500">
            <Tag size={24} />
          </div>
        </div>
      </div>

      {/* Expense Ledger Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-pharmacy-600" />
            <span className="text-sm text-gray-500">Retrieving expenses...</span>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900">No Expenses Recorded</h3>
            <p className="text-sm text-gray-500 mt-1">Start logging your business overhead expenses here.</p>
            <button onClick={handleOpenForm} className="btn-primary mt-4">
              <Plus size={16} /> Record First Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Expense Details</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Recorded By</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{e.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getCategoryBadge(e.category)}`}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">
                      -${e.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-gray-500 text-xs">
                        <Calendar size={12} />
                        <span>{new Date(e.expenseDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-medium text-gray-600">
                      {e.recordedBy}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(e._id)}
                        title="Delete record"
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
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

export default Expenses;
