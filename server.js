const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Import routers
const registerRouter = require('./routes/register-server');
const loginRouter = require('./routes/login-server');
const logoutRouter = require('./routes/logout-server');
const storeRouter = require('./routes/store-server');
const cartRouter = require('./routes/cart-server');
const checkoutRouter = require('./routes/checkout-server');
const gamesRouter = require('./routes/games-server');
const ticketsRouter = require('./routes/tickets-server');
const customRouter = require('./routes/custom');
const { init } = require('./routes/persist');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,POST,PUT,DELETE',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Serve static files from the 'src' and 'icons' directories
app.use(express.static(path.join(__dirname, 'src')));
app.use('/icons', express.static(path.join(__dirname, 'icons')));

// Mount API routers
app.use('/api/register', registerRouter);
app.use('/api/login', loginRouter);
app.use('/api/logout', logoutRouter);
app.use('/api/store', storeRouter);
app.use('/api/cart', cartRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/games', gamesRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/custom', customRouter);

// Serve the shop page as the starting point
app.get('/shop', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'shop.html'));
});

// Additional routes for other pages
app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'cart.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'checkout.html'));
});

// Serve the default page for other unspecified routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'shop.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Initialize the application
init();

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
