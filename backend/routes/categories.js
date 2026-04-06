const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');

router.use(auth);

// Seed default categories if none exist
const DEFAULT_CATEGORIES = [
  { name: 'Food and Drinks', color: '#ef4444', icon: '🍔', subcategories: ['Restaurants', 'Groceries', 'Coffee', 'Fast Food'], isDefault: true },
  { name: 'Shopping', color: '#ec4899', icon: '🛍️', subcategories: ['Clothing', 'Electronics', 'Home', 'Online'], isDefault: true },
  { name: 'Vehicle', color: '#8b5cf6', icon: '🚗', subcategories: ['Fuel', 'Parking', 'Maintenance', 'Insurance'], isDefault: true },
  { name: 'Leisure', color: '#f472b6', icon: '🎉', subcategories: ['Entertainment', 'Sports', 'Hobbies', 'Travel'], isDefault: true },
  { name: 'Transport', color: '#06b6d4', icon: '🚌', subcategories: ['Bus', 'Train', 'Taxi', 'Flights'], isDefault: true },
  { name: 'Bills', color: '#10b981', icon: '📄', subcategories: ['Electricity', 'Water', 'Internet', 'Phone'], isDefault: true },
  { name: 'Housing', color: '#f59e0b', icon: '🏠', subcategories: ['Rent', 'Mortgage', 'Repairs', 'Furniture'], isDefault: true },
  { name: 'Health', color: '#3b82f6', icon: '💊', subcategories: ['Doctor', 'Pharmacy', 'Gym', 'Dental'], isDefault: true },
  { name: 'Income', color: '#10b981', icon: '💰', subcategories: ['Salary', 'Freelance', 'Dividends', 'Other'], isDefault: true },
  { name: 'Other', color: '#6366f1', icon: '📦', subcategories: ['Miscellaneous'], isDefault: true },
];

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    // Get user-specific and default categories
    const categories = await Category.find({
      $or: [{ userid: req.userId }, { isDefault: true }],
    }).sort({ isDefault: -1, name: 1 }).lean();

    // If no defaults seeded yet, seed them (once per system)
    const hasDefaults = await Category.findOne({ isDefault: true });
    if (!hasDefaults) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      const all = await Category.find({
        $or: [{ userid: req.userId }, { isDefault: true }],
      }).sort({ isDefault: -1, name: 1 }).lean();
      return res.json({ categories: all });
    }

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

// POST /api/categories
router.post('/', async (req, res) => {
  try {
    const { name, color, icon, subcategories } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const category = new Category({
      name,
      color: color || '#6366f1',
      icon: icon || '📦',
      subcategories: subcategories || [],
      userid: req.userId,
      isDefault: false,
    });
    await category.save();
    res.status(201).json({ message: 'Category created', category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error creating category' });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      $or: [{ userid: req.userId }, { isDefault: true }],
    });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const { name, color, icon, subcategories } = req.body;
    if (name !== undefined) category.name = name;
    if (color !== undefined) category.color = color;
    if (icon !== undefined) category.icon = icon;
    if (subcategories !== undefined) category.subcategories = subcategories;

    await category.save();
    res.json({ message: 'Category updated', category });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error updating category' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, userid: req.userId });
    if (!category) return res.status(404).json({ message: 'Category not found or cannot delete default' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error deleting category' });
  }
});

// POST /api/categories/:id/subcategories — add subcategory
router.post('/:id/subcategories', async (req, res) => {
  try {
    const { subcategory } = req.body;
    if (!subcategory) return res.status(400).json({ message: 'Subcategory name is required' });

    const category = await Category.findOne({
      _id: req.params.id,
      $or: [{ userid: req.userId }, { isDefault: true }],
    });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (!category.subcategories.includes(subcategory)) {
      category.subcategories.push(subcategory);
      await category.save();
    }
    res.json({ message: 'Subcategory added', category });
  } catch (error) {
    console.error('Add subcategory error:', error);
    res.status(500).json({ message: 'Server error adding subcategory' });
  }
});

// DELETE /api/categories/:id/subcategories/:sub — remove subcategory
router.delete('/:id/subcategories/:sub', async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      $or: [{ userid: req.userId }, { isDefault: true }],
    });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    category.subcategories = category.subcategories.filter(s => s !== req.params.sub);
    await category.save();
    res.json({ message: 'Subcategory removed', category });
  } catch (error) {
    console.error('Remove subcategory error:', error);
    res.status(500).json({ message: 'Server error removing subcategory' });
  }
});

module.exports = router;
