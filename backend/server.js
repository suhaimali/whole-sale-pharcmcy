const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Globally mock isDbConnected because we are now using a real in-memory MongoDB
// via mongodb-memory-server, so the fake fallback logic in controllers is no longer needed.
global.isDbConnected = () => true;
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const cashRoutes = require('./routes/cashRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/cash', cashRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Wholesale Pharmacy ERP API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected Successfully');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.log(`[ERP Status] MongoDB connection offline (${error.message})`);
    console.log('[ERP Status] Application is running successfully in local in-memory fallback database mode.');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const uriWithOptions = mongoUri.includes('?') ? `${mongoUri}&retryWrites=false` : `${mongoUri}?retryWrites=false`;
      
      await mongoose.connect(uriWithOptions);
      console.log('In-memory MongoDB Connected Successfully');
      
      const User = require('./models/User');
      const adminCount = await User.countDocuments({ username: 'admin' });
      if (adminCount === 0) {
        await User.create({
          _id: '123456789012345678901234',
          username: 'admin',
          email: 'admin@pharmacy.com',
          password: 'admin',
          role: 'Administrator',
          isActive: true
        });
        console.log('Admin user seeded in memory db (admin / admin)');
      }

      const Product = require('./models/Product');
      const Sale = require('./models/Sale');
      const Purchase = require('./models/Purchase');
      const Expense = require('./models/Expense');
      const CashTx = require('./models/CashTx');

      const productCount = await Product.countDocuments();
      if (productCount === 0) {
        const p1 = await Product.create({
          name: 'Paracetamol 500mg',
          sku: 'PAR-500',
          category: 'Medicines',
          unit: 'Box',
          quantity: 100,
          price: 5.99,
          costPrice: 2.50,
          supplier: 'PharmaCorp',
        });
        const p2 = await Product.create({
          name: 'Vitamin C 1000mg',
          sku: 'VITC-1000',
          category: 'OTC Drugs',
          unit: 'Bottle',
          quantity: 50,
          price: 12.99,
          costPrice: 6.00,
          supplier: 'HealthPlus',
        });
        
        await Product.create({
          name: 'Amoxicillin 250mg',
          sku: 'AMOX-250',
          category: 'Medicines',
          unit: 'Box',
          quantity: 45,
          price: 120.00,
          costPrice: 85.00,
          supplier: 'Global Meds Ltd.',
        });
        
        await Product.create({
          name: 'Surgical Masks (50 Pack)',
          sku: 'SUR-MASK-50',
          category: 'Surgicals',
          unit: 'Pack',
          quantity: 300,
          price: 50.00,
          costPrice: 20.00,
          supplier: 'Surgical Supplies Inc.',
        });
        
        await Product.create({
          name: 'Vape Pen Starter Kit',
          sku: 'VAP-PEN-01',
          category: 'Vapes & Devices',
          unit: 'Piece',
          quantity: 20,
          price: 450.00,
          costPrice: 200.00,
          supplier: 'VapeWorld',
        });
        
        await Product.create({
          name: 'Ibuprofen 400mg',
          sku: 'IBU-400',
          category: 'Medicines',
          unit: 'Strip',
          quantity: 80,
          price: 22.00,
          costPrice: 10.00,
          supplier: 'PharmaCorp',
        });

        await Sale.create({
          invoiceNumber: 'INV-1001',
          type: 'Invoice',
          customerName: 'Walk-in Customer',
          items: [{ productId: String(p1._id), name: p1.name, quantity: 2, price: p1.price }],
          subTotal: 11.98,
          discount: 0,
          tax: 0,
          totalAmount: 11.98,
          paymentMethod: 'Cash',
          paymentStatus: 'Paid',
          salesRep: 'admin'
        });

        await Purchase.create({
          purchaseOrderNumber: 'PO-1001',
          type: 'Bill',
          supplierName: 'HealthPlus',
          items: [{ name: p2.name, category: p2.category, quantity: 20, costPrice: p2.costPrice, price: p2.price }],
          totalAmount: 120.00,
          paymentStatus: 'Paid',
          paymentMethod: 'Bank Transfer',
          status: 'Received',
          purchaseStaff: 'admin'
        });

        await Expense.create({
          title: 'Monthly Office Rent',
          amount: 500.00,
          category: 'Rent',
          recordedBy: 'admin',
          expenseDate: new Date()
        });
        
        await Expense.create({
          title: 'Electricity Bill',
          amount: 120.50,
          category: 'Electricity',
          recordedBy: 'admin',
          expenseDate: new Date()
        });

        await CashTx.create({
          txType: 'Cash In',
          amount: 5000.00,
          source: 'Deposit',
          referenceNumber: 'DEP-001',
          notes: 'Initial Till Float',
          recordedBy: 'admin'
        });
        
        await CashTx.create({
          txType: 'Cash In',
          amount: 11.98,
          source: 'Sale',
          referenceNumber: 'INV-1001',
          notes: 'Cash Sale',
          recordedBy: 'admin'
        });

        console.log('Dummy database data seeded successfully for all pages');
      }
      
      // Start server ONLY after in-memory DB is fully ready
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (memErr) {
      console.error('Failed to start in-memory database:', memErr);
    }
  }
};

startServer();

// Trigger nodemon restart
