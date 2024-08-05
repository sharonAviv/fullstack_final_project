const express = require('express');
const router = express.Router();
const { searchProducts, retrieveAllProducts } = require('./products'); // Adjust the path as necessary
const { verifyToken } = require('./middleware'); // Middleware for authentication
const { addToCart } = require('./persist'); // Add the function to persist cart items

// Get all products
router.get('/products', async (req, res) => {
    try {
        const products = await retrieveAllProducts();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send({ message: 'Error fetching products' });
    }
});

// Search products
router.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).send({ message: 'Query parameter is required' });
    }
    try {
        const results = await searchProducts(query);
        res.json(results);
    } catch (error) {
        console.error('Error performing search:', error);
        res.status(500).send({ message: 'Error performing search' });
    }
});

// Add product to cart (protected route)
router.post('/add-to-cart', verifyToken, async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).send({ message: 'Product ID is required' });
        }
        await addToCart(req.user.username, productId);
        res.status(200).send({ message: 'Product added to cart successfully' });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).send({ message: 'Error adding product to cart' });
    }
});

module.exports = router;
