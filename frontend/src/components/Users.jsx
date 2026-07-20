import { useState, useEffect } from 'react';
import {
  UserPlus,
  Shield,
  Mail,
  UserCheck,
  UserX,
  Loader2,
  Users as UsersIcon
} from 'lucide-react';
import { userService } from '../services/api';
import toast from 'react-hot-toast';

const Users = ({ isVapor, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list', 'add'

  // New User Form fields
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Sales Staff',
  });

  const roles = [
    'Administrator',
    'Admin',
    'Manager',
    'Sales Staff',
    'Purchase Staff',
    'Accountant',
    'Inventory Staff',
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers();
      setUsers(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to retrieve staff profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = () => {
    setForm({
      username: '',
      email: '',
      password: '',
      role: 'Sales Staff',
    });
    setView('add');
  };

  const handleFormChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username || !form.email || !form.password) {
      toast.error('Please enter all required fields');
      return;
    }

    try {
      await userService.createUser(form);
      toast.success('User account registered successfully!');
      setView('list');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user account');
      console.error(error);
    }
  };

  const handleToggleActive = async (user) => {
    // Prevent deactivating own account
    if (user.email === currentUser.email) {
      toast.error('You cannot deactivate your own account');
      return;
    }

    try {
      await userService.toggleUser(user._id);
      toast.success(`Account status for ${user.username} updated!`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle account status');
      console.error(error);
    }
  };

  // Styles configuration
  const cardClass = isVapor ? 'glass-panel shadow-glow-purple border-purple-500/10' : 'bg-white shadow-sm border-gray-200';
  const textClass = isVapor ? 'text-white' : 'text-gray-900';
  const subtextClass = isVapor ? 'text-purple-300' : 'text-gray-500';
  const tableHeaderClass = isVapor ? 'bg-purple-950/30 text-purple-200' : 'bg-gray-50 text-gray-500';
  const rowBorderClass = isVapor ? 'border-purple-950/40 hover:bg-white/[0.02]' : 'border-gray-200 hover:bg-gray-50';
  const inputClass = isVapor ? 'glass-input focus:ring-purple-500 rounded-lg p-2.5 text-sm bg-purple-950/20 text-purple-100 border-purple-800/40' : 'block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-pharmacy-500 focus:ring-pharmacy-500';

  if (view === 'add') {
    return (
      <div className="space-y-6 animate-fadeIn duration-500">
        {/* Breadcrumb / Back button */}
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setView('list')} 
            className={`p-2 rounded-xl border transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm ${
              isVapor 
                ? 'border-purple-800/40 bg-purple-950/20 text-purple-100 hover:bg-purple-900/30' 
                : 'border-gray-250 hover:bg-gray-50 hover:border-gray-305 text-gray-705 bg-white'
            }`}
          >
            ← Back to Directory
          </button>
        </div>

        {/* Page Card */}
        <div className={`border rounded-2xl shadow-sm overflow-hidden ${cardClass}`}>
          <div className="px-6 py-5 border-b border-gray-100/10 flex justify-between items-center bg-transparent">
            <h3 className={`text-xl font-bold flex items-center gap-2 ${textClass}`}>
              <UserPlus className={isVapor ? 'text-purple-400' : 'text-pharmacy-600'} />
              Register Staff Account
            </h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6 bg-transparent space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${textClass}`}>Username <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleFormChange}
                    required
                    className={inputClass}
                    placeholder="e.g. jdoe123"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${textClass}`}>Email Address <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    required
                    className={inputClass}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${textClass}`}>Assigned Role <span className="text-red-500">*</span></label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleFormChange}
                    className={inputClass}
                  >
                    {roles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${textClass}`}>Password <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleFormChange}
                    required
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100/10 bg-gray-50/5">
              <button
                type="button"
                onClick={() => setView('list')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn-primary ${isVapor ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}`}
              >
                Register Staff
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn duration-500">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${textClass}`}>Staff Directory</h2>
          <p className={`text-sm ${subtextClass}`}>Manage employee profiles, dashboard credentials, and application authorization roles.</p>
        </div>
        <button
          onClick={handleOpenModal}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all ${isVapor ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 shadow-glow-purple' : 'bg-pharmacy-600 hover:bg-pharmacy-500'}`}
        >
          <UserPlus size={16} />
          Register Staff Account
        </button>
      </div>

      {/* Main logs Table */}
      <div className={`overflow-hidden border rounded-xl ${cardClass}`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <Loader2 className={`h-8 w-8 animate-spin ${isVapor ? 'text-purple-500' : 'text-pharmacy-600'}`} />
            <span className={`text-sm ${subtextClass}`}>Retrieving employee ledger...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <UsersIcon size={48} className={`mx-auto mb-4 ${subtextClass}`} />
            <h3 className={`text-lg font-semibold ${textClass}`}>No Employees Enrolled</h3>
            <p className={`text-sm ${subtextClass} mt-1`}>All staff directory logins will appear here once accounts are registered.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/10 text-sm">
              <thead className={tableHeaderClass}>
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Email Contact</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Security Clearance</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wider">Authorization Status</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wider">Account Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/10">
                {users.map((u) => {
                  const isAdmin = u.role === 'Administrator' || u.role === 'Admin';
                  return (
                    <tr key={u._id} className={`transition-colors ${rowBorderClass}`}>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        <span className={textClass}>{u.username}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 ${subtextClass}`}>
                          <Mail size={14} className="opacity-60" />
                          {u.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${isAdmin ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-400'}`}>
                          <Shield size={12} />
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${u.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${u.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                        >
                          {u.isActive ? (
                            <span className="flex items-center justify-center gap-1"><UserX size={12} /> Deactivate</span>
                          ) : (
                            <span className="flex items-center justify-center gap-1"><UserCheck size={12} /> Activate</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
