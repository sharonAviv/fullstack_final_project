const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.cookies.token; // Extract the token from the cookie

    if (!token) {
        return res.status(401).redirect('/login.html'); // No token found, redirect to login page
    }

    jwt.verify(token, 'your_secret_key', (err, decoded) => {
        if (err) {
            console.error('Token verification failed:', err);
            return res.status(401).redirect('/login.html'); // Token is invalid, redirect to login page
        }
        req.user = decoded.username; // If the token is valid, set the user context
        next(); // Proceed to the next middleware or route handler
    });
}

module.exports = { verifyToken };
