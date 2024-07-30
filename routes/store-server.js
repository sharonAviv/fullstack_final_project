const express = require('express');
const router = express.Router();
const { getProducts, searchProducts } = require('./products');
const { verifyToken } = require('./middleware');

router.get('/products', async (req, res) => {
    try {
        const products = await getProducts();
        res.json(products);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching products' });
    }
});

router.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).send({ message: 'Query parameter is required' });
    }
    try {
        const results = await searchProducts(query);
        res.json(results);
    } catch (error) {
        res.status(500).send({ message: 'Error performing search' });
    }
});

router.post('/add-to-cart', verifyToken, async (req, res) => {
    // Assuming you have logic here to add products to the cart
    res.send({ message: 'Product added to cart successfully' });
});

module.exports = router;
