const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    console.log("verifyToken middleware called"); // Debugging log
    console.log('Cookies:', req.cookies);
    const token = req.cookies.token; // Extract the token from the cookie
    console.log('Token from cookies:', token); // Debugging log

    if (!token) {
        console.log("No token found");
        // Instead of sending an error status, send a message indicating no token is found.
        return res.status(200).json({ message: 'No token provided, proceeding as guest' });
    }

    jwt.verify(token, 'your_secret_key', (err, decoded) => {
        if (err) {
            //console.error('Token verification failed:', err);
            // Return a similar response if token verification fails
            return res.status(200).json({ message: 'Invalid token, proceeding as guest' });
        }
        console.log('Token decoded:', decoded); // Debugging log
        req.user = { username: decoded.username, isAdmin: decoded.isAdmin }; // Set user context including isAdmin
        next(); // Proceed to the next middleware or route handler
    });
}

function verifyAdmin(req, res, next) {
    console.log("verifyAdmin middleware called"); // Debugging log

    if (req.user && req.user.isAdmin) { // Assuming isAdmin is a boolean in the JWT payload
        next(); // User is an admin, proceed to the next middleware or route handler
    } else {
        console.log("User is not an admin, access denied"); // Debugging log
        return res.status(403).redirect('/shop.html'); // Redirect to another page if user is not an admin
    }
}

module.exports = { verifyToken, verifyAdmin };