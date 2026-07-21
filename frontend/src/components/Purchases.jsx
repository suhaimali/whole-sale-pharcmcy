import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Tag,
  Loader2,
  FileText,
  IndianRupee,
  History,
  RotateCcw,
  Filter,
  PlusCircle,
  Package,
  ChevronLeft,
  Edit
} from 'lucide-react';
import { purchaseService, productService } from '../services/api';
import toast from 'react-hot-toast';

const Purchases = ({ _isVapor, _user }) => {
  const [activeSubTab, setActiveSubTab] = useState('bills');
  const [purchases, setPurchases] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historySearch, setHistorySearch] = useState('');
  const [historyType, setHistoryType] = useState('');

  // view: 'list' | 'create' | 'payment' | 'quickadd'
  const [view, setView] = useState('list');
  const [modalDocType, setModalDocType] = useState('Bill');
  const [editId, setEditId] = useState(null);

  // Create Document form state
  const [supplierName, setSupplierName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [poStatus, setPoStatus] = useState('Received');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [items, setItems] = useState([{
    name: '', category: 'Medicines', quantity: '', costPrice: '', price: '',
    batchNumber: '', expiryDate: '',
  }]);

  // Payment Out state
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [collectMethod, setCollectMethod] = useState('Cash');

  // Quick Add New Item state
  const [quickForm, setQuickForm] = useState({
    name: '', sku: '', category: 'Medicines', unit: 'Piece',
    quantity: '100', costPrice: '', price: '',
  });

  const categories = ['Medicines', 'OTC Drugs', 'Surgicals', 'Vapes & Devices'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purchRes, prodRes] = await Promise.all([
        purchaseService.getPurchases(),
        productService.getProducts(),
      ]);
      setPurchases(purchRes.data);
      setProductsList(prodRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load procurement records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setSupplierName('');
    setPaymentStatus('Pending');
    setPaymentMethod('Cash');
    setPoStatus('Received');
    setReferenceNumber('');
    setItems([{ name: '', category: 'Medicines', quantity: '', costPrice: '', price: '', batchNumber: '', expiryDate: '' }]);
  };

  const openCreatePage = (docType) => {
    setModalDocType(docType);
    resetForm();
    setEditId(null);
    setView('create');
  };

  const openPaymentPage = (p) => {
    setPaymentTarget(p);
    setCollectMethod('Cash');
    setView('payment');
  };

  const openQuickAddPage = () => {
    setQuickForm({ name: '', sku: '', category: 'Medicines', unit: 'Piece', quantity: '100', costPrice: '', price: '' });
    setView('quickadd');
  };

  const handleAddItemRow = () => {
    setItems([...items, { name: '', category: 'Medicines', quantity: '', costPrice: '', price: '', batchNumber: '', expiryDate: '' }]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) { toast.error('At least one item is required'); return; }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'name') {
      const match = productsList.find((p) => p.name.toLowerCase() === value.toLowerCase());
      if (match) {
        updated[index].category = match.category;
        updated[index].costPrice = match.costPrice;
        updated[index].price = match.price;
        updated[index].batchNumber = match.batchNumber || '';
        updated[index].expiryDate = match.expiryDate ? new Date(match.expiryDate).toISOString().split('T')[0] : '';
      }
    }
    setItems(updated);
  };

  const orderTotal = items.reduce((sum, item) => sum + (Number(item.costPrice) || 0) * (Number(item.quantity) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierName.trim()) { toast.error('Please enter supplier name'); return; }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name || !item.quantity || !item.costPrice || !item.price) {
        toast.error(`Complete all fields in item row ${i + 1}`);
        return;
      }
    }
    const payload = {
      supplierName,
      type: modalDocType,
      referenceNumber: (modalDocType === 'Return' || modalDocType === 'DebitNote') ? referenceNumber : '',
      items: items.map((it) => ({
        name: it.name,
        category: it.category,
        quantity: Number(it.quantity),
        costPrice: Number(it.costPrice),
        price: Number(it.price),
        batchNumber: it.batchNumber,
        expiryDate: it.expiryDate || undefined,
      })),
      totalAmount: Number(orderTotal.toFixed(2)),
      paymentStatus,
      paymentMethod,
      status: modalDocType === 'Order' ? 'Ordered' : 'Received',
    };
    try {
      const labels = { Bill: 'Purchase Bill', Return: 'Purchase Return', DebitNote: 'Debit Note', Order: 'Purchase Order' };
      if (editId) {
        await purchaseService.updatePurchase(editId, payload);
        toast.success(`${labels[modalDocType] || modalDocType} updated successfully!`);
      } else {
        await purchaseService.createPurchase(payload);
        toast.success(`${labels[modalDocType] || modalDocType} created successfully!`);
      }
      setView('list');
      setEditId(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create purchase document');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document? This will reverse any inventory changes.')) return;
    try {
      await purchaseService.deletePurchase(id);
      toast.success('Document deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete document');
      console.error(error);
    }
  };

  const handleEdit = (doc) => {
    setEditId(doc._id);
    setModalDocType(doc.type);
    setSupplierName(doc.supplierName);
    setPaymentStatus(doc.paymentStatus);
    setPaymentMethod(doc.paymentMethod);
    setPoStatus(doc.status);
    setReferenceNumber(doc.referenceNumber || '');
    setItems(doc.items.map(i => ({
      ...i,
      productId: i.productId || i._id,
      expiryDate: i.expiryDate ? new Date(i.expiryDate).toISOString().split('T')[0] : '',
    })));
    setView('create');
    toast.success('Ready to edit document. Press Save when done.');
  };

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!paymentTarget) return;
    try {
      await purchaseService.collectPayment(paymentTarget._id, collectMethod);
      toast.success('Payment out recorded — bill marked as Paid!');
      setPaymentTarget(null);
      setView('list');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to record payment');
    }
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    if (!quickForm.name.trim() || !quickForm.sku.trim() || !quickForm.price || !quickForm.costPrice) {
      toast.error('Please complete all required fields');
      return;
    }
    try {
      await productService.createProduct({
        ...quickForm,
        quantity: Number(quickForm.quantity),
        price: Number(quickForm.price),
        costPrice: Number(quickForm.costPrice),
      });
      toast.success('New product added to inventory catalog!');
      setView('list');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create product');
      console.error(error);
    }
  };

  // Filtered lists per tab
  const filteredByType = (type) => purchases.filter((p) => {
    const matchType = p.type === type;
    const matchSearch = !historySearch ||
      p.purchaseOrderNumber?.toLowerCase().includes(historySearch.toLowerCase()) ||
      p.supplierName?.toLowerCase().includes(historySearch.toLowerCase());
    return matchType && matchSearch;
  });

  const pendingBills = purchases.filter((p) => p.type === 'Bill' && p.paymentStatus !== 'Paid');

  const allFiltered = purchases.filter((p) => {
    const matchType = !historyType || p.type === historyType;
    const matchSearch = !historySearch ||
      p.purchaseOrderNumber?.toLowerCase().includes(historySearch.toLowerCase()) ||
      p.supplierName?.toLowerCase().includes(historySearch.toLowerCase());
    return matchType && matchSearch;
  });

  const inputClass = 'block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-pharmacy-500 focus:ring-2 focus:ring-pharmacy-500/20 focus:outline-none transition-colors';
  const inputSmClass = 'block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-xs text-gray-900 focus:border-pharmacy-500 focus:ring-pharmacy-500';
  const cardClass = 'bg-white shadow-sm border-gray-200';

  const tabs = [
    { id: 'bills',    label: 'Purchase Bills',   icon: FileText,   color: 'text-blue-600' },
    { id: 'payments', label: 'Payments Out',      icon: IndianRupee, color: 'text-rose-600' },
    { id: 'returns',  label: 'Purchase Returns',  icon: RotateCcw,  color: 'text-orange-600' },
    { id: 'debit',    label: 'Debit Notes',       icon: Tag,        color: 'text-purple-600' },
    { id: 'orders',   label: 'Purchase Orders',   icon: ShoppingBag,color: 'text-emerald-600' },
    { id: 'history',  label: 'All Documents',     icon: History,    color: 'text-gray-600' },
  ];

  const docCreateLabel = { bills: 'Purchase Bill', returns: 'Purchase Return', debit: 'Debit Note', orders: 'Purchase Order' };
  const docTypeKey = { bills: 'Bill', returns: 'Return', debit: 'DebitNote', orders: 'Order' };

  const renderTable = (list, emptyMsg = 'No records found') => (
    loading ? (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-pharmacy-600" />
        <span className="text-sm text-gray-500">Loading records...</span>
      </div>
    ) : list.length === 0 ? (
      <div className="text-center py-16">
        <FileText size={48} className="mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900">{emptyMsg}</h3>
        <p className="text-sm text-gray-500 mt-1">No procurement documents matched your filters.</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 sticky top-0 border-b border-gray-100 z-10 text-gray-500">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider">PO Number</th>
              <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wider">Doc Type</th>
              <th className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Total Cost</th>
              <th className="px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wider">Status</th>
              <th className="px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wider">Payment</th>
              <th className="px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wider">Date</th>
              <th className="px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {list.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                    {p.purchaseOrderNumber}
                  </span>
                  {p.referenceNumber && (
                    <div className="text-[9px] text-pharmacy-600 font-medium mt-0.5">Ref: {p.referenceNumber}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{p.supplierName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    p.type === 'Return' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    p.type === 'DebitNote' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    p.type === 'Order' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>{p.type === 'DebitNote' ? 'Debit Note' : p.type}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-gray-900">₹{p.totalAmount?.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    p.status === 'Received' ? 'bg-green-100 text-green-800' :
                    p.status === 'Ordered' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>{p.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    p.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-50 text-yellow-800'
                  }`}>{p.paymentStatus}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-gray-500">
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    {activeSubTab === 'payments' && (
                      <button
                        onClick={() => openPaymentPage(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition-colors"
                      >
                        <IndianRupee size={12} /> Pay
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-pharmacy-600 hover:bg-pharmacy-50 transition-colors"
                      title="Edit Document"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  );

  // ─── CREATE DOCUMENT PAGE ─────────────────────────────────────────────────
  if (view === 'create') {
    const docLabels = { Bill: 'Purchase Bill', Return: 'Purchase Return', DebitNote: 'Debit Note', Order: 'Purchase Order' };
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setView('list')}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-semibold text-gray-700 flex items-center gap-1.5 bg-white shadow-sm"
          >
            <ChevronLeft size={14} /> Back to Procurement Hub
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText size={22} className="text-pharmacy-600" />
              Create {docLabels[modalDocType] || 'Purchase Document'}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">Fill in supplier and item details to record this procurement document.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6 space-y-6">
              {/* Header Row */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b">Document Details</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-700">Supplier Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="e.g. PharmaCorp Ltd."
                    />
                  </div>

                  {(modalDocType === 'Return' || modalDocType === 'DebitNote') && (
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-gray-700">Ref. Bill Number <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="e.g. PB-2026-0001"
                        className={inputClass}
                        required
                      />
                    </div>
                  )}

                  {modalDocType === 'Order' && (
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-gray-700">PO Status</label>
                      <select value={poStatus} onChange={(e) => setPoStatus(e.target.value)} className={inputClass}>
                        <option value="Ordered">Ordered (Awaiting Delivery)</option>
                        <option value="Received">Received (Add to Stock Now)</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-700">Payment Status</label>
                    <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={inputClass}>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-700">Payment Method</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card / POS</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit">Supplier Credit</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-4 border-b">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Order Items</h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold py-1.5 px-3 border rounded-lg hover:bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Item Row
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="p-4 rounded-xl border bg-gray-50 border-gray-200 relative">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-7 pr-8">
                        <div className="col-span-2 sm:col-span-3 md:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 mb-1">Item Name <span className="text-red-400">*</span></label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            list="products-autocomplete"
                            required
                            className={inputSmClass}
                            placeholder="Type or select product"
                          />
                          <datalist id="products-autocomplete">
                            {productsList.map((p) => <option key={p._id} value={p.name} />)}
                          </datalist>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1">Category</label>
                          <select value={item.category} onChange={(e) => handleItemChange(index, 'category', e.target.value)} className={inputSmClass}>
                            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1">Qty <span className="text-red-400">*</span></label>
                          <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} required min="1" className={inputSmClass} placeholder="50" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1">Cost (₹) <span className="text-red-400">*</span></label>
                          <input type="number" value={item.costPrice} onChange={(e) => handleItemChange(index, 'costPrice', e.target.value)} required step="0.01" className={inputSmClass} placeholder="5.00" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1">Retail (₹) <span className="text-red-400">*</span></label>
                          <input type="number" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} required step="0.01" className={inputSmClass} placeholder="9.99" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1">Batch #</label>
                          <input type="text" value={item.batchNumber} onChange={(e) => handleItemChange(index, 'batchNumber', e.target.value)} className={inputSmClass} placeholder="B-2026" />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        className="absolute right-3 top-3 p-1.5 text-red-400 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl gap-3">
              <div className="text-sm font-bold text-pharmacy-700 flex items-center gap-2">
                <IndianRupee size={18} />
                <span>Estimated Total: ₹{orderTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setView('list')} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editId ? 'Update Document' : 'Save Document'}</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── COLLECT PAYMENT PAGE ─────────────────────────────────────────────────
  if (view === 'payment' && paymentTarget) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setView('list'); setPaymentTarget(null); }}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-semibold text-gray-700 flex items-center gap-1.5 bg-white shadow-sm"
          >
            <ChevronLeft size={14} /> Back to Procurement Hub
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden max-w-lg">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-xl font-bold text-rose-700 flex items-center gap-2">
              <IndianRupee size={22} />
              Pay Supplier Bill
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">Confirm payment to mark this invoice as paid.</p>
          </div>

          <form onSubmit={handleCollectPayment}>
            <div className="px-6 py-6 space-y-5">
              {/* Bill Summary */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500">PO Number:</span>
                  <span className="font-mono font-bold text-gray-900">{paymentTarget.purchaseOrderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Supplier:</span>
                  <span className="font-semibold">{paymentTarget.supplierName}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3 mt-1">
                  <span className="text-gray-500 font-semibold">Amount Owed:</span>
                  <span className="font-extrabold text-rose-600 text-xl">₹{paymentTarget.totalAmount?.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700">Payment Method</label>
                <select value={collectMethod} onChange={(e) => setCollectMethod(e.target.value)} className={inputClass}>
                  <option value="Cash">Cash (logs Cash Out in Cash Book)</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button type="button" onClick={() => { setView('list'); setPaymentTarget(null); }} className="btn-secondary">Cancel</button>
              <button type="submit" className="rounded-lg bg-rose-600 hover:bg-rose-500 px-5 py-2.5 font-semibold text-white shadow-sm text-sm transition-colors">
                Confirm Payment Out
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── QUICK ADD ITEM PAGE ───────────────────────────────────────────────────
  if (view === 'quickadd') {
    return (
      <div className="flex flex-col items-center py-8 min-h-[75vh] animate-fadeIn px-4 sm:px-0">
        <div className="w-full max-w-xl mb-4">
          <button
            type="button"
            onClick={() => setView('list')}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-semibold text-gray-700 flex items-center gap-1.5 bg-white shadow-sm"
          >
            <ChevronLeft size={14} /> Back to Procurement Hub
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden w-full max-w-xl mx-auto">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-pharmacy-50 text-pharmacy-600 mb-3">
              <Package size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Add New Product to Inventory</h3>
            <p className="text-sm text-gray-500 mt-1">Register a new item in the product catalog directly from here.</p>
          </div>

          <form onSubmit={handleQuickAddSubmit}>
            <div className="px-6 py-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700">Product Name <span className="text-red-500">*</span></label>
                <input type="text" required value={quickForm.name} onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })} placeholder="e.g. Paracetamol 500mg" className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700">SKU / Barcode <span className="text-red-500">*</span></label>
                  <input type="text" required value={quickForm.sku} onChange={(e) => setQuickForm({ ...quickForm, sku: e.target.value })} placeholder="PCT-500" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700">Unit</label>
                  <select value={quickForm.unit} onChange={(e) => setQuickForm({ ...quickForm, unit: e.target.value })} className={inputClass}>
                    {['Piece','Box','Bottle','Strip','Tablet','Vial','Pack'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700">Category</label>
                  <select value={quickForm.category} onChange={(e) => setQuickForm({ ...quickForm, category: e.target.value })} className={inputClass}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700">Initial Stock <span className="text-red-500">*</span></label>
                  <input type="number" required min="0" value={quickForm.quantity} onChange={(e) => setQuickForm({ ...quickForm, quantity: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700">Cost Price (₹) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" min="0" required value={quickForm.costPrice} onChange={(e) => setQuickForm({ ...quickForm, costPrice: e.target.value })} className={inputClass} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700">Selling Price (₹) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" min="0" required value={quickForm.price} onChange={(e) => setQuickForm({ ...quickForm, price: e.target.value })} className={inputClass} placeholder="0.00" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button type="button" onClick={() => setView('list')} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Add to Inventory</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fadeIn duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Procurement Hub</h2>
          <p className="text-sm text-gray-500">Manage supplier purchase bills, returns, debit notes, orders, and payments out.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={openQuickAddPage}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-pharmacy-600 border border-pharmacy-200 hover:bg-pharmacy-50 transition-all"
          >
            <Package size={14} />
            Add New Item
          </button>
          {['bills', 'returns', 'debit', 'orders'].includes(activeSubTab) && (
            <button
              onClick={() => openCreatePage(docTypeKey[activeSubTab])}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white bg-pharmacy-600 hover:bg-pharmacy-500 shadow-sm transition-all"
            >
              <PlusCircle size={14} />
              New {docCreateLabel[activeSubTab]}
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Switcher */}
      <div className="flex overflow-x-auto gap-2 pb-1 vapor-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`whitespace-nowrap flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-pharmacy-600 text-white border-pharmacy-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon size={13} className={isActive ? 'text-white' : tab.color} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── BILLS TAB ── */}
      {activeSubTab === 'bills' && (
        <div className={`overflow-hidden border rounded-xl ${cardClass}`}>
          {renderTable(filteredByType('Bill'), 'No Purchase Bills')}
        </div>
      )}

      {/* ── PAYMENTS OUT TAB ── */}
      {activeSubTab === 'payments' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border bg-white border-gray-200 shadow-sm">
            <h3 className="font-bold text-sm text-gray-500 flex items-center gap-2">
              <IndianRupee size={16} className="text-rose-600" />
              Collect Payments Out — Pending Supplier Bills
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Settle outstanding supplier invoices and record cash outflows automatically.</p>
          </div>
          <div className={`overflow-hidden border rounded-xl ${cardClass}`}>
            {renderTable(pendingBills, 'No Pending Bills')}
          </div>
        </div>
      )}

      {/* ── RETURNS TAB ── */}
      {activeSubTab === 'returns' && (
        <div className={`overflow-hidden border rounded-xl ${cardClass}`}>
          {renderTable(filteredByType('Return'), 'No Purchase Returns')}
        </div>
      )}

      {/* ── DEBIT NOTES TAB ── */}
      {activeSubTab === 'debit' && (
        <div className={`overflow-hidden border rounded-xl ${cardClass}`}>
          {renderTable(filteredByType('DebitNote'), 'No Debit Notes')}
        </div>
      )}

      {/* ── PURCHASE ORDERS TAB ── */}
      {activeSubTab === 'orders' && (
        <div className={`overflow-hidden border rounded-xl ${cardClass}`}>
          {renderTable(filteredByType('Order'), 'No Purchase Orders')}
        </div>
      )}

      {/* ── ALL DOCUMENTS / HISTORY TAB ── */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center p-4 rounded-xl border bg-white border-gray-200 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search size={14} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search by PO number or supplier..."
                className="pl-9 w-full rounded-lg text-xs border border-gray-300 bg-gray-50 p-2 text-gray-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <select
                value={historyType}
                onChange={(e) => setHistoryType(e.target.value)}
                className="rounded-lg text-xs border border-gray-300 bg-gray-50 p-2 text-gray-900"
              >
                <option value="">All Document Types</option>
                <option value="Bill">Purchase Bills</option>
                <option value="Return">Purchase Returns</option>
                <option value="DebitNote">Debit Notes</option>
                <option value="Order">Purchase Orders</option>
              </select>
            </div>
          </div>
          <div className={`overflow-hidden border rounded-xl ${cardClass}`}>
            {renderTable(allFiltered, 'No Documents Found')}
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
