// Shared in-memory data store for fallback mode when MongoDB is not connected
const mongoose = require('mongoose');

const localProducts = [
  {
    _id: 'mock-prod-1',
    name: 'Paracetamol 500mg (Panadol)',
    sku: 'PCM-500-PAN',
    category: 'Medicines',
    unit: 'Box',
    quantity: 120,
    price: 15.00,
    costPrice: 9.50,
    batchNumber: 'B-PAN-098',
    expiryDate: new Date('2027-12-31'),
    supplier: 'GlaxoSmithKline LLC',
    description: 'Analgesic and antipyretic for relief of fever and pain.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'mock-prod-2',
    name: 'Amoxicillin 250mg Capsule',
    sku: 'AMX-250-GLO',
    category: 'Medicines',
    unit: 'Strip',
    quantity: 8, // Low stock warning!
    price: 45.00,
    costPrice: 28.00,
    batchNumber: 'B-AMX-112',
    expiryDate: new Date('2026-09-15'), // Expiring soon!
    supplier: 'Global Meds Ltd',
    description: 'Broad-spectrum beta-lactam antibiotic used to treat bacterial infections.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'mock-prod-3',
    name: 'VaporLabs Classic Vape Pod 2%',
    sku: 'VPE-POD-001',
    category: 'Vapes & Devices',
    unit: 'Piece',
    quantity: 340,
    price: 24.99,
    costPrice: 12.50,
    batchNumber: 'B-VPE-042',
    expiryDate: new Date('2027-05-20'),
    supplier: 'VaporLabs Inc',
    description: 'Closed-pod system pre-filled with 2% Nicotine Salt eliquid.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'mock-prod-4',
    name: 'Disposable Vaporizer 5000 Puffs',
    sku: 'VPE-DISP-5K',
    category: 'Vapes & Devices',
    unit: 'Piece',
    quantity: 12, // Low stock warning!
    price: 35.00,
    costPrice: 18.00,
    batchNumber: 'B-VPE-099',
    expiryDate: new Date('2027-02-10'),
    supplier: 'VaporLabs Inc',
    description: 'Rechargeable disposable vape pen with mesh coil, 5000 puffs capacity.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'mock-prod-5',
    name: 'Aspirin 100mg Low Dose',
    sku: 'ASP-100-BAY',
    category: 'OTC Drugs',
    unit: 'Bottle',
    quantity: 450,
    price: 8.50,
    costPrice: 4.20,
    batchNumber: 'B-BAY-776',
    expiryDate: new Date('2028-01-01'),
    supplier: 'Bayer Pharmaceuticals',
    description: 'Low dose aspirin for cardiovascular protection and pain relief.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'mock-prod-6',
    name: 'Disposable Syringe 5ml (Luer Lock)',
    sku: 'SYR-005-LL',
    category: 'Surgicals',
    unit: 'Box',
    quantity: 1500,
    price: 1.20,
    costPrice: 0.40,
    batchNumber: 'B-SYR-554',
    expiryDate: new Date('2030-06-30'),
    supplier: 'Becton Dickinson',
    description: 'Sterile single-use syringe with clear barrel and bold scale markings.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'mock-prod-7',
    name: 'Vape Mod Battery Kit 80W',
    sku: 'VPE-BAT-80W',
    category: 'Vapes & Devices',
    unit: 'Piece',
    quantity: 5, // Low stock warning!
    price: 79.99,
    costPrice: 45.00,
    batchNumber: 'B-MOD-88A',
    expiryDate: new Date('2029-01-01'),
    supplier: 'VaporLabs Inc',
    description: 'High-performance vape mod with adjustable wattage and digital screen.',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

const localSales = [
  {
    _id: 'mock-sale-1',
    invoiceNumber: 'INV-2026-0001',
    customerName: 'Healthy Care Pharmacy',
    type: 'Invoice',
    referenceNumber: '',
    items: [
      { productId: 'mock-prod-1', name: 'Paracetamol 500mg (Panadol)', quantity: 20, price: 15.00 },
      { productId: 'mock-prod-5', name: 'Aspirin 100mg Low Dose', quantity: 50, price: 8.50 },
    ],
    subTotal: 725.00,
    discount: 25.00,
    tax: 35.00,
    totalAmount: 735.00,
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Paid',
    salesRep: 'alivpsuahim',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
  {
    _id: 'mock-sale-2',
    invoiceNumber: 'INV-2026-0002',
    customerName: 'Metro Vape & Wellness',
    type: 'Invoice',
    referenceNumber: '',
    items: [
      { productId: 'mock-prod-3', name: 'VaporLabs Classic Vape Pod 2%', quantity: 40, price: 24.99 },
      { productId: 'mock-prod-4', name: 'Disposable Vaporizer 5000 Puffs', quantity: 10, price: 35.00 },
    ],
    subTotal: 1349.60,
    discount: 50.00,
    tax: 64.98,
    totalAmount: 1364.58,
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    salesRep: 'alivpsuahim',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    _id: 'mock-sale-3',
    invoiceNumber: 'INV-2026-0003',
    customerName: 'Downtown Medical Store',
    type: 'Invoice',
    referenceNumber: '',
    items: [
      { productId: 'mock-prod-1', name: 'Paracetamol 500mg (Panadol)', quantity: 5, price: 15.00 },
      { productId: 'mock-prod-2', name: 'Amoxicillin 250mg Capsule', quantity: 2, price: 45.00 },
    ],
    subTotal: 165.00,
    discount: 0.00,
    tax: 8.25,
    totalAmount: 173.25,
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
    salesRep: 'alivpsuahim',
    createdAt: new Date(), // Today
  }
];

const localPurchases = [
  {
    _id: 'mock-pur-1',
    purchaseOrderNumber: 'PO-2026-0001',
    supplierName: 'GlaxoSmithKline LLC',
    type: 'Bill',
    referenceNumber: '',
    items: [
      { name: 'Paracetamol 500mg (Panadol)', category: 'Medicines', quantity: 150, costPrice: 9.50, price: 15.00, batchNumber: 'B-PAN-098', expiryDate: new Date('2027-12-31') }
    ],
    totalAmount: 1425.00,
    paymentStatus: 'Paid',
    status: 'Received',
    purchaseStaff: 'alivpsuahim',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    _id: 'mock-pur-2',
    purchaseOrderNumber: 'PO-2026-0002',
    supplierName: 'VaporLabs Inc',
    type: 'Order',
    referenceNumber: '',
    items: [
      { name: 'VaporLabs Classic Vape Pod 2%', category: 'Vapes & Devices', quantity: 400, costPrice: 12.50, price: 24.99, batchNumber: 'B-VPE-042', expiryDate: new Date('2027-05-20') },
      { name: 'Disposable Vaporizer 5000 Puffs', category: 'Vapes & Devices', quantity: 50, costPrice: 18.00, price: 35.00, batchNumber: 'B-VPE-099', expiryDate: new Date('2027-02-10') }
    ],
    totalAmount: 5900.00,
    paymentStatus: 'Pending',
    status: 'Ordered',
    purchaseStaff: 'alivpsuahim',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  }
];

const localExpenses = [
  {
    _id: 'mock-exp-1',
    title: 'Monthly Warehouse Rent',
    amount: 1500.00,
    category: 'Rent',
    expenseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    recordedBy: 'alivpsuahim',
    createdAt: new Date(),
  },
  {
    _id: 'mock-exp-2',
    title: 'Internet & Telephone bill',
    amount: 120.00,
    category: 'Internet',
    expenseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    recordedBy: 'alivpsuahim',
    createdAt: new Date(),
  }
];

const localCashTxs = [
  {
    _id: 'mock-cashtx-1',
    txType: 'Cash In',
    amount: 5000.00,
    source: 'Deposit',
    referenceNumber: 'SAFE-START',
    notes: 'Initial cash drawer float / injection',
    recordedBy: 'alivpsuahim',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    _id: 'mock-cashtx-2',
    txType: 'Cash In',
    amount: 350.00,
    source: 'Sale',
    referenceNumber: 'INV-2026-8801',
    notes: 'Sales Invoice Cash Payment',
    recordedBy: 'alivpsuahim',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    _id: 'mock-cashtx-3',
    txType: 'Cash Out',
    amount: 450.00,
    source: 'Expense',
    referenceNumber: 'EXP-1',
    notes: 'Office Rent Cash Payment',
    recordedBy: 'alivpsuahim',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  }
];

const localUsers = [
  {
    _id: 'mock-user-1',
    username: 'alivpsuahim',
    email: 'alivpsuahim@gmail.com',
    role: 'Administrator',
    isActive: true,
  }
];

const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  localProducts,
  localSales,
  localPurchases,
  localExpenses,
  localCashTxs,
  localUsers,
  isDbConnected,
};
