const express = require('express');
const productController = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProduct);

// Protected routes
router.use(protect);

// Get user's own products
router.get('/my-products', productController.getMyProducts);

// Create product
router.post('/', validateProduct, productController.createProduct);

// Update/Delete product routes
router.route('/:id')
  .patch(productController.updateProduct)
  .delete(productController.deleteProduct);

module.exports = router;