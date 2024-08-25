const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

module.exports = (app) => {
    // Conditional application of helmet based on route
    app.use((req, res, next) => {
        if (req.path.startsWith('/icons') || req.path.startsWith('/api/login') || 
            req.path.startsWith('/api/register') || req.path.startsWith('/api/contact')) {
            return next();
        }
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://code.jquery.com'],
                    styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://stackpath.bootstrapcdn.com'],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    mediaSrc: ["'self'", 'https:'],
                    frameSrc: ["'self'", 'https:'],
                    connectSrc: ["'self'", "smtp.ethereal.email"], // Allowing connections to the email server
                },
            },
            crossOriginEmbedderPolicy: false,
        })(req, res, next);
    });

    // Adjusted Rate Limiting to prevent DoS attacks
    const limiter = rateLimit({
        windowMs: 5 * 60 * 1000, // 5-minute window
        max: 150, // Limit each IP to 50 requests per windowMs
        message: 'Too many requests from this IP, please try again later.'
    });

    app.use(limiter);
};