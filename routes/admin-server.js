const express = require('express');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const { readActivities } = require('./activityLogger');
const { getProducts, addProduct, removeProduct, updateProduct, saveGame } = require('./persist');
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
    console.log('Request body:', req.body); // Debugging
    console.log('Uploaded files:', req.files); // Debugging

    const { name, description, price, stock, imageUrls = [] } = req.body;

    // Handle image URLs from the request body
    let urlsArray = Array.isArray(imageUrls) ? imageUrls : [imageUrls]; // Ensure it's an array
    console.log('Image URLs:', urlsArray);

    // Handle uploaded image files
    const images = req.files.map(file => `/icons/${file.filename}`);
    console.log('Images from files:', images);

    // Combine URLs and uploaded images into a single array
    const combinedImages = [...images, ...urlsArray];
    console.log('Combined images array:', combinedImages);

    try {
        await addProduct({ name, description, price, images: combinedImages, stock });
        res.status(201).send({ message: 'Product added successfully' });
    } catch (error) {
        console.error('Error adding product:', error);
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
    console.log('Received request to update product info'); // Debugging log
    console.log('Request body:', req.body); // Log the request body for debugging
    console.log('Uploaded files:', req.files); // Log the uploaded files for debugging

    const { productId, existingImages = [], ...updateData } = req.body;

    // Debugging logs for extracted data
    console.log(`Product ID: ${productId}`);
    console.log('Existing images:', existingImages);
    console.log('Update data:', updateData);

    // Add existing images to the updateData
    if (existingImages.length > 0) {
        updateData.images = Array.isArray(existingImages) ? existingImages : [existingImages];
        console.log('Updated images with existing ones:', updateData.images);
    }

    // If new images were uploaded, add their URLs to the updateData
    if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map(file => `/icons/${file.filename}`);
        updateData.images = updateData.images ? updateData.images.concat(imageUrls) : imageUrls;
        console.log('Updated images with new uploaded ones:', updateData.images);
    }

    try {
        console.log('Attempting to update product in the database...');
        const updatedProduct = await updateProduct(productId, updateData);
        if (updatedProduct) {
            console.log('Product updated successfully:', updatedProduct); // Log the successful update
            res.status(200).send({ message: 'Product updated successfully!' });
        } else {
            console.log('Product not found for ID:', productId); // Log if the product was not found
            res.status(404).send({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error updating product:', error); // Log any errors that occur during the process
        res.status(500).send({ message: 'Error updating product', error: error.message });
    }
});
router.post('/add-game', verifyToken, verifyAdmin, async (req, res) => {
    const { title, game_date, team_home, team_away, stadium_name, status } = req.body;
    console.log('Received game data:', { title, game_date, team_home, team_away, stadium_name, status });

    // Debug: Log the received data

    try {
        // Debug: Log before adding the game
        console.log('Attempting to add game to the database...');
        const gameId = await saveGame({ title, game_date, team_home, team_away, stadium_name, status });

        // Debug: Log the game ID
        console.log('Game added with ID:', gameId);
        res.status(200).send({ message: 'Game added successfully!' });

    } catch (error) {
        // Debug: Log the error
        console.error('Error adding game:', error);
        res.status(500).send({ message: 'Error adding game', error: error.message });
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