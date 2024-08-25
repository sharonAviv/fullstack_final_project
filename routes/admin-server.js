const express = require('express');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const { readActivities } = require('./activityLogger');
const { getProducts, addProduct, removeProduct, updateProduct } = require('./persist');
const { verifyToken, verifyAdmin } = require('./middleware'); // Middleware for authentication

// Set up multer storage configuration with a 2 MB file size limit
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../icons')); // Save files in the icons directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Append a timestamp to the original file name
    }
});

// Initialize multer with the defined storage configuration and 2 MB file size limit
const upload = multer({ 
    storage: storage, 
    limits: { fileSize: 2 * 1024 * 1024 } // Set file size limit to 2 MB
});

router.get('/activities', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const activities = await readActivities();
        res.json(activities);
    } catch (error) {
        res.status(500).send({ message: 'Failed to fetch activities' });
    }
});

// Route to handle file uploads and add a product
router.post('/add-product', verifyToken, verifyAdmin, upload.array('images'), async (req, res) => {
    console.log(req.body); // Debugging
    console.log(req.files); // Debugging

    const { name, description, price, stock } = req.body;
    const images = req.files.map(file => `/icons/${file.filename}`);

    try {
        await addProduct({ name, description, price, images, stock });
        res.status(201).send({ message: 'Product added successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Error adding product', error: error.message });
    }
});

// Route to remove a product
router.post('/remove-product', verifyToken, verifyAdmin, async (req, res) => {
    const { productId } = req.body;
    try {
        await removeProduct(productId);
        res.send({ message: 'Product removed successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Error removing product', error: error.message });
    }
});

// Route to get all products
router.get('/products', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const products = await getProducts();
        res.json(products);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching products', error: error.message });
    }
});

// Route to update product information, including file uploads
router.post('/update-product-info', verifyToken, verifyAdmin, upload.array('images'), async (req, res) => {
    const { productId, existingImages = [], ...updateData } = req.body;

    // Add existing images to the updateData
    if (existingImages.length > 0) {
        updateData.images = Array.isArray(existingImages) ? existingImages : [existingImages];
    }

    // If new images were uploaded, add their URLs to the updateData
    if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map(file => `/icons/${file.filename}`);
        updateData.images = updateData.images ? updateData.images.concat(imageUrls) : imageUrls;
    }

    try {
        const updatedProduct = await updateProduct(productId, updateData);
        if (updatedProduct) {
            res.status(200).send({ message: 'Product updated successfully!' });
        } else {
            res.status(404).send({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).send({ message: 'Error updating product', error: error.message });
    }
});

// Error handling middleware for PayloadTooLargeError
router.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).send({
            message: 'File size is too large. Maximum size allowed is 2 MB.'
        });
    }
    next(err);
});

module.exports = router;
