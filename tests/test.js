const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

// Base URL for the server
const baseUrl = 'http://localhost:3000/api';

let authToken = null;
let adminToken = null;

async function retryFetch(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

async function runTests() {
    console.log('Running tests...');

    await testRegisterRoute();
    await testLoginRoute()
    await testLogoutRoute();

    // Re-login before future tests
    await reLogin();

    await testUserDataRoute();
    await testNewsRoute();
    await testContactRoute();
    await testGamesRoute();
    await testTicketsRoute();
    await testTicketCartRoute();
    await testStoreRoute();
    await testCartRoute();
    await testCheckoutRoute();
    await testAdminRoute();

    console.log('All tests completed.');
}

async function testRegisterRoute() {
    console.log('Testing /api/register route...');

    // Test case 1: Registering a new user successfully
    let response = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser1', password: 'password123' })
    });
    let data = await response.json();
    if (response.status === 201 && data.message === 'User registered successfully.') {
        console.log('Test 1 passed: User registration succeeded.');
    } else {
        console.log('Test 1 failed:', data);
    }

    // Test case 2: Registering with an existing username
    response = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser1', password: 'password123' })
    });
    data = await response.json();
    if (response.status === 409 && data.message === 'Username already in use.') {
        console.log('Test 2 passed: Duplicate username was correctly rejected.');
    } else {
        console.log('Test 2 failed:', data);
    }

    // Test case 3: Registering without a username or password
    response = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '', password: '' })
    });
    data = await response.json();
    if (response.status === 400 && data.message === 'Username and password are required.') {
        console.log('Test 3 passed: Missing credentials were correctly rejected.');
    } else {
        console.log('Test 3 failed:', data);
    }

    console.log('/api/register route tests completed.');
}

async function testLoginRoute() {
    console.log('Testing /api/login route...');

    // Test case 1: Logging in with valid credentials
    let response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser1', password: 'password123' })
    });
    let data = await response.json();
    if (response.status === 200 && data.message === 'Logged in successfully') {
        console.log('Test 1 passed: Login succeeded.');
        // Store the token
        authToken = data.token;
        console.log('Token:', authToken);
        // Verify that a redirection URL is provided
        if (data.redirect === '/shop') {
            console.log('Login redirection URL:', data.redirect);
        } else {
            console.log('Test 1 failed: No redirection URL.');
        }
    } else {
        console.log('Test 1 failed:', data);
    }

    // Test case 2: Logging in with invalid credentials
    response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser1', password: 'wrongpassword' })
    });
    data = await response.json();
    if (response.status === 401 && data.message === 'Invalid credentials.') {
        console.log('Test 2 passed: Invalid login attempt correctly rejected.');
    } else {
        console.log('Test 2 failed:', data);
    }

    console.log('/api/login route tests completed.');
}

async function testLogoutRoute() {
    console.log('Testing /api/logout route...');

    if (!authToken) {
        console.log('Test 1 skipped: No token available for logout test.');
        return;
    }

    // Test case: Logging out successfully
    let response = await fetch(`${baseUrl}/logout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `token=${authToken}` // Use the captured token
        },
        body: JSON.stringify({ username: 'testuser1' })
    });
    let data = await response.json();
    if (response.status === 200 && data.message === 'Logged out successfully') {
        console.log('Test 1 passed: Logout succeeded.');
        // Verify that the token is cleared
        if (data.clearToken) {
            console.log('Token cleared successfully.');
        } else {
            console.log('Test 1 failed: Token was not cleared.');
        }
    } else {
        console.log('Test 1 failed:', data);
    }

    console.log('/api/logout route tests completed.');
}

async function reLogin(asAdmin = true) {
    console.log(`Re-logging in as ${asAdmin ? 'admin' : 'regular user'}...`);
    const credentials = asAdmin ? 
        { username: 'admin', password: 'admin' } : 
        { username: 'testuser1', password: 'password123' };
    
    let response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    let data = await response.json();
    if (response.status === 200 && data.message === 'Logged in successfully') {
        authToken = data.token;
        console.log('Re-login successful. Token:', authToken);
    } else {
        console.log('Re-login failed:', data);
    }
}


async function testUserDataRoute() {
    console.log('Testing /api/user-data route...');
    console.log("token check for user data: " + authToken);
    // Ensure authToken is valid before starting the test
    if (!authToken) {
        console.error('Auth token is missing.');
        return;
    }

    let response = await fetch(`${baseUrl}/user-data`, {
        headers: { 'Cookie': `token=${authToken}` }
    });

    let data;
    try {
        data = await response.json();
        if (response.status === 200 && data.user) {
            console.log('Test 1 passed: User data fetched successfully.');
        } else if (response.status === 200 && data.message === 'No token provided, proceeding as guest') {
            console.log('Test 1 passed: Correctly identified as guest.');
        } else {
            console.log('Test 1 failed:', data);
        }
    } catch (error) {
        console.error('Failed to parse response as JSON:', error);
        return;
    }

    // Check if the response is HTML
    if (response.headers.get('Content-Type').includes('text/html')) {
        console.error('Unexpected HTML response:', await response.text());
        return;
    }

    // Test case 2: Logout the test user
    response = await fetch(`${baseUrl}/logout`, {
        method: 'POST',
        headers: { 
            'Cookie': `token=${authToken}`,
            'Content-Type': 'application/json'
        },
    });

    if (response.status === 200) {
        console.log('Test 2 passed: User logged out successfully.');
    } else {
        console.log('Test 2 failed:', await response.text());
    }

    // Login as admin user
    response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin' })
    });

    data = await response.json();
    adminToken = data.token;

    if (response.status === 200 && adminToken) {
        console.log('Test 3 passed: Admin logged in successfully.');
    } else {
        console.log('Test 3 failed:', data);
        return;
    }

    // Test case 3: Fetch admin data
    response = await fetch(`${baseUrl}/admin-data`, {
        headers: { 
            'Cookie': `token=${adminToken}`,
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }, // Use adminToken here
        credentials: 'include'
    });

    // Check if the response is HTML
    if (response.headers.get('Content-Type') && response.headers.get('Content-Type').includes('text/html')) {
        console.error('Unexpected HTML response:', await response.text());
        return;
    }

    // Handle JSON response
    try {
        data = await response.json();
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        return;
    }

    if (response.status === 200 && data.message === 'Welcome, admin!') {
        console.log('Test 4 passed: Admin data fetched successfully.');
    } else {
        console.log('Test 4 failed:', data);
    }

    // Logout the admin user
    response = await fetch(`${baseUrl}/logout`, {
        method: 'POST',
        headers: { 
            'Cookie': `token=${adminToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (response.status === 200) {
        console.log('Test 5 passed: Admin logged out successfully.');
    } else {
        console.log('Test 5 failed:', await response.text());
    }

    // Re-login as test user
    response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser1', password: 'password123' })
    });

    data = await response.json();
    authToken = data.token;

    if (response.status === 200 && authToken) {
        console.log('Test 6 passed: Test user logged back in successfully.');
    } else {
        console.log('Test 6 failed:', data);
    }
}


async function testNewsRoute() {
    console.log('Testing /api/news route...');

    // Test case: Fetching news articles
    let response = await fetch(`${baseUrl}/news`, {
        method: 'GET',
        headers: { 
            'Content-Type': 'application/json',
            // Include the auth token if required
            // 'Cookie': `token=${authToken}` 
        }
    });

    let data = await response.json();
    if (response.status === 200 && Array.isArray(data)) {
        console.log('Test 1: News articles fetched successfully.');

        // Additional checks to ensure the response is in the expected format
        if (data.length > 0) {
            const article = data[0];
            if (article.title && article.description && article.url) {
                console.log('Test 1 passed: Articles contain the expected properties.');
            } else {
                console.log('Test 1 failed: Articles do not have the expected properties.');
            }
        } else {
            console.log('Test 1 warning: No articles returned.');
        }
    } else {
        console.log('Test 1 failed:', data);
    }

    console.log('/api/news route tests completed.');
}

async function testContactRoute() {
    console.log('Testing /api/contact route...');

    // Test case: Submitting the contact form successfully
    let response = await fetch(`${baseUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'John Doe', 
            email: 'john.doe@example.com', 
            phone: '1234567890', 
            message: 'This is a test message.'
        })
    });

    let data = await response.json();
    if (response.status === 200 && data.message === 'Message sent successfully') {
        console.log('Test 1 passed: Contact form submission succeeded.');
    } else {
        console.log('Test 1 failed:', data);
    }

    // Test case: Submitting the contact form without required fields
    response = await fetch(`${baseUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: '', 
            email: '', 
            phone: '', 
            message: ''
        })
    });

    data = await response.json();
    if (response.status === 400 && data.message === 'Name, email and message are required') {
        console.log('Test 2 passed: Missing required fields were correctly rejected.');
    } else {
        console.log('Test 2 failed:', data);
    }

    console.log('/api/contact route tests completed.');
}

async function testGamesRoute() {
    console.log('Testing /api/games route...');

    // Test case 1: Posting a new game successfully
    const newGame = {
        title: 'Israel vs Brazil', 
        date: '2024-10-05', 
        teamHome: 'Israel', 
        teamAway: 'Brazil', 
        stadiumName: 'National Stadium'
    };

    let response = await fetch(`${baseUrl}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGame)
    });

    let data = await response.json();
    if (response.status === 201 && data.title === newGame.title) {
        console.log('Test 1 passed: New game posted successfully.');
    } else {
        console.log('Test 1 failed:', data);
    }

        // Test case 2: Attempting to post the same game again
        response = await fetch(`${baseUrl}/games`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newGame)
        });
    
        data = await response.json();
        if (response.status === 200 && data.message === 'Game already exists') {
            console.log('Test 2 passed: Duplicate game correctly identified.');
        } else {
            console.log('Test 2 failed:', data);
        }
    
        // Test case 3: Getting all games
        response = await fetch(`${baseUrl}/games`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
    
        data = await response.json();
        if (response.status === 200 && Array.isArray(data)) {
            console.log('Test 3: Games fetched successfully.');
            if (data.length > 0) {
                const game = data[0];
                if (game.title && game.game_date && game.team_home && game.team_away && game.stadium_name) {
                    console.log('Test 3 passed: Games contain the expected properties.');
                } else {
                    console.log('Test 3 failed: Games do not have the expected properties.');
                }
            } else {
                console.log('Test 3 warning: No games returned.');
            }
        } else {
            console.log('Test 3 failed:', data);
        }
    
        console.log('/api/games route tests completed.');
    }

    async function testTicketsRoute() {
        console.log('Testing /api/tickets route...');
    
        const gameId = 1;
        let ticketId;
    
        // Test 1: Post a new ticket (admin only)
        const newTicket = {
            gameId: gameId,
            seatNumber: '101N',
            stand: 'north',
            price: 50
        };
    
        let response = await fetch(`${baseUrl}/tickets`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': `token=${authToken}`
            },
            body: JSON.stringify(newTicket)
        });
    
        let data = await response.json();
        if (response.status === 201 && data.message === 'Ticket added successfully') {
            console.log('Test 1 passed: New ticket added successfully.');
            ticketId = data.ticketId;
        } else {
            console.log('Test 1 failed:', data);
        }
    
        // Test 2: Get tickets by gameId
        response = await fetch(`${baseUrl}/tickets?gameId=${gameId}`, {
            headers: { 'Content-Type': 'application/json' }
        });
    
        data = await response.json();
        if (response.status === 200 && Array.isArray(data) && data.length > 0) {
            console.log('Test 2 passed: Tickets fetched successfully by gameId.');
        } else {
            console.log('Test 2 failed:', data);
        }
    
        // Test 3: Get tickets by gameId and stand
        response = await fetch(`${baseUrl}/tickets?gameId=${gameId}&stand=north`, {
            headers: { 'Content-Type': 'application/json' }
        });
    
        data = await response.json();
        if (response.status === 200 && Array.isArray(data) && data.length > 0) {
            console.log('Test 3 passed: Tickets fetched successfully by gameId and stand.');
        } else {
            console.log('Test 3 failed:', data);
        }
    
        // Test 4: Get ticket by ticketId
        response = await fetch(`${baseUrl}/tickets?ticketId=${ticketId}`, {
            headers: { 'Content-Type': 'application/json' }
        });
    
        data = await response.json();
        if (response.status === 200 && data.ticket_id === ticketId) {
            console.log('Test 4 passed: Ticket fetched successfully by ticketId.');
        } else {
            console.log('Test 4 failed:', data);
        }
    
        // Test 5: Purchase tickets
        response = await fetch(`${baseUrl}/tickets/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketIds: [ticketId] })
        });
    
        data = await response.json();
        if (response.status === 200 && data.message === 'Tickets purchased successfully') {
            console.log('Test 5 passed: Ticket purchased successfully.');
        } else {
            console.log('Test 5 failed:', data);
        }
    
        console.log('/api/tickets route tests completed.');
    }
    

async function testTicketCartRoute() {
    console.log('Testing /api/ticket-cart route...');

    const secondTicketId = 2; // Ticket with ID 2 from server.init
    const thirdTicketId = 3; // This ticket will be added for future use in check-server tests

    // Test case 1: Add a ticket to the cart (secondTicketId)
    let response = await fetch(`${baseUrl}/ticket-cart/add-to-cart`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': `token=${authToken}` 
        },
        body: JSON.stringify({ ticketId: secondTicketId })
    });

    let data = await response.json();
    if (response.status === 201 && data.cartItems.some(item => item.ticket_id === secondTicketId)) {
        console.log('Test 1.1: Ticket added to cart successfully.');
    } else {
        console.log('Test 1.1:', data);
    }

    // Adding another ticket to the cart for later use in check-server test
    response = await fetch(`${baseUrl}/ticket-cart/add-to-cart`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': `token=${authToken}`
        },
        body: JSON.stringify({ ticketId: thirdTicketId }) 
    });

    data = await response.json();
    if (response.status === 201 && data.cartItems.some(item => item.ticket_id === thirdTicketId)) {
        console.log('Test 1.2 passed: Another ticket added to cart successfully (for check-server tests).');
    } else {
        console.log('Test 1.2 failed:', data);
    }

    // Test case 2: View the cart
    response = await fetch(`${baseUrl}/ticket-cart/view`, {
        method: 'GET',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': `token=${authToken}`
        }
    });

    data = await response.json();
    if (response.status === 200 && Array.isArray(data) && data.length > 0 && data.some(item => item.ticket_id === secondTicketId)) {
        console.log('Test 2 passed: Cart viewed successfully with the correct ticket.');
    } else {
        console.log('Test 2 failed:', data);
    }

    // Test case 3: Remove the ticket from the cart (secondTicketId)
    response = await fetch(`${baseUrl}/ticket-cart/remove`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': `token=${authToken}`
        },
        body: JSON.stringify({ ticketId: secondTicketId })
    });

    data = await response.json();
    if (response.status === 200 && !data.cartItems.some(item => item.ticket_id === secondTicketId)) {
        console.log('Test 3 passed: Ticket removed from cart successfully.');
    } else {
        console.log('Test 3 failed:', data);
    }

    console.log('/api/ticket-cart route tests completed.');
}

async function testStoreRoute() {
    console.log('Testing /api/store routes...');

    // Test case 1: Retrieve all products
    let response = await fetch(`${baseUrl}/store/products`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    let data = await response.json();
    if (response.status === 200 && Array.isArray(data)) {
        console.log('Test 1: Products fetched successfully.');

        // Check if the expected products are returned
        if (data.length === 2 &&
            data.some(product => product.name === 'Blue T-Shirt') &&
            data.some(product => product.name === 'White Sneakers')) {
            console.log('Test 1 passed: Products contain the expected items.');
        } else {
            console.log('Test 1 failed: Products do not contain the expected items.', data);
        }
    } else {
        console.log('Test 1 failed:', data);
    }

    // Test case 2: Search for a product by name
    const searchQuery = 'T-Shirt';
    response = await fetch(`${baseUrl}/store/search?q=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    data = await response.json();
    if (response.status === 200 && Array.isArray(data)) {
        console.log('Test 2: Search performed successfully.');

        // Check if the search result contains the expected product
        if (data.length === 1 && data[0].name === 'Blue T-Shirt') {
            console.log('Test 2 passed: Search returned the expected product.');
        } else {
            console.log('Test 2 failed: Search did not return the expected product.', data);
        }
    } else {
        console.log('Test 2 failed:', data);
    }

    // Test case 3: Search for a non-existing product
    const nonExistingQuery = 'NonExistentProduct';
    response = await fetch(`${baseUrl}/store/search?q=${encodeURIComponent(nonExistingQuery)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    data = await response.json();
    if (response.status === 200 && Array.isArray(data)) {
        console.log('Test 3: Search for non-existing product performed successfully.');

        // Check if the search result is empty
        if (data.length === 0) {
            console.log('Test 3 passed: Search returned no products as expected.');
        } else {
            console.log('Test 3 failed: Search returned products unexpectedly.', data);
        }
    } else {
        console.log('Test 3 failed:', data);
    }

    console.log('/api/store route tests completed.');
}

async function testCartRoute() {
    console.log('Testing cart routes...');

    // Ensure cart is empty at start
    await fetch(`${baseUrl}/cart/removeAll`, {
        method: 'POST',
        headers: { 'Cookie': `token=${authToken}` }
    });

    // Test 1: Add items to cart
    await fetch(`${baseUrl}/cart/add-to-cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `token=${authToken}` },
        body: JSON.stringify({ productId: 1 })
    });

    // Verify item was added
    let response = await fetch(`${baseUrl}/cart/view`, {
        method: 'GET',
        headers: { 'Cookie': `token=${authToken}` }
    });
    let data = await response.json();
    console.log('Test 1: Add item to cart -', response.status === 200 && data.length === 1 ? 'Passed' : 'Failed');

    // Test 2: Remove item from cart
    response = await fetch(`${baseUrl}/cart/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `token=${authToken}` },
        body: JSON.stringify({ productId: 1 })
    });
    data = await response.json();
    console.log('Test 2: Remove item from cart -', response.status === 200 && data.cartItems.length === 0 ? 'Passed' : 'Failed');

    // Test 3: Complete purchase (first add an item)
    await fetch(`${baseUrl}/cart/add-to-cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `token=${authToken}` },
        body: JSON.stringify({ productId: 2 })
    });

    response = await fetch(`${baseUrl}/cart/complete-purchase`, {
        method: 'POST',
        headers: { 'Cookie': `token=${authToken}` }
    });
    data = await response.json();
    console.log('Test 3: Complete purchase -', response.status === 200 && data.message === 'Purchase completed successfully' ? 'Passed' : 'Failed');

    console.log('Cart routes tests completed.');
}

async function testCheckoutRoute() {
    console.log('Testing checkout routes...');

    // Test case 1: Review cart
    let response = await fetch(`${baseUrl}/checkout/review`, {
        headers: { 'Cookie': `token=${authToken}` }
    });
    let data = await response.json();
    if (response.status === 200 && Array.isArray(data)) {
        console.log('Test 1 passed: Cart reviewed successfully.');
    } else {
        console.log('Test 1 failed:', data);
    }

    // Test case 2: Process payment
    response = await fetch(`${baseUrl}/checkout/pay`, {
        method: 'POST',
        headers: { 'Cookie': `token=${authToken}` }
    });
    data = await response.json();
    if (response.status === 200 && data.message === 'Payment successful, your order is being processed') {
        console.log('Test 2 passed: Payment processed successfully.');
    } else {
        console.log('Test 2 failed:', data);
    }

    console.log('Checkout routes tests completed.');
}

async function testAdminRoute() {
    console.log('Testing admin routes...');

    // Login as admin
    let response = await retryFetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin' })
    });
    let data = await response.json();
    adminToken = data.token;

    // Test 1: Fetch activities
    response = await retryFetch(`${baseUrl}/admin/activities`, {
        headers: { 'Cookie': `token=${adminToken}` }
    });
    data = await response.json();
    console.log('Test 1: Fetch activities -', response.status === 200 && Array.isArray(data) ? 'Passed' : 'Failed');

    // Test 2: Add a product
    const formData = new FormData();
    formData.append('name', 'Test Product');
    formData.append('description', 'A test product');
    formData.append('price', '19.99');
    formData.append('stock', '10');
    // Note: We're not adding an image file to avoid potential issues

    try {
        response = await retryFetch(`${baseUrl}/admin/add-product`, {
            method: 'POST',
            headers: { 'Cookie': `token=${adminToken}` },
            body: formData
        });
        data = await response.json();
        console.log('Test 2: Add product -', response.status === 201 ? 'Passed' : 'Failed');
    } catch (error) {
        console.log('Test 2: Add product - Failed', error);
    }

    // Test 3: Get all products
    response = await retryFetch(`${baseUrl}/admin/products`, {
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': `token=${adminToken}` 
        }
    });
    data = await response.json();
    console.log('Test 3: Get all products -', response.status === 200 && Array.isArray(data) ? 'Passed' : 'Failed');

    // Assuming the added product is the last in the array
    const addedProductId = data[data.length - 1].id;

    // Test 4: Update product
    const updateFormData = new FormData();
    updateFormData.append('productId', addedProductId);
    updateFormData.append('name', 'Updated Test Product');
    updateFormData.append('price', '24.99');

    response = await retryFetch(`${baseUrl}/admin/update-product-info`, {
        method: 'POST',
        headers: { 'Cookie': `token=${adminToken}`},
        body: updateFormData
    });
    data = await response.json();
    console.log('Test 4: Update product -', response.status === 200 ? 'Passed' : 'Failed');

    // Test 5: Remove product
    response = await retryFetch(`${baseUrl}/admin/remove-product`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': `token=${adminToken}` 
        },
        body: JSON.stringify({ productId: addedProductId })
    });
    data = await response.json();
    console.log('Test 5: Remove product -', response.status === 200 ? 'Passed' : 'Failed');

    console.log('Admin routes tests completed.');
}


runTests().catch(err => {
    console.error('Error running tests:', err);
});
