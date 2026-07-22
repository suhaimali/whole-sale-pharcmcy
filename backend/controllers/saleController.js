const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const CashTx = require('../models/CashTx');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res) => {
  if (isDbConnected()) {
    try {
      const sales = await Sale.find({}).sort({ createdAt: -1 });
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const sorted = [...localSales].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  }
};

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private (Admin, Super Admin, Sales Staff)
const createSale = async (req, res) => {
  const { 
    customerName, 
    items, 
    subTotal, 
    discount, 
    tax, 
    totalAmount, 
    paymentMethod, 
    paymentStatus,
    type,
    referenceNumber
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No items in the sale order' });
  }

  const docType = type || 'Invoice';
  const prefix = 
    docType === 'Invoice' ? 'INV' :
    docType === 'Return' ? 'RET' :
    docType === 'Estimate' ? 'EST' :
    docType === 'Order' ? 'SO' : 'DC';

  const invoiceNumber = `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  if (isDbConnected()) {
    try {
      // 1. Process Inventory adjustment depending on transaction type
      if (docType === 'Invoice' || docType === 'Challan') {
        // Deduct Stock
        for (const item of items) {
          const product = await Product.findById(item.productId);
          if (!product) {
            throw new Error(`Product ${item.name} not found`);
          }
          if (product.quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`);
          }
          product.quantity -= item.quantity;
          await product.save();
        }
      } else if (docType === 'Return') {
        // Refund/Add Stock back
        for (const item of items) {
          const product = await Product.findById(item.productId);
          if (product) {
            product.quantity += item.quantity;
            await product.save();
          }
        }
      }

      // 2. Create Sale/Document record
      const sale = new Sale({
        invoiceNumber,
        customerName: customerName || 'Walk-in Customer',
        type: docType,
        referenceNumber: referenceNumber || '',
        items,
        subTotal: Number(subTotal),
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        totalAmount: Number(totalAmount),
        paymentMethod: paymentMethod || 'Cash',
        paymentStatus: paymentStatus || 'Paid',
        salesRep: req.user.username,
      });

      const createdSale = await sale.save();

      // 3. Create Cash record if paid in Cash
      const isCash = paymentMethod === 'Cash' || !paymentMethod;
      const isPaid = paymentStatus === 'Paid';
      if (isCash && (isPaid || docType === 'Return') && docType !== 'Estimate') {
        const txType = docType === 'Return' ? 'Cash Out' : 'Cash In';
        const notes = docType === 'Return' ? 'Sales Return Cash Refund' : `${docType} Payment Received`;
        
        await CashTx.create([{
          txType,
          amount: Number(totalAmount),
          source: 'Sale',
          referenceNumber: invoiceNumber,
          notes,
          recordedBy: req.user.username,
        }]);
      }

      res.status(201).json(createdSale);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    try {
      const productsToUpdate = [];
      
      if (docType === 'Invoice' || docType === 'Challan') {
        for (const item of items) {
          const pIndex = localProducts.findIndex((p) => p._id === item.productId);
          if (pIndex === -1) {
            return res.status(400).json({ message: `Product ${item.name} not found` });
          }
          const product = localProducts[pIndex];
          if (product.quantity < item.quantity) {
            return res.status(400).json({
              message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`,
            });
          }
          productsToUpdate.push({ index: pIndex, newQty: product.quantity - item.quantity });
        }
        
        // Deduct inventory
        productsToUpdate.forEach(({ index, newQty }) => {
          localProducts[index].quantity = newQty;
          localProducts[index].updatedAt = new Date();
        });
      } else if (docType === 'Return') {
        for (const item of items) {
          const pIndex = localProducts.findIndex((p) => p._id === item.productId);
          if (pIndex !== -1) {
            productsToUpdate.push({ index: pIndex, newQty: localProducts[pIndex].quantity + item.quantity });
          }
        }
        
        // Add inventory back
        productsToUpdate.forEach(({ index, newQty }) => {
          localProducts[index].quantity = newQty;
          localProducts[index].updatedAt = new Date();
        });
      }

      // 3. Save sale
      const newSale = {
        _id: 'mock-sale-' + Math.random().toString(36).substr(2, 9),
        invoiceNumber,
        customerName: customerName || 'Walk-in Customer',
        type: docType,
        referenceNumber: referenceNumber || '',
        items,
        subTotal: Number(subTotal),
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        totalAmount: Number(totalAmount),
        paymentMethod: paymentMethod || 'Cash',
        paymentStatus: paymentStatus || 'Paid',
        salesRep: req.user.username,
        createdAt: new Date(),
      };

      localSales.push(newSale);

      // Save to local cash ledger
      const isCash = newSale.paymentMethod === 'Cash' || !newSale.paymentMethod;
      const isPaid = newSale.paymentStatus === 'Paid';
      if (isCash && (isPaid || newSale.type === 'Return') && newSale.type !== 'Estimate') {
        const txType = newSale.type === 'Return' ? 'Cash Out' : 'Cash In';
        const notes = newSale.type === 'Return' ? 'Sales Return Cash Refund' : `${newSale.type} Payment Received`;
        
        localCashTxs.push({
          _id: 'mock-tx-' + Math.random().toString(36).substr(2, 9),
          txType,
          amount: Number(newSale.totalAmount),
          source: 'Sale',
          referenceNumber: newSale.invoiceNumber,
          notes,
          recordedBy: req.user.username,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      res.status(201).json(newSale);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

// @desc    Collect payment against pending invoice/order
// @route   PUT /api/sales/:id/pay
// @access  Private
const collectPayment = async (req, res) => {
  const { paymentMethod } = req.body;
  const payMethod = paymentMethod || 'Cash';

  if (isDbConnected()) {
    try {
      const sale = await Sale.findById(req.params.id);
      if (!sale) {
        return res.status(404).json({ message: 'Sale document not found' });
      }

      sale.paymentStatus = 'Paid';
      sale.paymentMethod = payMethod;
      const updatedSale = await sale.save();

      // If Cash, log inflow
      if (payMethod === 'Cash') {
        await CashTx.create({
          txType: 'Cash In',
          amount: Number(sale.totalAmount),
          source: 'Sale',
          referenceNumber: sale.invoiceNumber,
          notes: 'Collect Payment In (Cash)',
          recordedBy: req.user.username,
        });
      }

      res.json(updatedSale);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const index = localSales.findIndex((s) => s._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Sale document not found' });
    }

    localSales[index].paymentStatus = 'Paid';
    localSales[index].paymentMethod = payMethod;
    const sale = localSales[index];

    // If Cash, log inflow
    if (payMethod === 'Cash') {
      localCashTxs.push({
        _id: 'mock-tx-' + Math.random().toString(36).substr(2, 9),
        txType: 'Cash In',
        amount: Number(sale.totalAmount),
        source: 'Sale',
        referenceNumber: sale.invoiceNumber,
        notes: 'Collect Payment In (Cash)',
        recordedBy: req.user.username,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    res.json(sale);
  }
};

// @desc    Delete a sale
// @route   DELETE /api/sales/:id
// @access  Private
const deleteSale = async (req, res) => {
  if (isDbConnected()) {
    try {
      const sale = await Sale.findById(req.params.id);
      if (!sale) {
        return res.status(404).json({ message: 'Sale document not found' });
      }

      // Reverse inventory deduction
      if (sale.type === 'Invoice' || sale.type === 'Challan') {
        for (const item of sale.items) {
          const product = await Product.findById(item.productId);
          if (product) {
            product.quantity += item.quantity;
            await product.save();
          }
        }
      } else if (sale.type === 'Return') {
        for (const item of sale.items) {
          const product = await Product.findById(item.productId);
          if (product) {
            product.quantity -= item.quantity;
            await product.save();
          }
        }
      }

      await Sale.findByIdAndDelete(req.params.id);
      res.json({ message: 'Sale removed' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const index = localSales.findIndex((s) => s._id === req.params.id);
    if (index !== -1) {
      localSales.splice(index, 1);
    }
    res.json({ message: 'Sale removed' });
  }
};

// @desc    Update a sale
// @route   PUT /api/sales/:id
// @access  Private (Admin, Administrator, Sales Staff)
const updateSale = async (req, res) => {
  const { customerName, type, referenceNumber, items, subTotal, discount, tax, totalAmount, paymentMethod, paymentStatus } = req.body;
  const docType = type || 'Invoice';

  if (isDbConnected()) {
    try {
      const sale = await Sale.findById(req.params.id);
      if (!sale) {
        return res.status(404).json({ message: 'Sale document not found' });
      }

      // Reverse previous inventory effects
      if (sale.type === 'Invoice' || sale.type === 'Challan') {
        for (const item of sale.items) {
          const product = await Product.findById(item.productId);
          if (product) {
            product.quantity += item.quantity;
            await product.save();
          }
        }
      } else if (sale.type === 'Return') {
        for (const item of sale.items) {
          const product = await Product.findById(item.productId);
          if (product) {
            product.quantity -= item.quantity;
            await product.save();
          }
        }
      }

      // Apply new inventory effects
      if (docType === 'Invoice' || docType === 'Challan') {
        for (const item of items) {
          const product = await Product.findById(item.productId);
          if (!product) throw new Error(`Product ${item.name} not found`);
          if (product.quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}.`);
          }
          product.quantity -= item.quantity;
          await product.save();
        }
      } else if (docType === 'Return') {
        for (const item of items) {
          const product = await Product.findById(item.productId);
          if (product) {
            product.quantity += item.quantity;
            await product.save();
          }
        }
      }

      // Update fields
      sale.customerName = customerName || 'Walk-in Customer';
      sale.type = docType;
      sale.referenceNumber = referenceNumber || '';
      sale.items = items;
      sale.subTotal = Number(subTotal);
      sale.discount = Number(discount) || 0;
      sale.tax = Number(tax) || 0;
      sale.totalAmount = Number(totalAmount);
      sale.paymentMethod = paymentMethod || 'Cash';
      sale.paymentStatus = paymentStatus || 'Paid';
      
      const updatedSale = await sale.save();
      res.json(updatedSale);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const index = localSales.findIndex((s) => s._id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Sale document not found' });

    const sale = localSales[index];

    // Reverse previous inventory
    if (sale.type === 'Invoice' || sale.type === 'Challan') {
      for (const item of sale.items) {
        const pIndex = localProducts.findIndex((p) => p._id === item.productId);
        if (pIndex !== -1) localProducts[pIndex].quantity += item.quantity;
      }
    } else if (sale.type === 'Return') {
      for (const item of sale.items) {
        const pIndex = localProducts.findIndex((p) => p._id === item.productId);
        if (pIndex !== -1) localProducts[pIndex].quantity -= item.quantity;
      }
    }

    // Apply new inventory
    if (docType === 'Invoice' || docType === 'Challan') {
      for (const item of items) {
        const pIndex = localProducts.findIndex((p) => p._id === item.productId);
        if (pIndex === -1) return res.status(400).json({ message: `Product ${item.name} not found` });
        if (localProducts[pIndex].quantity < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${item.name}.` });
        }
        localProducts[pIndex].quantity -= item.quantity;
      }
    } else if (docType === 'Return') {
      for (const item of items) {
        const pIndex = localProducts.findIndex((p) => p._id === item.productId);
        if (pIndex !== -1) localProducts[pIndex].quantity += item.quantity;
      }
    }

    localSales[index] = {
      ...sale,
      customerName: customerName || 'Walk-in Customer',
      type: docType,
      referenceNumber: referenceNumber || '',
      items,
      subTotal: Number(subTotal),
      discount: Number(discount) || 0,
      tax: Number(tax) || 0,
      totalAmount: Number(totalAmount),
      paymentMethod: paymentMethod || 'Cash',
      paymentStatus: paymentStatus || 'Paid',
    };

    res.json(localSales[index]);
  }
};

module.exports = {
  getSales,
  createSale,
  collectPayment,
  deleteSale,
  updateSale,
};
