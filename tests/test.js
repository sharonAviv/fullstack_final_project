const fetch = require('node-fetch');
const FormData = require('form-data');

// Base URL for the server
const baseUrl = 'http://localhost:3000/api';

let authToken = null;
let adminToken = null;

async function runTests() {
    console.log('Running tests...');

    await testAdminRoute();
    await testLogoutRoute();
    await testRegisterRoute();
    await testLoginRoute();
    await testGamesRoute();
    await testTicketsRoute();
    await testTicketCartRoute();
    await testStoreRoute();
    await testUserDataRoute();
    await testCartRoute();
    await testNewsRoute();
    await testContactRoute();

    console.log('All tests completed.');
}

async function testAdminRoute() {
    console.log('Testing admin routes...');

    // Login as admin
    let response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin' })
    });
    let data = await response.json();
    adminToken = data.token;

    // Test 1: Fetch activities
    response = await fetch(`${baseUrl}/admin/activities`, {
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
    formData.append('imageUrls[]', 'https://www.football.org.il/imageserver/getimage.ashx?type=1&width=124&height=152&id=5112&width=240&height=305');

    try {
        response = await fetch(`${baseUrl}/admin/add-product`, {
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
    response = await fetch(`${baseUrl}/admin/products`, {
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `token=${adminToken}`
        }
    });
    data = await response.json();
    console.log('Test 3: Get all products -', response.status === 200 && Array.isArray(data) ? 'Passed' : 'Failed');

    // Assuming the added product is the last in the array
    const addedProductId = data.length > 0 ? data[data.length - 1].id : null;

    // Test 4: Remove a product
    if (addedProductId) {
        response = await fetch(`${baseUrl}/admin/remove-product`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${adminToken}`
            },
            body: JSON.stringify({ productId: addedProductId })
        });
        data = await response.json();
        console.log('Test 4: Remove product -', response.status === 200 ? 'Passed' : 'Failed');
    } else {
        console.log('Test 4: Remove product - Skipped (no product to remove)');
    }

    // Test 5: Add a game
    const newGame = {
        title: 'Israel vs Brazil',
        game_date: '2024-10-05',
        team_home: 'Israel',
        team_away: 'Brazil',
        stadium_name: 'National Stadium',
        status: 'scheduled'
    };

    response = await fetch(`${baseUrl}/admin/add-game`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `token=${adminToken}`
        },
        body: JSON.stringify(newGame)
    });

    data = await response.json();
    console.log('Test 5: Add game -', response.status === 200 && data.message === 'Game added successfully!' ? 'Passed' : 'Failed');

    // Assuming the game was added successfully and its ID was returned
    const addedGameId = data.game_id || null;

    // Test 6: Remove the game
    if (addedGameId) {
        response = await fetch(`${baseUrl}/admin/remove-game`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${adminToken}`
            },
            body: JSON.stringify({ gameId: addedGameId })
        });

        data = await response.json();
        console.log('Test 6: Remove game -', response.status === 200 && data.message === 'Game removed successfully' ? 'Passed' : 'Failed');
    } else {
        console.log('Test 6: Remove game - Skipped (no game to remove)');
    }

    console.log('Admin routes tests completed.');
}

async function testLogoutRoute() {
    console.log('Testing /api/logout route...');

    let token = authToken || adminToken;

    if (!token) {
        console.log('Test 1 skipped: No token available for logout test.');
        return;
    }

    // Test case: Logging out successfully
    let response = await fetch(`${baseUrl}/logout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `token=${token}`
        }
        // If the body is not needed, you can remove or uncomment the next line.
        // body: JSON.stringify({ username: 'testuser1' })
    });
    let data = await response.json();
    if (response.status === 200 && data.message === 'Logged out successfully') {
        console.log('Test 1 passed: Logout succeeded.');
    } else {
        console.log('Test 1 failed:', data);
    }

    console.log('/api/logout route tests completed.');
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
        authToken = data.token;
        console.log('Token:', authToken);
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

async function testUserDataRoute() {
    console.log('Testing /api/user-data route...');
    
    if (!authToken) {
        console.error('Auth token is missing.');
        return;
    }

    let response = await fetch(`${baseUrl}/user-data/user-data`, {
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

    // Re-login as test user
    response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser1', password: 'password123' })
    });

    data = await response.json();
    authToken = data.token;

    if (response.status === 200 && authToken) {
        console.log('Test 3 passed: Test user logged back in successfully.');
    } else {
        console.log('Test 3 failed:', data);
    }
}

async function testNewsRoute() {
    console.log('Testing /api/news route...');

    let response = await fetch(`${baseUrl}/news`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });

    let data = await response.json();
    if (response.status === 200 && Array.isArray(data)) {
        console.log('Test 1: News articles fetched successfully.');
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

    // Test case: Getting all games
    let response = await fetch(`${baseUrl}/games`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });

    let data = await response.json();
    if (response.status === 200 && Array.isArray(data)) {
        console.log('Test passed: Games fetched successfully.');
        if (data.length > 0) {
            const game = data[0];
            if (game.title && game.game_date && game.team_home && game.team_away && game.stadium_name) {
                console.log('Games contain the expected properties.');
            } else {
                console.log('Test failed: Games do not have the expected properties.');
            }
        } else {
            console.log('Warning: No games returned.');
        }
    } else {
        console.log('Test failed:', data);
    }

    console.log('/api/games route tests completed.');
}


async function testTicketsRoute() {
    console.log('Testing /api/tickets route...');

    const gameId = 1;
    let ticketId;

    // Test case 1: Get tickets by gameId
    let response = await fetch(`${baseUrl}/tickets?gameId=${gameId}`, {
        headers: { 'Content-Type': 'application/json' }
    });

    let data = await response.json();
    if (response.status === 200 && Array.isArray(data) && data.length > 0) {
        console.log('Test 1 passed: Tickets fetched successfully by gameId.');
        ticketId = data[0].ticket_id; // Use the first ticket's ID for further tests
    } else {
        console.log('Test 1 failed:', data);
        return; // Exit early if this test fails
    }

    // Test case 2: Get tickets by gameId and stand
    response = await fetch(`${baseUrl}/tickets?gameId=${gameId}&stand=north`, {
        headers: { 'Content-Type': 'application/json' }
    });

    data = await response.json();
    if (response.status === 200 && Array.isArray(data) && data.length > 0) {
        console.log('Test 2 passed: Tickets fetched successfully by gameId and stand.');
    } else {
        console.log('Test 2 failed:', data);
    }

    // Test case 3: Get ticket by ticketId
    response = await fetch(`${baseUrl}/tickets?ticketId=${ticketId}`, {
        headers: { 'Content-Type': 'application/json' }
    });

    data = await response.json();
    if (response.status === 200 && data[0].ticket_id === ticketId) {
        console.log('Test 3 passed: Ticket fetched successfully by ticketId.');
    } else {
        console.log('Test 3 failed:', data);
    }

    console.log("ticketId: " + ticketId);
    const ticketIds = [ticketId];

    // Test case 4: Purchase tickets
    response = await fetch(`${baseUrl}/tickets/purchase`, {
        method: 'POST',
        headers: { 
            'Cookie': `token=${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ticketIds })
    });

    data = await response.json();
    if (response.status === 200 && data.message === 'Tickets purchased successfully') {
        console.log('Test 4 passed: Ticket purchased successfully.');
    } else {
        console.log('Test 4 failed:', data);
    }



    console.log('/api/tickets route tests completed.');
}


async function testTicketCartRoute() {
    console.log('Testing /api/ticket-cart route...');

    const secondTicketId = 2;
    const thirdTicketId = 3;

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
        headers: { 'Content-Type': 'application/json' }
    });

    let data = await response.json();
    if (response.status === 200 && Array.isArray(data)) {
        console.log('Test 1: Products fetched successfully.');

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
        headers: { 'Content-Type': 'application/json' }
    });

    data = await response.json();
    if (response.status === 200 && Array.isArray(data)) {
        console.log('Test 2: Search performed successfully.');

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
        headers: { 'Content-Type': 'application/json' }
    });

    data = await response.json();
    if (response.status === 200 && Array.isArray(data)) {
        console.log('Test 3: Search for non-existing product performed successfully.');

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

    // Test case 1: Add items to cart
    await fetch(`${baseUrl}/cart/add-to-cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `token=${authToken}` },
        body: JSON.stringify({ productId: 1, quantity: 1 })
    });

    // Verify item was added
    let response = await fetch(`${baseUrl}/cart/view`, {
        method: 'GET',
        headers: { 'Cookie': `token=${authToken}` }
    });
    let data = await response.json();
    console.log('Test 1: Add item to cart -', response.status === 200 && data.length === 1 ? 'Passed' : 'Failed');

    // Test case 2: Remove item from cart
    response = await fetch(`${baseUrl}/cart/add-to-cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `token=${authToken}` },
        body: JSON.stringify({ productId: 1 , quantity: -1})
    });
    data = await response.json();
    console.log('Test 2: Remove item from cart -', response.status === 201 && data.cartItems.length === 0 ? 'Passed' : 'Failed');

    // Test case 3: Complete purchase (first add an item)
    await fetch(`${baseUrl}/cart/add-to-cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `token=${authToken}` },
        body: JSON.stringify({ productId: 2 ,quantity: 1})
    });

    response = await fetch(`${baseUrl}/cart/complete-purchase`, {
        method: 'POST',
        headers: { 'Cookie': `token=${authToken}` }
    });
    data = await response.json();
    console.log('Test 3: Complete purchase -', response.status === 200 && data.message === 'Purchase completed successfully' ? 'Passed' : 'Failed');

    console.log('Cart routes tests completed.');
}


runTests().catch(err => {
    console.error('Error running tests:', err);
});
