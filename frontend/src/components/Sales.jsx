import { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  User,
  CreditCard,
  Package,
  History,
  Edit,
  IndianRupee,
  Filter,
  FileText,
  ChevronLeft,
  X,
  Printer
} from 'lucide-react';
import { productService, saleService } from '../services/api';
import toast from 'react-hot-toast';
import QuickAddMissingItem from './QuickAddMissingItem';
import PosCheckoutCart from './PosCheckoutCart';

const Sales = ({ _isVapor, _user }) => {
  const [activeSubTab, setActiveSubTab] = useState('pos'); // 'pos', 'history', 'payments-in'
  const [products, setProducts] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [_loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  // view: 'list' | 'invoice' | 'payment' | 'quickadd'
  const [view, setView] = useState('list');

  // Cart state
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discount, setDiscount] = useState(0);
  const [taxRate] = useState(5);
  const [docType, setDocType] = useState('Invoice');
  const [referenceNumber, setReferenceNumber] = useState('');

  //  const [taxRate, setTaxRate] = useState(10);
  const [editId, setEditId] = useState(null);

  // Payments In State
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [collectMethod, setCollectMethod] = useState('Cash');

  // History Filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyType, setHistoryType] = useState('');

  // Active Invoice page
  const [activeInvoice, setActiveInvoice] = useState(null);
  const invoiceBarcodeRef = useRef(null);

  // Quick Add Product state
  const [quickForm, setQuickForm] = useState({
    name: '', sku: '', category: 'Medicines', unit: 'Piece',
    quantity: '100', costPrice: '', price: '',
  });

  const categories = ['Medicines', 'OTC Drugs', 'Surgicals', 'Vapes & Devices'];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getProducts(search, category);
      setProducts(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to retrieve inventory catalog');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesList = async () => {
    try {
      const res = await saleService.getSales();
      setSalesList(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to retrieve sales records history');
    }
  };

  useEffect(() => {
    if (activeSubTab === 'pos') {
      fetchProducts();
    } else {
      fetchSalesList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, activeSubTab]);

  // Generate barcode when invoice page is active
  useEffect(() => {
    if (view === 'invoice' && activeInvoice && invoiceBarcodeRef.current) {
      setTimeout(() => {
        try {
          JsBarcode(invoiceBarcodeRef.current, activeInvoice.invoiceNumber, {
            format: 'CODE128', width: 1.5, height: 40,
            displayValue: true, lineColor: '#1f2937', background: '#ffffff',
          });
        } catch (err) {
          console.error(err);
        }
      }, 100);
    }
  }, [view, activeInvoice]);

  const addToCart = (product) => {
    if (docType !== 'Return' && product.quantity <= 0) {
      toast.error('Product is out of stock!');
      return;
    }
    const existingIndex = cart.findIndex((item) => item.productId === product._id);
    if (existingIndex !== -1) {
      const item = cart[existingIndex];
      if (docType !== 'Return' && item.quantity + 1 > product.quantity) {
        toast.error(`Cannot exceed available stock of ${product.quantity} units`);
        return;
      }
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        productId: product._id, name: product.name, sku: product.sku,
        price: product.price, availableQty: product.quantity, quantity: 1,
      }]);
    }
    toast.success(`${product.name} added to cart`, { duration: 1000 });
  };

  const updateCartQty = (productId, amount) => {
    const itemIndex = cart.findIndex((item) => item.productId === productId);
    if (itemIndex === -1) return;
    const item = cart[itemIndex];
    const newQty = item.quantity + amount;
    if (newQty <= 0) { removeFromCart(productId); return; }
    if (docType !== 'Return' && newQty > item.availableQty) {
      toast.error(`Only ${item.availableQty} units available in stock`);
      return;
    }
    const newCart = [...cart];
    newCart[itemIndex].quantity = newQty;
    setCart(newCart);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = (subTotal * taxRate) / 100;
  const totalAmount = Math.max(0, subTotal + taxAmount - Number(discount));

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Your checkout cart is empty'); return; }
    const salePayload = {
      customerName, type: docType,
      referenceNumber: docType === 'Return' ? referenceNumber : '',
      items: cart.map((item) => ({
        productId: item.productId || item._id, name: item.name,
        quantity: item.quantity, price: item.price,
      })),
      subTotal: Number(subTotal.toFixed(2)),
      discount: Number(Number(discount).toFixed(2)),
      tax: Number(taxAmount.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      paymentMethod,
      paymentStatus: (docType === 'Estimate' || docType === 'Order') ? 'Pending' : 'Paid',
    };
    try {
      if (editId) {
        await saleService.updateSale(editId, salePayload);
        toast.success(`${docType} updated successfully!`);
      } else {
        const res = await saleService.createSale(salePayload);
        setActiveInvoice(res.data);
        toast.success(`${docType} processed successfully!`);
      }
      
      setCart([]);
      setCustomerName('Walk-in Customer');
      setDiscount(0);
      setReferenceNumber('');
      setDocType('Invoice');
      setIsMobileCartOpen(false);
      setEditId(null);
      if (!editId) {
        setView('invoice');
      } else {
        setView('list');
      }
      fetchProducts();
      fetchSalesList();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Checkout failed');
      console.error(error);
    }
  };

  const handleCollectPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentTarget) return;
    try {
      await saleService.collectPayment(paymentTarget._id, collectMethod);
      toast.success('Payment collected and status marked Paid!');
      setPaymentTarget(null);
      setView('list');
      fetchSalesList();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit receipt payment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sales document? This will reverse inventory changes.')) return;
    try {
      await saleService.deleteSale(id);
      toast.success('Document deleted successfully');
      fetchSalesList();
    } catch (error) {
      toast.error('Failed to delete document');
      console.error(error);
    }
  };

  const handleEdit = (doc) => {
    setEditId(doc._id);
    setDocType(doc.type || 'Invoice');
    setCustomerName(doc.customerName);
    setReferenceNumber(doc.referenceNumber || '');
    setDiscount(doc.discount || 0);
    setPaymentMethod(doc.paymentMethod || 'Cash');
    setCart(doc.items.map(i => ({
      ...i,
      productId: i.productId || i._id,
    })));
    setActiveSubTab('pos');
    setView('list');
    toast.success('Ready to edit document. Press Save when done.');
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    if (!quickForm.name.trim() || !quickForm.sku.trim() || !quickForm.price || !quickForm.costPrice) {
      toast.error('Please complete all required fields');
      return;
    }
    try {
      const res = await productService.createProduct({
        ...quickForm,
        quantity: Number(quickForm.quantity),
        price: Number(quickForm.price),
        costPrice: Number(quickForm.costPrice),
      });
      toast.success('Missing product created and added to cart!');
      const newProduct = res.data;
      setCart([...cart, {
        productId: newProduct._id, name: newProduct.name, sku: newProduct.sku,
        price: newProduct.price, availableQty: newProduct.quantity, quantity: 1,
      }]);
      setQuickForm({ name: '', sku: '', category: 'Medicines', unit: 'Piece', quantity: '100', costPrice: '', price: '' });
      setView('list');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register product');
      console.error(error);
    }
  };

  const handlePrint = () => { window.print(); };

  const cardClass = 'bg-white shadow-sm border-gray-200';
  const subtextClass = 'text-gray-500';
  const inputClass = 'block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-xs text-gray-900 focus:border-pharmacy-500 focus:ring-pharmacy-500';

  const filteredSales = salesList.filter((s) => {
    const matchesSearch =
      s.invoiceNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
      s.customerName.toLowerCase().includes(historySearch.toLowerCase());
    const matchesType = historyType === '' || s.type === historyType;
    return matchesSearch && matchesType;
  });

  const pendingPayments = salesList.filter((s) => s.paymentStatus !== 'Paid' && s.type !== 'Estimate');

  // ─── INVOICE RECEIPT PAGE ─────────────────────────────────────────────────
  if (view === 'invoice' && activeInvoice) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #print-invoice-modal, #print-invoice-modal * { visibility: visible; }
            #print-invoice-modal {
              position: absolute; left: 0; top: 0; width: 100%;
              border: none; background: white !important; color: black !important;
              box-shadow: none !important; padding: 0 !important; margin: 0 !important;
            }
            .no-print { display: none !important; }
          }
        `}</style>

        <div className="no-print flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setActiveInvoice(null); setView('list'); }}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-semibold text-gray-700 flex items-center gap-1.5 bg-white shadow-sm"
          >
            <ChevronLeft size={14} /> Back to Sales Hub
          </button>
        </div>

        <div id="print-invoice-modal" className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden max-w-lg mx-auto">
          {/* Header */}
          <div className="no-print px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-pharmacy-700 flex items-center gap-1.5">
              <Receipt size={22} />
              {activeInvoice.type === 'Return' ? 'Sales Return / Credit Note' :
               activeInvoice.type === 'Estimate' ? 'Price Estimate & Quotation' :
               activeInvoice.type === 'Order' ? 'Sales Order Confirmation' :
               activeInvoice.type === 'Challan' ? 'Delivery Challan Statement' :
               'Invoice Billing Statement'}
            </h3>
            <button
              onClick={() => { setActiveInvoice(null); setView('list'); }}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <X size={18} />
            </button>
          </div>

          {/* Invoice body */}
          <div className="px-6 py-6 space-y-4">
            <div className="text-center">
              <h4 className="text-xl font-bold tracking-tight text-gray-900">Suhaim Soft ERP</h4>
              <p className="text-xs text-gray-500 leading-tight">Wholesale Pharmacy & Medical Supplier</p>
              <p className="text-[10px] text-gray-400">102 Business District, Suite B, CA</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">
                  {activeInvoice.type === 'Return' ? 'Credit Note #' :
                   activeInvoice.type === 'Estimate' ? 'Estimate #' :
                   activeInvoice.type === 'Order' ? 'Sales Order #' :
                   activeInvoice.type === 'Challan' ? 'Challan #' : 'Invoice Number:'}
                </span>
                <span className="font-semibold text-gray-900 font-mono">{activeInvoice.invoiceNumber}</span>
              </div>
              {activeInvoice.referenceNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Ref Invoice Number:</span>
                  <span className="font-semibold text-gray-900 font-mono">{activeInvoice.referenceNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Billing Date:</span>
                <span className="text-gray-900">{new Date(activeInvoice.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-semibold text-gray-900">{activeInvoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Status:</span>
                <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-[10px]">
                  {activeInvoice.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Method:</span>
                <span className="text-gray-900 font-semibold">{activeInvoice.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sales Representative:</span>
                <span className="text-gray-900 font-semibold">{activeInvoice.salesRep}</span>
              </div>
            </div>

            <div>
              <h5 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">Billing Items</h5>
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2">Item Description</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-medium text-gray-900">{item.name}</td>
                        <td className="px-3 py-2 text-center text-gray-700">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-700">₹{item.price.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">₹{(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t pt-3 space-y-1.5 text-xs text-right pr-2">
              <div className="flex justify-end gap-6 text-gray-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-gray-900 w-20">₹{activeInvoice.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-end gap-6 text-gray-500">
                <span>Tax (5%):</span>
                <span className="font-semibold text-gray-900 w-20">₹{activeInvoice.tax.toFixed(2)}</span>
              </div>
              {activeInvoice.discount > 0 && (
                <div className="flex justify-end gap-6 text-red-500">
                  <span>Discount:</span>
                  <span className="w-20">-₹{activeInvoice.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-end gap-6 font-bold text-sm border-t pt-2 border-gray-200">
                <span>Grand Total:</span>
                <span className="text-pharmacy-700 w-20">₹{activeInvoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center pt-2 border-t border-gray-100">
              <svg ref={invoiceBarcodeRef}></svg>
              <p className="text-[9px] text-gray-400 mt-1">Thank you for your business. For refunds, preserve invoice label.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="no-print flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button
              onClick={() => { setActiveInvoice(null); setView('list'); }}
              className="flex-1 py-2.5 text-xs font-semibold text-center border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close Receipt
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 text-xs font-semibold text-white bg-pharmacy-600 hover:bg-pharmacy-500 rounded-lg flex items-center justify-center gap-1.5 shadow"
            >
              <Printer size={14} />
              Print Statement
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── COLLECT PAYMENT IN PAGE ───────────────────────────────────────────────
  if (view === 'payment' && paymentTarget) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setPaymentTarget(null); setView('list'); }}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-semibold text-gray-700 flex items-center gap-1.5 bg-white shadow-sm"
          >
            <ChevronLeft size={14} /> Back to Sales Hub
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden max-w-lg mx-auto">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-xl font-bold text-pharmacy-700 flex items-center gap-2">
              <IndianRupee size={22} />
              Collect Payment In
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">Settle outstanding balance and mark this invoice as paid.</p>
          </div>

          <form onSubmit={handleCollectPaymentSubmit}>
            <div className="px-6 py-6 space-y-5">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Ref Invoice:</span>
                  <span className="font-bold text-gray-900 font-mono">{paymentTarget.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Client:</span>
                  <span className="font-semibold text-gray-900">{paymentTarget.customerName}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3 mt-1">
                  <span className="text-gray-500 font-semibold">Outstanding Balance:</span>
                  <span className="font-extrabold text-rose-600 text-xl">₹{paymentTarget.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700">Settling Payment Method</label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-pharmacy-500 focus:ring-2 focus:ring-pharmacy-500/20 focus:outline-none transition-colors"
                >
                  <option value="Cash">Cash (Inflows to Cash Book)</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Bank Transfer">Direct Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button type="button" onClick={() => { setPaymentTarget(null); setView('list'); }} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Collect & Reconcile
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── QUICK ADD PRODUCT PAGE ────────────────────────────────────────────────
  if (view === 'quickadd') {
    return (
      <QuickAddMissingItem
        setView={setView}
        handleQuickAddSubmit={handleQuickAddSubmit}
        quickForm={quickForm}
        setQuickForm={setQuickForm}
        categories={categories}
      />
    );
  }

  // ─── MAIN LIST / POS VIEW ─────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fadeIn duration-500">
      {/* Printable Area overrides */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-invoice-modal, #print-invoice-modal * { visibility: visible; }
          #print-invoice-modal {
            position: absolute; left: 0; top: 0; width: 100%;
            border: none; background: white !important; color: black !important;
            box-shadow: none !important; padding: 0 !important; margin: 0 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Sales Department Hub</h2>
          <p className="text-sm text-gray-500">Process POS invoicing, track documents timeline, collect customer payments.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit max-w-full overflow-x-auto vapor-scrollbar">
          <button
            onClick={() => setActiveSubTab('pos')}
            className={`whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeSubTab === 'pos' ? 'bg-white shadow text-pharmacy-700' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <ShoppingCart size={14} /> Mobile POS Terminal
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeSubTab === 'history' ? 'bg-white shadow text-pharmacy-700' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <History size={14} /> Invoices & Documents
          </button>
          <button
            onClick={() => setActiveSubTab('payments-in')}
            className={`whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeSubTab === 'payments-in' ? 'bg-white shadow text-pharmacy-700' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <IndianRupee size={14} /> Payments In Ledger
          </button>
          <button
            onClick={() => setActiveSubTab('cart')}
            className={`lg:hidden whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeSubTab === 'cart' ? 'bg-white shadow text-pharmacy-700' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <ShoppingCart size={14} /> Cart Checkout ({cart.reduce((s, i) => s + i.quantity, 0)})
          </button>
        </div>
      </div>

      {/* TAB 1: POS WORKSPACE */}
      {(activeSubTab === 'pos' || activeSubTab === 'cart') && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Product Selector */}
          <div className={`lg:col-span-7 space-y-4 ${activeSubTab === 'cart' ? 'hidden lg:block' : 'block'}`}>
            <div className={`p-4 rounded-xl border flex flex-col gap-3 ${cardClass}`}>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className={`h-4 w-4 ${subtextClass}`} />
                </div>
                <input
                  type="text" placeholder="Search products by SKU or name..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className={`pl-10 w-full rounded-lg text-sm border p-2 bg-transparent focus:outline-none focus:ring-2 border-gray-300 focus:ring-pharmacy-500 focus:border-pharmacy-500`}
                />
              </div>
              <div className="flex overflow-x-auto gap-1.5 pb-1 vapor-scrollbar">
                <button onClick={() => setCategory('')}
                  className={`whitespace-nowrap flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${!category ? 'bg-pharmacy-600 border-pharmacy-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className={`whitespace-nowrap flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${category === cat ? 'bg-pharmacy-600 border-pharmacy-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-1 vapor-scrollbar">
              {products.length === 0 ? (
                <div className="sm:col-span-2 text-center py-12 flex flex-col items-center justify-center">
                  <Package size={40} className="text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-900">No products found</p>
                  <p className={`text-xs ${subtextClass} mt-1 mb-4`}>The searched product is missing in inventory catalog.</p>
                  <button type="button" onClick={() => setView('quickadd')}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white bg-pharmacy-600 hover:bg-pharmacy-500 shadow-sm transition-all">
                    <Plus size={14} /> Quick Add Missing Item
                  </button>
                </div>
              ) : (
                products.map((p) => {
                  const isOutOfStock = p.quantity <= 0;
                  const isLowStock = p.quantity <= 15;
                  return (
                    <div key={p._id} onClick={() => !isOutOfStock && addToCart(p)}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all cursor-pointer select-none ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''} bg-white border-gray-200 hover:border-pharmacy-300 shadow-sm hover:scale-[1.01]`}>
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="font-semibold text-sm text-gray-900">{p.name}</span>
                          <span className="text-xs font-bold text-pharmacy-600">₹{p.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono mb-2">
                          <span className={subtextClass}>{p.sku}</span>
                          <span className={subtextClass}>{p.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t pt-2 mt-2">
                        <span className={`text-xs font-bold flex items-center gap-1 ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-orange-500' : subtextClass}`}>
                          <Package size={12} />
                          {isOutOfStock ? 'Out of Stock' : `${p.quantity} ${p.unit || 'Piece'}s`}
                        </span>
                        <button disabled={isOutOfStock}
                          className="p-1 rounded-full flex items-center justify-center text-white bg-pharmacy-600 hover:bg-pharmacy-500">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Checkout Sheet (Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between max-h-[85vh]">
            <div className={`p-5 rounded-xl border flex flex-col flex-1 overflow-hidden ${cardClass}`}>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900">
                  <ShoppingCart size={20} className="text-pharmacy-600" /> Checkout Sheet
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-gray-100 pr-1 vapor-scrollbar">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <Receipt size={40} className="mb-2 text-gray-300" />
                    <span className="text-sm font-semibold text-gray-900">Cart is Empty</span>
                    <span className={`text-xs ${subtextClass} mt-1`}>Select products on the left to add items to invoice.</span>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.productId} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-semibold truncate text-gray-900">{item.name}</h5>
                        <p className={`text-[10px] ${subtextClass}`}>{item.sku} | ₹{item.price.toFixed(2)} ea</p>
                      </div>
                      <div className="flex items-center gap-2 border rounded-lg px-1 py-0.5 border-gray-300">
                        <button onClick={() => updateCartQty(item.productId, -1)} className="p-0.5 rounded-full hover:bg-gray-200"><Minus size={12} /></button>
                        <span className="text-xs font-bold w-6 text-center text-gray-900">{item.quantity}</span>
                        <button onClick={() => updateCartQty(item.productId, 1)} className="p-0.5 rounded-full hover:bg-gray-200"><Plus size={12} /></button>
                      </div>
                      <span className="text-xs font-extrabold w-16 text-right text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item.productId)} className="p-1 rounded-full text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t pt-4 mt-3 space-y-3 border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase font-bold mb-1 tracking-wide text-gray-500">Document Type</label>
                    <select value={docType} onChange={(e) => { setDocType(e.target.value); if (e.target.value !== 'Return') setReferenceNumber(''); }} className={inputClass}>
                      <option value="Invoice">Sales Invoice</option>
                      <option value="Return">Sales Return / Credit Note</option>
                      <option value="Estimate">Estimate / Quotation</option>
                      <option value="Order">Sales Order</option>
                      <option value="Challan">Delivery Challan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-bold mb-1 tracking-wide text-gray-500">
                      {docType === 'Return' ? 'Ref Invoice #' : 'Ref Details (PO/Challan)'}
                    </label>
                    <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder={docType === 'Return' ? 'e.g. INV-2026-0001' : 'Optional ref'} className={inputClass} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User size={16} className={subtextClass} />
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer / Pharmacy Name" className={inputClass} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1 tracking-wide text-gray-500">Payment</label>
                    <div className="flex items-center gap-1.5">
                      <CreditCard size={14} className={subtextClass} />
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Credit">Credit</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold mb-1 tracking-wide text-gray-500">Discount (₹)</label>
                    <input type="number" value={discount} onChange={(e) => setDiscount(Math.max(0, e.target.value))}
                      placeholder="0.00" className={inputClass} />
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border text-xs space-y-1.5 border-gray-100">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span><span>₹{subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax ({taxRate}%):</span><span>+₹{taxAmount.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span><span>-₹{Number(discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-gray-900 border-t pt-1.5 mt-1 border-gray-200">
                    <span>Due Total:</span><span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <button onClick={handleCheckout} disabled={cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white shadow bg-pharmacy-600 hover:bg-pharmacy-500 disabled:opacity-50">
                  <ShoppingCart size={16} /> {editId ? 'Update & Save' : `Print & Save ${docType}`}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Cart View (Replaces product grid on mobile) */}
          {activeSubTab === 'cart' && (
            <div className="lg:hidden">
              <PosCheckoutCart
                setIsMobileCartOpen={() => setActiveSubTab('pos')}
                cart={cart}
                updateCartQty={updateCartQty}
                removeFromCart={removeFromCart}
                docType={docType}
                setDocType={setDocType}
                referenceNumber={referenceNumber}
                setReferenceNumber={setReferenceNumber}
                customerName={customerName}
                setCustomerName={setCustomerName}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                discount={discount}
                setDiscount={setDiscount}
                subTotal={subTotal}
                totalAmount={totalAmount}
                handleCheckout={handleCheckout}
                inputClass={inputClass}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVOICES & DOCUMENTS */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border bg-white border-gray-200 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search size={14} className="text-gray-400" />
              </div>
              <input type="text" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search by invoice number or customer name..."
                className="pl-9 w-full rounded-lg text-xs border border-gray-300 bg-gray-50 p-2 text-gray-900" />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <select value={historyType} onChange={(e) => setHistoryType(e.target.value)}
                className="rounded-lg text-xs border border-gray-300 bg-gray-50 p-2 text-gray-900">
                <option value="">All Document Types</option>
                <option value="Invoice">Sales Invoices</option>
                <option value="Return">Sales Returns (Credit Notes)</option>
                <option value="Estimate">Estimates / Quotations</option>
                <option value="Order">Sales Orders</option>
                <option value="Challan">Delivery Challans</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden border rounded-xl bg-white border-gray-200 shadow-sm">
            {filteredSales.length === 0 ? (
              <div className="text-center py-16">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900">No Documents Found</h3>
                <p className="text-sm text-gray-500 mt-1">Try refining your search keyword or document type filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-xs">Doc Number</th>
                      <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-xs">Date</th>
                      <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-xs">Customer</th>
                      <th className="px-6 py-3.5 text-center font-bold uppercase tracking-wider text-xs">Doc Type</th>
                      <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-xs">Total Value</th>
                      <th className="px-6 py-3.5 text-center font-bold uppercase tracking-wider text-xs">Payment Status</th>
                      <th className="px-6 py-3.5 text-center font-bold uppercase tracking-wider text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSales.map((s) => (
                      <tr key={s._id} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">{s.invoiceNumber}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">{new Date(s.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{s.customerName}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            s.type === 'Return' ? 'bg-red-50 text-red-700 border border-red-200' :
                            s.type === 'Estimate' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            s.type === 'Order' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                            s.type === 'Challan' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            'bg-green-50 text-green-700 border border-green-200'
                          }`}>{s.type || 'Invoice'}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">₹{s.totalAmount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-50 text-yellow-800'}`}>
                            {s.paymentStatus || 'Paid'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(s)}
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-pharmacy-50 hover:text-pharmacy-600 transition-colors"
                              title="Edit Document"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(s._id)}
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 size={14} />
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
      )}

      {/* TAB 3: PAYMENTS IN */}
      {activeSubTab === 'payments-in' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border bg-white border-gray-200 shadow-sm">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <IndianRupee size={16} className="text-pharmacy-600" />
              Collect Outstanding Sales Payments
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Collect receipts payments against pending estimates, delivery orders, or unpaid invoices.</p>
          </div>
          <div className="overflow-hidden border rounded-xl bg-white border-gray-200 shadow-sm">
            {pendingPayments.length === 0 ? (
              <div className="text-center py-16">
                <IndianRupee size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900">No Outstanding Payments</h3>
                <p className="text-sm text-gray-500 mt-1">All processed sales documents have been fully settled.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-xs">Doc Number</th>
                      <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-xs">Customer</th>
                      <th className="px-6 py-3.5 text-center font-bold uppercase tracking-wider text-xs">Type</th>
                      <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-xs">Amount Due</th>
                      <th className="px-6 py-3.5 text-center font-bold uppercase tracking-wider text-xs">Outstanding Status</th>
                      <th className="px-6 py-3.5 text-center font-bold uppercase tracking-wider text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingPayments.map((s) => (
                      <tr key={s._id} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">{s.invoiceNumber}</span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{s.customerName}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">{s.type}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-rose-600">₹{s.totalAmount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">{s.paymentStatus}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => { setPaymentTarget(s); setCollectMethod('Cash'); setView('payment'); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-pharmacy-600 hover:bg-pharmacy-500 shadow-sm"
                          >
                            <IndianRupee size={12} /> Collect Payment
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
      )}
    </div>
  );
};

export default Sales;
