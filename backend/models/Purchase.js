const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  purchaseOrderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Bill', 'Return', 'Order'],
    default: 'Bill',
  },
  referenceNumber: {
    type: String,
    trim: true,
  },
  supplierName: {
    type: String,
    required: true,
    trim: true,
  },
  items: [
    {
      name: {
        type: String,
        required: true,
      },
      category: {
        type: String,
        required: true,
        enum: ['Medicines', 'OTC Drugs', 'Surgicals', 'Vapes & Devices'],
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      costPrice: {
        type: Number,
        required: true,
        min: 0,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
      batchNumber: {
        type: String,
        trim: true,
      },
      expiryDate: {
        type: Date,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['Paid', 'Pending', 'Unpaid'],
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Bank Transfer'],
    default: 'Cash',
  },
  status: {
    type: String,
    required: true,
    enum: ['Ordered', 'Received', 'Cancelled'],
  },
  purchaseStaff: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
