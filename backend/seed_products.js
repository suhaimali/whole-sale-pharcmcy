const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://infosuhaimsoft_db_user:binger@cluster0.8bcakst.mongodb.net/pharmacy_erp?appName=Cluster0&retryWrites=false';

// Append retryWrites=false to URI
let finalUri = MONGODB_URI;
if (!finalUri.includes('retryWrites=')) {
  finalUri += (finalUri.includes('?') ? '&' : '?') + 'retryWrites=false';
}

const dummyProducts = [
  {
    name: 'Paracetamol 500mg',
    sku: 'MED-PARA-500',
    category: 'Medicines',
    unit: 'Strip',
    quantity: 150,
    price: 15.50,
    costPrice: 8.00,
    batchNumber: 'BT-2023-A1',
    expiryDate: new Date('2025-12-31'),
    supplier: 'PharmaCorp Inc.',
    description: 'Pain reliever and fever reducer.',
  },
  {
    name: 'Amoxicillin 250mg',
    sku: 'MED-AMOX-250',
    category: 'Medicines',
    unit: 'Box',
    quantity: 45,
    price: 120.00,
    costPrice: 85.00,
    batchNumber: 'BT-2023-B2',
    expiryDate: new Date('2024-06-15'),
    supplier: 'Global Meds Ltd.',
    description: 'Antibiotic used to treat bacterial infections.',
  },
  {
    name: 'Vitamin C 1000mg',
    sku: 'OTC-VITC-1000',
    category: 'OTC Drugs',
    unit: 'Bottle',
    quantity: 200,
    price: 25.00,
    costPrice: 12.50,
    batchNumber: 'BT-2024-V1',
    expiryDate: new Date('2026-01-01'),
    supplier: 'Health & Wellness Co.',
    description: 'Immune system support supplement.',
  },
  {
    name: 'Surgical Masks (Pack of 50)',
    sku: 'SUR-MASK-50',
    category: 'Surgicals',
    unit: 'Pack',
    quantity: 300,
    price: 50.00,
    costPrice: 20.00,
    batchNumber: 'BT-2023-S1',
    expiryDate: null,
    supplier: 'Surgical Supplies Inc.',
    description: '3-ply disposable surgical masks.',
  },
  {
    name: 'Vape Pen Starter Kit',
    sku: 'VAP-PEN-01',
    category: 'Vapes & Devices',
    unit: 'Piece',
    quantity: 20,
    price: 450.00,
    costPrice: 200.00,
    batchNumber: 'BT-2024-VP1',
    expiryDate: null,
    supplier: 'VapeWorld Distributors',
    description: 'Rechargeable vape pen starter kit with 1 pod.',
  },
  {
    name: 'Ibuprofen 400mg',
    sku: 'MED-IBU-400',
    category: 'Medicines',
    unit: 'Strip',
    quantity: 80,
    price: 22.00,
    costPrice: 10.00,
    batchNumber: 'BT-2023-I1',
    expiryDate: new Date('2025-08-20'),
    supplier: 'PharmaCorp Inc.',
    description: 'Nonsteroidal anti-inflammatory drug (NSAID).',
  }
];

mongoose.connect(finalUri)
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      // Clear existing products
      await Product.deleteMany({});
      console.log('Cleared existing products');
      
      // Insert dummy products
      await Product.insertMany(dummyProducts);
      console.log('Successfully inserted dummy products');
      
      process.exit(0);
    } catch (err) {
      console.error('Error inserting dummy data:', err);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
