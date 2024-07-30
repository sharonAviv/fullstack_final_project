const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path'); // Add this line

// Import routers from the /routes folder
const registerRouter = require('./routes/register-server');
const loginRouter = require('./routes/login-server');
const logoutRouter = require('./routes/logout-server');
const storeRouter = require('./routes/store-server');
const cartRouter = require('./routes/cart-server');
const checkoutRouter = require('./routes/checkout-server');
const gamesRouter = require('./routes/games-server');
const ticketsRouter = require('./routes/tickets-server');
const { init } = require('./routes/persist');
const { logActivity } = require('./routes/activityLogger');
const customRouter = require('./routes/custom');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'src'))); // Serve static files

// Mounting routers
app.use('/api/register', registerRouter);
app.use('/api/login', loginRouter);
app.use('/api/logout', logoutRouter);
app.use('/api/store', storeRouter);
app.use('/api/cart', cartRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/games', gamesRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/custom', customRouter);

// Static route for the Thank You page
app.get('/thank-you', (req, res) => {
    res.send(`
        <html>
            <head><title>Thank You</title></head>
            <body>
                <h1>Thank You for Your Payment!</h1>
                <p>Your order has been processed successfully.</p>
                <a href="/api/store/products">Continue Shopping</a>
            </body>
        </html>
    `);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Initialize the admin user if not exists
init();

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
