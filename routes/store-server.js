const express = require('express');
const router = express.Router();
const {retrieveAllProducts } = require('./products');
const { verifyToken } = require('./middleware');
const { addToCart, searchProducts } = require('./persist');

// Get all products
router.get('/products', async (req, res) => {
    try {
        const products = await retrieveAllProducts();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});

// Search products
router.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
    }
    try {
        const results = await searchProducts(query);
        res.json(results);
    } catch (error) {
        console.error('Error performing search:', error);
        res.status(500).json({ message: 'Error performing search', error: error.message });
    }
});

// Add product to cart (protected route)
router.post('/add-to-cart', verifyToken, async (req, res) => {
    const { productId } = req.body;
    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
    }
    try {
        await addToCart(req.user.username, productId);
        res.status(200).json({ message: 'Product added to cart successfully' });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Error adding product to cart', error: error.message });
    }
});

module.exports = router;
