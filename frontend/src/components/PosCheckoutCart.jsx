import React from 'react';
import { ShoppingCart, ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';

const PosCheckoutCart = ({
  setIsMobileCartOpen,
  cart,
  updateCartQty,
  removeFromCart,
  docType,
  setDocType,
  referenceNumber,
  setReferenceNumber,
  customerName,
  setCustomerName,
  paymentMethod,
  setPaymentMethod,
  discount,
  setDiscount,
  subTotal,
  totalAmount,
  handleCheckout,
  inputClass
}) => {
  return (
    <div className="flex flex-col bg-white h-full min-h-[75vh] rounded-xl border border-gray-200 shadow-sm animate-fadeIn lg:hidden">
      <div className="p-4 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center gap-3 border-b pb-3 mb-4">
            <button onClick={() => setIsMobileCartOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100 border border-gray-200 text-gray-600">
              <ArrowLeft size={18} />
            </button>
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <ShoppingCart size={18} className="text-pharmacy-600" /> Checkout Cart
            </h3>
          </div>
          <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-10">Cart is empty. Select products on the POS grid.</p>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold truncate text-gray-900">{item.name}</h5>
                    <span className="text-[9px] text-gray-400 font-mono">₹{item.price.toFixed(2)} ea</span>
                  </div>
                  <div className="flex items-center gap-1.5 border rounded-lg px-1 py-0.5 border-gray-200">
                    <button onClick={() => updateCartQty(item.productId, -1)} className="p-0.5"><Minus size={12} /></button>
                    <span className="font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateCartQty(item.productId, 1)} className="p-0.5"><Plus size={12} /></button>
                  </div>
                  <span className="font-extrabold text-right w-14">₹{(item.price * item.quantity).toFixed(2)}</span>
                  <button onClick={() => removeFromCart(item.productId)} className="text-red-500 hover:bg-red-50 p-1 rounded-full"><Trash2 size={14} /></button>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="border-t pt-4 space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold mb-1 tracking-wide text-gray-500">Doc Type</label>
              <select value={docType} onChange={(e) => { setDocType(e.target.value); if (e.target.value !== 'Return') setReferenceNumber(''); }} className={inputClass}>
                <option value="Invoice">Sales Invoice</option>
                <option value="Return">Sales Return</option>
                <option value="Estimate">Estimate</option>
                <option value="Order">Sales Order</option>
                <option value="Challan">Delivery Challan</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold mb-1 tracking-wide text-gray-500">Reference</label>
              <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="Optional ref" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold mb-1 tracking-wide text-gray-500">Customer Name</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in Customer" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold mb-1 tracking-wide text-gray-500">Pay Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit">Credit</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold mb-1 tracking-wide text-gray-500">Discount</label>
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" className={inputClass} />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border text-xs space-y-1.5 border-gray-100">
            <div className="flex justify-between text-gray-600"><span>Subtotal:</span><span>₹{subTotal.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-sm text-gray-900 border-t pt-1.5 mt-1 border-gray-200">
              <span>Total:</span><span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
          <button onClick={handleCheckout} disabled={cart.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold text-white bg-pharmacy-600 hover:bg-pharmacy-500 disabled:opacity-50 transition-colors shadow">
            Confirm & Complete Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosCheckoutCart;
