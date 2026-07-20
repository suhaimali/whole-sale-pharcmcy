import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Tag,
  Loader2
} from 'lucide-react';
import { productService } from '../services/api';
import toast from 'react-hot-toast';

const Inventory = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [view, setView] = useState('list'); // 'list', 'add', 'edit'
  const [activeProduct, setActiveProduct] = useState(null);

  // Form fields
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'Medicines',
    unit: 'Piece',
    quantity: '',
    price: '',
    costPrice: '',
    batchNumber: '',
    expiryDate: '',
    supplier: '',
    description: '',
  });

  const categories = ['Medicines', 'OTC Drugs', 'Surgicals', 'Vapes & Devices'];

  const canEdit = ['Administrator', 'Admin', 'Inventory Staff'].includes(user.role);
  const canDelete = ['Administrator', 'Admin'].includes(user.role);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setFetchError(false);
      const res = await productService.getProducts(search, category);
      setProducts(res.data);
    } catch (error) {
      setFetchError(true);
      toast.error('Failed to load products — check server connection');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category]);

  const handleOpenAddModal = () => {
    setActiveProduct(null);
    setForm({
      name: '', sku: '', category: 'Medicines', unit: 'Piece',
      quantity: '', price: '', costPrice: '', batchNumber: '',
      expiryDate: '', supplier: '', description: '',
    });
    setView('add');
  };

  const handleOpenEditModal = (p) => {
    setActiveProduct(p);
    setForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unit: p.unit || 'Piece',
      quantity: p.quantity,
      price: p.price,
      costPrice: p.costPrice,
      batchNumber: p.batchNumber || '',
      expiryDate: p.expiryDate ? new Date(p.expiryDate).toISOString().split('T')[0] : '',
      supplier: p.supplier || '',
      description: p.description || '',
    });
    setView('edit');
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.price || !form.costPrice) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      if (activeProduct) {
        await productService.updateProduct(activeProduct._id, form);
        toast.success('Product updated successfully!');
      } else {
        await productService.createProduct(form);
        toast.success('Product added successfully!');
      }
      setView('list');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
      console.error(error);
    }
  };

  const handleDelete = async (p) => {
    if (window.confirm(`Are you sure you want to delete ${p.name}?`)) {
      try {
        await productService.deleteProduct(p._id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
        console.error(error);
      }
    }
  };

  const inputClass = 'block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-pharmacy-500 focus:ring-2 focus:ring-pharmacy-500/20 focus:outline-none transition-colors';

  const getCategoryBadge = (cat) => {
    const map = {
      'Medicines': 'bg-blue-100 text-blue-800',
      'Vapes & Devices': 'bg-pink-100 text-pink-800',
      'OTC Drugs': 'bg-emerald-100 text-emerald-800',
      'Surgicals': 'bg-purple-100 text-purple-800',
    };
    return map[cat] || 'bg-gray-100 text-gray-800';
  };

  if (view === 'add' || view === 'edit') {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Breadcrumbs / Header */}
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setView('list')} 
            className="p-2 rounded-xl border border-gray-250 hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-semibold text-gray-700 flex items-center gap-1.5 bg-white shadow-sm"
          >
            ← Back to Catalog
          </button>
        </div>

        {/* Page Container */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-white">
            <h3 className="text-xl font-bold text-gray-900">
              {view === 'edit' ? 'Edit Product Catalog' : 'Add New Inventory Product'}
            </h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Product Name <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={form.name} onChange={handleFormChange} required className={inputClass} placeholder="e.g. Nicotine Vape Cartridge" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">SKU / Barcode <span className="text-red-500">*</span></label>
                  <input type="text" name="sku" value={form.sku} onChange={handleFormChange} required className={inputClass} placeholder="e.g. VPE-POD-NIC" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                  <select name="category" value={form.category} onChange={handleFormChange} required className={inputClass}>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Packaging Unit <span className="text-red-500">*</span></label>
                  <select name="unit" value={form.unit} onChange={handleFormChange} required className={inputClass}>
                    <option value="Piece">Piece</option>
                    <option value="Box">Box</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Strip">Strip</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Vial">Vial</option>
                    <option value="Pack">Pack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Stock Quantity <span className="text-red-500">*</span></label>
                  <input type="number" name="quantity" value={form.quantity} onChange={handleFormChange} required min="0" className={inputClass} placeholder="e.g. 150" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cost Price (₹) <span className="text-red-500">*</span></label>
                  <input type="number" name="costPrice" value={form.costPrice} onChange={handleFormChange} required step="0.01" min="0" className={inputClass} placeholder="e.g. 12.50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Selling Price (₹) <span className="text-red-500">*</span></label>
                  <input type="number" name="price" value={form.price} onChange={handleFormChange} required step="0.01" min="0" className={inputClass} placeholder="e.g. 24.99" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Batch Number</label>
                  <input type="text" name="batchNumber" value={form.batchNumber} onChange={handleFormChange} className={inputClass} placeholder="e.g. B-042" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Expiry Date</label>
                  <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleFormChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Supplier / Manufacturer</label>
                  <input type="text" name="supplier" value={form.supplier} onChange={handleFormChange} className={inputClass} placeholder="e.g. VaporLabs Distribution Inc" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Product Description</label>
                  <textarea name="description" value={form.description} onChange={handleFormChange} rows="4" className={`${inputClass} resize-none`} placeholder="Dosage, storage instructions, or device specs..." />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button type="button" onClick={() => setView('list')} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">
                {view === 'edit' ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Inventory Management</h2>
          <p className="text-sm text-gray-500">Maintain medicine batches and electronic products.</p>
        </div>
        {canEdit && (
          <button
            onClick={handleOpenAddModal}
            className="btn-primary"
          >
            <Plus size={16} />
            Add Product
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col gap-4 md:flex-row md:items-center shadow-sm">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full rounded-lg text-sm border border-gray-300 bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-pharmacy-500/20 focus:border-pharmacy-500 transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${!category ? 'bg-pharmacy-600 border-pharmacy-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${category === cat ? 'bg-pharmacy-600 border-pharmacy-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-pharmacy-600" />
            <span className="text-sm text-gray-500">Retrieving catalog...</span>
          </div>
        ) : fetchError ? (
          <div className="text-center py-16 px-6">
            <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
            <h3 className="text-lg font-semibold text-gray-900">Could Not Load Products</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">The server could not be reached. Make sure the backend is running, then click retry.</p>
            <button onClick={fetchProducts} className="btn-primary mt-5">
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Tag size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900">No Products Found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search criteria or register a new item.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product Info</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Price (Cost)</th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Batch / Expiry</th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((p) => {
                    const isLowStock = p.quantity <= 15;
                    const isExpired = p.expiryDate && new Date(p.expiryDate) < new Date();

                    return (
                      <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{p.name}</span>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                              <span>{p.supplier || 'No Supplier'}</span>
                              <span className="text-gray-200">|</span>
                              <span className="font-semibold">Unit: {p.unit || 'Piece'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700">{p.sku}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getCategoryBadge(p.category)}`}>{p.category}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${isLowStock ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
                            {isLowStock && <AlertTriangle size={12} />}
                            {p.quantity} Units
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">${p.price.toFixed(2)}</span>
                            <span className="text-xs text-gray-400">(${p.costPrice.toFixed(2)})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-medium text-gray-700">{p.batchNumber || 'N/A'}</span>
                            <span className={`text-xs font-bold ${isExpired ? 'text-red-500' : 'text-gray-400'}`}>
                              {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {canEdit && (
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                title="Edit product"
                                className="p-1.5 rounded-lg border border-gray-200 text-blue-500 hover:bg-blue-50 hover:border-blue-300 transition-all"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(p)}
                                title="Delete product"
                                className="p-1.5 rounded-lg border border-gray-200 text-red-400 hover:bg-red-50 hover:border-red-300 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="block md:hidden p-4 space-y-4">
              {products.map((p) => {
                const isLowStock = p.quantity <= 15;
                const isExpired = p.expiryDate && new Date(p.expiryDate) < new Date();

                return (
                  <div key={p._id} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-3 hover:border-pharmacy-300 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm leading-snug">{p.name}</h4>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">SKU: {p.sku}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getCategoryBadge(p.category)}`}>{p.category}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 py-2 border-y border-gray-100 text-xs text-gray-600">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wide">Stock Qty</span>
                        <span className={`font-bold flex items-center gap-1 ${isLowStock ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
                          {isLowStock && <AlertTriangle size={12} />}
                          {p.quantity} Units
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wide">Batch / Expiry</span>
                        <span className={`font-medium truncate block ${isExpired ? 'text-red-500' : ''}`}>
                          {p.batchNumber || 'N/A'} {p.expiryDate ? `(${new Date(p.expiryDate).toLocaleDateString()})` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wide">Retail Price</span>
                        <span className="font-bold text-gray-900">${p.price.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wide">Cost Price</span>
                        <span className="text-gray-500 font-medium">${p.costPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 text-[10px] text-gray-400">
                      <span className="truncate max-w-[140px]">Supplier: {p.supplier || 'N/A'}</span>
                      <div className="flex gap-2">
                        {canEdit && (
                          <button onClick={() => handleOpenEditModal(p)} title="Edit product"
                            className="p-1.5 rounded-lg border border-gray-200 text-blue-500 hover:bg-blue-50 transition-colors">
                            <Edit2 size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(p)} title="Delete product"
                            className="p-1.5 rounded-lg border border-gray-200 text-red-400 hover:bg-red-50 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Inventory;
