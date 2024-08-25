const fetch = require('node-fetch');

// Base URL for the server
const baseUrl = 'http://localhost:3000/api';

async function runTests() {
    console.log('Running tests...');

    await testRegisterRoute();

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

runTests().catch(err => {
    console.error('Error running tests:', err);
});
