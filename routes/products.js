const express = require('express');
const productController = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', productController.getAllProducts);

// Protected user's products route (must be before /:id to avoid conflict)
router.get('/my-products', protect, productController.getMyProducts);

// Public route with ID parameter (must be after specific routes)
router.get('/:id', productController.getProduct);

// Protected routes
router.use(protect);


// Create product
router.post('/', validateProduct, productController.createProduct);

// Update/Delete product routes
router.route('/:id')
  .patch(productController.updateProduct)
  .delete(productController.deleteProduct);

module.exports = router;