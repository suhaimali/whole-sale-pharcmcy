const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Invoice', 'Return', 'Estimate', 'Order', 'Challan'],
    default: 'Invoice',
  },
  referenceNumber: {
    type: String,
    trim: true,
  },
  customerName: {
    type: String,
    default: 'Walk-in Customer',
    trim: true,
  },
  items: [
    {
      productId: {
        type: String, // String to support both MongoDB IDs and memory fallbacks
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
  subTotal: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  tax: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash', 'Card', 'Bank Transfer', 'Credit'],
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['Paid', 'Pending', 'Unpaid'],
  },
  salesRep: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
