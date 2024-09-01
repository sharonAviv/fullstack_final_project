const express = require('express');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const { readActivities } = require('./activityLogger');
const { getProducts, addProduct, removeProduct, removeGameById, saveGame } = require('./persist');
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
    const { name, description, price, stock, imageUrls = [] } = req.body;

    // Handle image URLs from the request body
    let urlsArray = Array.isArray(imageUrls) ? imageUrls : [imageUrls]; // Ensure it's an array

    // Handle uploaded image files
    const images = req.files.map(file => `/icons/${file.filename}`);

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

router.post('/remove-game', verifyToken, verifyAdmin, async (req, res) => {
    const { gameId } = req.body;
    try {
        await removeGameById(gameId);
        res.send({ message: 'Game removed successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Error removing game', error: error.message });
    }
});

module.exports = router;

router.post('/add-game', verifyToken, verifyAdmin, async (req, res) => {
    const { title, game_date, team_home, team_away, stadium_name, status } = req.body;
    console.log('Received game data:', { title, game_date, team_home, team_away, stadium_name, status });

    // Debug: Log the received data

    try {
        
        const gameId = await saveGame({ title, game_date, team_home, team_away, stadium_name, status });

        // Debug: Log the game ID
        console.log('Game added with ID:', gameId);
        res.status(200).send({ message: 'Game added successfully!' ,game_id: gameId});

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