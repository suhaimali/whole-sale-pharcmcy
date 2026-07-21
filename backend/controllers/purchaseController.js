const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const CashTx = require('../models/CashTx');

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private
const getPurchases = async (req, res) => {
  if (isDbConnected()) {
    try {
      const purchases = await Purchase.find({}).sort({ createdAt: -1 });
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const sorted = [...localPurchases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  }
};

// @desc    Create new purchase order
// @route   POST /api/purchases
// @access  Private (Admin, Super Admin, Purchase Staff)
const createPurchase = async (req, res) => {
  const { 
    supplierName, 
    items, 
    totalAmount, 
    paymentStatus, 
    paymentMethod,
    status,
    type,
    referenceNumber
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No items in the purchase order' });
  }

  const docType = type || 'Bill';
  const prefix = 
    docType === 'Bill' ? 'PB' :
    docType === 'Return' ? 'PR' : 'PO';

  const purchaseOrderNumber = `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  if (isDbConnected()) {
    try {
      // 1. Log Purchase record
      const purchase = new Purchase({
        purchaseOrderNumber,
        supplierName,
        type: docType,
        referenceNumber: referenceNumber || '',
        items,
        totalAmount: Number(totalAmount),
        paymentStatus: paymentStatus || 'Paid',
        paymentMethod: paymentMethod || 'Cash',
        status: status || 'Received',
        purchaseStaff: req.user.username,
      });

      const createdPurchase = await purchase.save();

      // 2. If status is 'Received', update inventory
      if (status === 'Received') {
        for (const item of items) {
          let product = await Product.findOne({
            name: { $regex: new RegExp(`^${item.name}$`, 'i') }
          });

          if (docType === 'Bill') {
            if (product) {
              product.quantity += Number(item.quantity);
              product.costPrice = Number(item.costPrice);
              product.price = Number(item.price);
              if (item.batchNumber) product.batchNumber = item.batchNumber;
              if (item.expiryDate) product.expiryDate = new Date(item.expiryDate);
              await product.save();
            } else {
              let sku = item.name.substring(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
              await Product.create([{
                name: item.name,
                sku: item.sku || sku,
                category: item.category,
                unit: item.unit || 'Piece',
                quantity: Number(item.quantity),
                costPrice: Number(item.costPrice),
                price: Number(item.price),
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
                supplier: supplierName,
                description: `Imported via Purchase Bill ${purchaseOrderNumber}`
              }]);
            }
          } else if (docType === 'Return') {
            if (product) {
              product.quantity = Math.max(0, product.quantity - Number(item.quantity));
              await product.save();
            }
          }
        }
      }

      // 3. Create Cash record if paid in Cash
      const isCash = (paymentMethod || 'Cash') === 'Cash';
      const isPaid = paymentStatus === 'Paid';
      if (isCash && isPaid) {
        const txType = docType === 'Return' ? 'Cash In' : 'Cash Out';
        const notes = docType === 'Return' ? 'Purchase Return Cash Refund' : 'Supplier Purchase Bill Payment';
        
        await CashTx.create([{
          txType,
          amount: Number(totalAmount),
          source: 'Purchase',
          referenceNumber: purchaseOrderNumber,
          notes,
          recordedBy: req.user.username,
        }]);
      }

      res.status(201).json(createdPurchase);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    try {
      const newPurchase = {
        _id: 'mock-pur-' + Math.random().toString(36).substr(2, 9),
        purchaseOrderNumber,
        supplierName,
        type: docType,
        referenceNumber: referenceNumber || '',
        items,
        totalAmount: Number(totalAmount),
        paymentStatus: paymentStatus || 'Paid',
        paymentMethod: paymentMethod || 'Cash',
        status: status || 'Received',
        purchaseStaff: req.user.username,
        createdAt: new Date(),
      };

      // If received, update in-memory products
      if (status === 'Received') {
        for (const item of items) {
          const pIndex = localProducts.findIndex(
            (p) => p.name.toLowerCase() === item.name.toLowerCase()
          );

          if (docType === 'Bill') {
            if (pIndex !== -1) {
              localProducts[pIndex].quantity += Number(item.quantity);
              localProducts[pIndex].costPrice = Number(item.costPrice);
              localProducts[pIndex].price = Number(item.price);
              if (item.batchNumber) localProducts[pIndex].batchNumber = item.batchNumber;
              if (item.expiryDate) localProducts[pIndex].expiryDate = new Date(item.expiryDate);
              localProducts[pIndex].updatedAt = new Date();
            } else {
              let sku = item.name.substring(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
              localProducts.push({
                _id: 'mock-prod-' + Math.random().toString(36).substr(2, 9),
                name: item.name,
                sku: item.sku || sku,
                category: item.category,
                unit: item.unit || 'Piece',
                quantity: Number(item.quantity),
                costPrice: Number(item.costPrice),
                price: Number(item.price),
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                supplier: supplierName,
                description: `Imported via Purchase Bill ${purchaseOrderNumber}`,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          } else if (docType === 'Return') {
            if (pIndex !== -1) {
              localProducts[pIndex].quantity = Math.max(0, localProducts[pIndex].quantity - Number(item.quantity));
              localProducts[pIndex].updatedAt = new Date();
            }
          }
        }
      }

      // Save to local cash ledger
      const isCash = (newPurchase.paymentMethod || 'Cash') === 'Cash';
      const isPaid = newPurchase.paymentStatus === 'Paid';
      if (isCash && isPaid) {
        const txType = docType === 'Return' ? 'Cash In' : 'Cash Out';
        const notes = docType === 'Return' ? 'Purchase Return Cash Refund' : 'Supplier Purchase Bill Payment';
        
        localCashTxs.push({
          _id: 'mock-tx-' + Math.random().toString(36).substr(2, 9),
          txType,
          amount: Number(newPurchase.totalAmount),
          source: 'Purchase',
          referenceNumber: newPurchase.purchaseOrderNumber,
          notes,
          recordedBy: req.user.username,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      localPurchases.push(newPurchase);
      res.status(201).json(newPurchase);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

// @desc    Collect payment out on a pending purchase bill
// @route   PUT /api/purchases/:id/pay
// @access  Private
const collectPayment = async (req, res) => {
  const { paymentMethod } = req.body;
  const payMethod = paymentMethod || 'Cash';

  if (isDbConnected()) {
    try {
      const purchase = await Purchase.findById(req.params.id);
      if (!purchase) return res.status(404).json({ message: 'Purchase bill not found' });

      purchase.paymentStatus = 'Paid';
      purchase.paymentMethod = payMethod;
      const updated = await purchase.save();

      if (payMethod === 'Cash') {
        await CashTx.create({
          txType: 'Cash Out',
          amount: Number(purchase.totalAmount),
          source: 'Purchase',
          referenceNumber: purchase.purchaseOrderNumber,
          notes: 'Supplier Payment Out (Cash)',
          recordedBy: req.user.username,
        });
      }

      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    const index = localPurchases.findIndex((p) => p._id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Purchase bill not found' });

    localPurchases[index].paymentStatus = 'Paid';
    localPurchases[index].paymentMethod = payMethod;
    const purchase = localPurchases[index];

    if (payMethod === 'Cash') {
      localCashTxs.push({
        _id: 'mock-tx-' + Math.random().toString(36).substr(2, 9),
        txType: 'Cash Out',
        amount: Number(purchase.totalAmount),
        source: 'Purchase',
        referenceNumber: purchase.purchaseOrderNumber,
        notes: 'Supplier Payment Out (Cash)',
        recordedBy: req.user.username,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    res.json(purchase);
  }
};

// @desc    Delete a purchase
// @route   DELETE /api/purchases/:id
// @access  Private
const deletePurchase = async (req, res) => {
  if (isDbConnected()) {
    try {
      const purchase = await Purchase.findById(req.params.id);
      if (!purchase) {
        return res.status(404).json({ message: 'Purchase document not found' });
      }

      // Reverse inventory logic
      if (purchase.type === 'Bill' && purchase.status === 'Received') {
        for (const item of purchase.items) {
          const product = await Product.findById(item.productId || item._id);
          // Note: createPurchase might not save productId reliably if it's a new product, but we try:
          if (product) {
            product.quantity = Math.max(0, product.quantity - item.quantity);
            await product.save();
          }
        }
      } else if (purchase.type === 'Return') {
        for (const item of purchase.items) {
          const product = await Product.findById(item.productId || item._id);
          if (product) {
            product.quantity += item.quantity;
            await product.save();
          }
        }
      }

      await Purchase.findByIdAndDelete(req.params.id);
      res.json({ message: 'Purchase removed' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const index = localPurchases.findIndex((p) => p._id === req.params.id);
    if (index !== -1) {
      localPurchases.splice(index, 1);
    }
    res.json({ message: 'Purchase removed' });
  }
};

// @desc    Update a purchase
// @route   PUT /api/purchases/:id
// @access  Private
const updatePurchase = async (req, res) => {
  if (isDbConnected()) {
    try {
      const purchase = await Purchase.findById(req.params.id);
      if (!purchase) {
        return res.status(404).json({ message: 'Purchase not found' });
      }

      // Reverse old inventory
      if (purchase.type === 'Bill' && purchase.status === 'Received') {
        for (const item of purchase.items) {
          const product = await Product.findById(item.productId || item._id);
          if (product) {
            product.quantity = Math.max(0, product.quantity - item.quantity);
            await product.save();
          }
        }
      } else if (purchase.type === 'Return') {
        for (const item of purchase.items) {
          const product = await Product.findById(item.productId || item._id);
          if (product) {
            product.quantity += item.quantity;
            await product.save();
          }
        }
      }

      // Apply new inventory
      const { purchaseOrderNumber, supplierName, type: docType, referenceNumber, items, totalAmount, paymentMethod, paymentStatus, status } = req.body;

      if (docType === 'Bill' && status === 'Received') {
        for (const item of items) {
          const product = await Product.findById(item.productId || item._id);
          if (product) {
            product.quantity += Number(item.quantity);
            await product.save();
          }
        }
      } else if (docType === 'Return') {
        for (const item of items) {
          const product = await Product.findById(item.productId || item._id);
          if (product) {
            product.quantity = Math.max(0, product.quantity - Number(item.quantity));
            await product.save();
          }
        }
      }

      purchase.purchaseOrderNumber = purchaseOrderNumber;
      purchase.supplierName = supplierName;
      purchase.type = docType;
      purchase.referenceNumber = referenceNumber;
      purchase.items = items;
      purchase.totalAmount = totalAmount;
      purchase.paymentMethod = paymentMethod;
      purchase.paymentStatus = paymentStatus;
      purchase.status = status;

      const updatedPurchase = await purchase.save();
      res.json(updatedPurchase);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const index = localPurchases.findIndex(p => p._id === req.params.id);
    if (index !== -1) {
      localPurchases[index] = { ...localPurchases[index], ...req.body, updatedAt: new Date() };
      res.json(localPurchases[index]);
    } else {
      res.status(404).json({ message: 'Purchase not found' });
    }
  }
};

module.exports = {
  getPurchases,
  createPurchase,
  collectPayment,
  deletePurchase,
  updatePurchase,
};
