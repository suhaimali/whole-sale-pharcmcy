const Product = require('../models/Product');
const { localProducts, isDbConnected } = require('./mockData');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  const search = req.query.search || '';
  const category = req.query.category || '';

  if (isDbConnected()) {
    try {
      const query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
        ];
      }
      if (category) {
        query.category = category;
      }
      const products = await Product.find(query).sort({ createdAt: -1 });
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    let filtered = [...localProducts];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s)
      );
    }
    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }
    // Sort descending by date/id
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(filtered);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Admin, Super Admin, Inventory Staff)
const createProduct = async (req, res) => {
  const { name, sku, category, unit, quantity, price, costPrice, batchNumber, expiryDate, supplier, description } = req.body;

  if (isDbConnected()) {
    try {
      const productExists = await Product.findOne({ sku });
      if (productExists) {
        return res.status(400).json({ message: `Product with SKU ${sku} already exists` });
      }

      const product = await Product.create({
        name,
        sku,
        category,
        unit: unit || 'Piece',
        quantity: Number(quantity) || 0,
        price: Number(price) || 0,
        costPrice: Number(costPrice) || 0,
        batchNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        supplier,
        description,
      });

      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const skuExists = localProducts.some((p) => p.sku === sku);
    if (skuExists) {
      return res.status(400).json({ message: `Product with SKU ${sku} already exists` });
    }

    const newProduct = {
      _id: 'mock-prod-' + Math.random().toString(36).substr(2, 9),
      name,
      sku,
      category,
      unit: unit || 'Piece',
      quantity: Number(quantity) || 0,
      price: Number(price) || 0,
      costPrice: Number(costPrice) || 0,
      batchNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      supplier,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    localProducts.push(newProduct);
    res.status(201).json(newProduct);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Admin, Super Admin, Inventory Staff)
const updateProduct = async (req, res) => {
  const { name, sku, category, unit, quantity, price, costPrice, batchNumber, expiryDate, supplier, description } = req.body;

  if (isDbConnected()) {
    try {
      const product = await Product.findById(req.params.id);

      if (product) {
        product.name = name || product.name;
        product.sku = sku || product.sku;
        product.category = category || product.category;
        product.unit = unit || product.unit;
        product.quantity = quantity !== undefined ? Number(quantity) : product.quantity;
        product.price = price !== undefined ? Number(price) : product.price;
        product.costPrice = costPrice !== undefined ? Number(costPrice) : product.costPrice;
        product.batchNumber = batchNumber !== undefined ? batchNumber : product.batchNumber;
        product.expiryDate = expiryDate ? new Date(expiryDate) : product.expiryDate;
        product.supplier = supplier !== undefined ? supplier : product.supplier;
        product.description = description !== undefined ? description : product.description;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const index = localProducts.findIndex((p) => p._id === req.params.id);

    if (index !== -1) {
      const product = localProducts[index];
      localProducts[index] = {
        ...product,
        name: name || product.name,
        sku: sku || product.sku,
        category: category || product.category,
        unit: unit || product.unit,
        quantity: quantity !== undefined ? Number(quantity) : product.quantity,
        price: price !== undefined ? Number(price) : product.price,
        costPrice: costPrice !== undefined ? Number(costPrice) : product.costPrice,
        batchNumber: batchNumber !== undefined ? batchNumber : product.batchNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : product.expiryDate,
        supplier: supplier !== undefined ? supplier : product.supplier,
        description: description !== undefined ? description : product.description,
        updatedAt: new Date(),
      };
      res.json(localProducts[index]);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin, Super Admin)
const deleteProduct = async (req, res) => {
  if (isDbConnected()) {
    try {
      const product = await Product.findById(req.params.id);

      if (product) {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product removed' });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    // In-memory fallback
    const index = localProducts.findIndex((p) => p._id === req.params.id);

    if (index !== -1) {
      localProducts.splice(index, 1);
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
