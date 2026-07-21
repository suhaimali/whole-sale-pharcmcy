import React from 'react';
import { Package, ChevronLeft } from 'lucide-react';

const QuickAddMissingItem = ({
  setView,
  handleQuickAddSubmit,
  quickForm,
  setQuickForm,
  categories
}) => {
  return (
    <div className="flex flex-col items-center py-8 min-h-[75vh] animate-fadeIn px-4 sm:px-0">
      <div className="w-full max-w-xl mb-4">
        <button
          type="button"
          onClick={() => setView('list')}
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-semibold text-gray-700 flex items-center gap-1.5 bg-white shadow-sm"
        >
          <ChevronLeft size={14} /> Back to POS
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden w-full max-w-xl">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-pharmacy-50 text-pharmacy-600 mb-3">
            <Package size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Quick Add Missing Product</h3>
          <p className="text-sm text-gray-500 mt-1">Register a missing item and it will be auto-added to your cart.</p>
        </div>

        <form onSubmit={handleQuickAddSubmit}>
          <div className="px-6 py-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-700">Product Name <span className="text-red-500">*</span></label>
              <input
                type="text" required value={quickForm.name}
                onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                placeholder="e.g. Paracetamol 500mg"
                className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-pharmacy-500 focus:ring-2 focus:ring-pharmacy-500/20 focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700">SKU / Barcode <span className="text-red-500">*</span></label>
                <input type="text" required value={quickForm.sku}
                  onChange={(e) => setQuickForm({ ...quickForm, sku: e.target.value })}
                  placeholder="PCT-500-BOX"
                  className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-pharmacy-500 focus:ring-2 focus:ring-pharmacy-500/20 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700">Packaging Unit</label>
                <select value={quickForm.unit} onChange={(e) => setQuickForm({ ...quickForm, unit: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-pharmacy-500 focus:ring-2 focus:ring-pharmacy-500/20 focus:outline-none transition-colors">
                  {['Piece','Box','Bottle','Strip','Tablet','Vial','Pack'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700">Category</label>
                <select value={quickForm.category} onChange={(e) => setQuickForm({ ...quickForm, category: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-pharmacy-500 focus:ring-2 focus:ring-pharmacy-500/20 focus:outline-none transition-colors">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700">Stock Quantity <span className="text-red-500">*</span></label>
                <input type="number" required min="1" value={quickForm.quantity}
                  onChange={(e) => setQuickForm({ ...quickForm, quantity: e.target.value })}
                  placeholder="100"
                  className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-pharmacy-500 focus:ring-2 focus:ring-pharmacy-500/20 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700">Cost Price (₹) <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" min="0" required value={quickForm.costPrice}
                  onChange={(e) => setQuickForm({ ...quickForm, costPrice: e.target.value })}
                  placeholder="5.50"
                  className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-pharmacy-500 focus:ring-2 focus:ring-pharmacy-500/20 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700">Selling Price (₹) <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" min="0" required value={quickForm.price}
                  onChange={(e) => setQuickForm({ ...quickForm, price: e.target.value })}
                  placeholder="10.00"
                  className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-pharmacy-500 focus:ring-2 focus:ring-pharmacy-500/20 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button type="button" onClick={() => setView('list')} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create & Add to POS</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddMissingItem;
