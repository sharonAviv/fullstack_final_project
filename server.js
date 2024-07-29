const express = require('express');
const cookieParser = require('cookie-parser');

// Import routers from the /routes folder
const registerRouter = require('./routes/register-server');
const loginRouter = require('./routes/login-server');
const logoutRouter = require('./routes/logout-server'); // Ensure logoutRouter is imported
const storeRouter = require('./routes/store-server');
const cartRouter = require('./routes/cart-server');
const checkoutRouter = require('./routes/checkout-server');
const gamesRouter = require('./routes/games-server'); // Importing the games router
const ticketsRouter = require('./routes/tickets-server'); // Importing the tickets router
const { init } = require('./persist');
const { logActivity } = require('./routes/activityLogger'); // Assuming activityLogger is also in /routes

const app = express();
app.use(express.json());
app.use(cookieParser());

// Mounting routers
app.use('/api/register', registerRouter);
app.use('/api/login', loginRouter);
app.use('/api/logout', logoutRouter); // Correct usage for logout
app.use('/api/store', storeRouter);
app.use('/api/cart', cartRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/games', gamesRouter); // Mounting the games router
app.use('/api/tickets', ticketsRouter); // Mounting the tickets router

// Static route for the Thank You page
app.get('/thank-you', (req, res) => {
    res.send(`
        <html>
            <head><title>Thank You</title></head>
            <body>
                <h1>Thank You for Your Payment!</h1>
                <p>Your order has been processed successfully.</p>
                <a href="/api/store/products">Continue Shopping</a> <!-- Updated link to be more specific -->
            </body>
        </html>
    `);
});

// Initialize the admin user if not exists
init();

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
