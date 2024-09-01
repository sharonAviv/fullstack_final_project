// auth_cart.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth and Cart JS Loaded');

    const cartIcon = document.getElementById('cart-icon');
    const clearCartIcon = document.getElementById('clear-cart');
    const menuIcon = document.getElementById('menu-icon');
    const cartContainer = document.getElementById('cart');
    const navigationMenu = document.getElementById('navigation-menu');
    const overlay = document.getElementById('overlay');

    // Check if the user is logged in
    checkUserAuthentication();

    // Set up navigation and cart interactions

    // Toggle the cart visibility
    const toggleCart = () => {
        closeNavigationIfOpen();
        cartContainer.classList.toggle('active');
        updateOverlay();
    };

    // Toggle the navigation menu visibility
    const toggleNavigation = () => {
        closeCartIfOpen();
        navigationMenu.classList.toggle('active');
        updateOverlay();
    };

    // Update the overlay visibility
    const updateOverlay = () => {
        const shouldShowOverlay = cartContainer.classList.contains('active') || navigationMenu.classList.contains('active');
        overlay.classList.toggle('active', shouldShowOverlay);
    };

    // Close navigation if open
    const closeNavigationIfOpen = () => {
        if (navigationMenu.classList.contains('active')) {
            navigationMenu.classList.remove('active');
        }
    };

    // Close cart if open
    const closeCartIfOpen = () => {
        if (cartContainer.classList.contains('active')) {
            cartContainer.classList.remove('active');
        }
    };

    cartIcon.addEventListener('click', toggleCart);
    menuIcon.addEventListener('click', toggleNavigation);
    clearCartIcon.addEventListener('click', cartClear);
    overlay.addEventListener('click', () => {
        closeCartIfOpen();
        closeNavigationIfOpen();
        overlay.classList.remove('active');
    });


});

function cartClear() {
    fetch('/api/cart/removeAll', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include' // Ensure cookies are sent with the request
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Failed to clear cart');
                });
            }
            return response.json();
        })
        .then(data => {
            alert('All items removed from cart successfully!');
            console.log('Updated cart:', data.cartItems);
            displayEmptyCartMessage();
        })
        .catch(error => {
            console.error('Error clearing cart:', error);
            alert('An error occurred while clearing the cart.');
        });
}

function clearCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '<p>Your cart is currently empty.</p>';
    const cartIcon = document.querySelector('.cart-icon span');
    cartIcon.textContent = '0';
}

function checkUserAuthentication() {
    console.log('checkUserAuthentication function called'); // Initial log to ensure the function is called

    fetch('/api/user-data/user-data')
        .then(response => {
            console.log('Fetch user response:', response); // Log the response

            if (!response.ok) {
                console.error('Network response was not ok');
                throw new Error('Network response was not ok');
            }

            return response.json(); // Proceed to parse the JSON if the response is ok
        })
        .then(data => {
            if (!data || !data.user) { // Check if the user object is present and has a username
                console.log('No user found or user is not authenticated.');
                displayLoginToAddMessage();
                displayLoginLink();
                hideNewsContactLMM();
                hideAdminLink();
            } else {
                console.log('Authenticated user:', data.user.username);
                displayUserGreeting(data.user.username);
                displayNewsContactLMM();

                // Check if the user is an admin
                if (data.user.isAdmin) {
                    console.log('User is an admin');
                    displayAdminLink();
                } else {
                    console.log('User is not an admin');
                    hideAdminLink();
                }
            }
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            displayLoginLink();
        });
}

function displayAdminLink() {
    const adminLink = document.querySelector('nav a[href="admin.html"]');
    if (adminLink) {
        adminLink.style.display = 'block'; // Show the admin link
    }
}

function hideAdminLink() {
    const adminLink = document.querySelector('nav a[href="admin.html"]');
    if (adminLink) {
        adminLink.style.display = 'none'; // Hide the admin link
    }
}

function hideNewsContactLMM() {
    const newsLink = document.querySelector('nav a[href="news.html"]');
    const contactLink = document.querySelector('nav a[href="contact.html"]');
    const llmLink = document.querySelector('nav a[href="llm.html"]');


    if (newsLink) {
        newsLink.style.display = 'none'; // Hide the news link
    }

    if (contactLink) {
        contactLink.style.display = 'none'; // Hide the contact link
    }

    if(llmLink) {
        llmLink.style.display = 'none'; // Hide the LMM link
    }
}

function displayNewsContactLMM() {
    const newsLink = document.querySelector('nav a[href="news.html"]');
    const contactLink = document.querySelector('nav a[href="contact.html"]');
    const llmLink = document.querySelector('nav a[href="llm.html"]');


    if (newsLink) {
        newsLink.style.display = 'block'; // Show the news link
    }

    if (contactLink) {
        contactLink.style.display = 'block'; // Show the contact link
    }

    if(llmLink) {
        llmLink.style.display = 'block';
    }
}

function displayLoginLink() {
    const userGreeting = document.getElementById('user-greeting');
    const authLink = document.getElementById('auth-link');
    userGreeting.textContent = `Hi, Guest, login in order to buy`;
    authLink.href = 'login.html';
}

function displayUserGreeting(username) {
    const userGreeting = document.getElementById('user-greeting');
    const authLink = document.getElementById('auth-link');
    const authTooltip = authLink.querySelector('.tooltip'); // Select the tooltip span inside the auth link

    userGreeting.textContent = `Hi, ${username}`;
    const cart = getShoppingCart(); // Assume this function retrieves the current shopping cart

    // Change the tooltip text to "Logout" after the user is signed in
    authTooltip.textContent = 'Logout';

    authLink.onclick = function(event) {
        event.preventDefault(); // Prevent the default link behavior

        // Save user information before logging out (e.g., shopping cart)
        localStorage.setItem('cart', JSON.stringify(cart));

        // Perform the logout process
        fetch('/api/logout', {
            method: 'POST', // Assuming your logout route is a POST request
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (response.ok) {
                    // Clear user session data but keep the cart
                    localStorage.removeItem('username');
                    userGreeting.textContent = 'Hi, Guest, login in order to buy';

                    // Change the tooltip text back to "Log in"
                    authTooltip.textContent = 'Log in';

                    // Update the cart display to prompt login for adding items
                    displayLoginToAddMessage();
                    hideAdminLink();
                    hideNewsContactLMM();

                    
                    authLink.onclick = function() {
                        window.location.href = '/login.html'; // Redirect to login page
                    };
                } else {
                    console.error('Logout failed');
                }
            })
            .catch(error => {
                console.error('Error during logout:', error);
            });
    };
}

function displayLoginToAddMessage() {
    const cartElement = document.getElementById('cart'); // Assuming there's an element with id 'cart' for displaying cart contents
    const cartIconSpan = document.querySelector('#cart-icon span'); // Select the cart icon's span

    // Display the "Login to add to cart" message
    cartElement.innerHTML = '<p>Please <a href="/login.html">login</a> to add items to your cart.</p>';

    // Set the cart icon's span to 0
    if (cartIconSpan) {
        cartIconSpan.textContent = '0';
    }
}

function getShoppingCart() {
    return fetch('/api/cart/view', {
        method: 'GET',
        credentials: 'include' // Include cookies in the request for authentication via JWT
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(cartItems => {
            if (!cartItems || cartItems.length === 0) { // Check if the cart is empty or not present
                displayEmptyCartMessage();
            } else {
                displayCartItems(cartItems); // Function to display cart items
            }
        })
        .catch(error => {
            displayErrorFetchingCart();
            throw error;
        });
}

function displayEmptyCartMessage() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = `<p>Your cart is currently empty.</p>`; // Clear the cart and show a message
    const cartIconSpan = document.querySelector('#cart-icon span'); // Select the cart icon's span
    cartIconSpan.textContent = '0';
    const cartFooter = document.querySelector('.cart-footer'); // Select the cart footer to display total price
    cartFooter.innerHTML = '';
}

function displayCartItems(cartItems) {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartIconSpan = document.querySelector('#cart-icon span'); // Select the cart icon's span
    const cartFooter = document.querySelector('.cart-footer'); // Select the cart footer to display total price
    cartItemsContainer.innerHTML = ''; // Clear existing cart items

    console.log('Received cartItems:', JSON.stringify(cartItems, null, 2));

    if (cartItems && cartItems.length > 0) {
        let totalItems = 0; // Initialize total items counter
        let totalPrice = 0; // Initialize total price
        
        cartItems.forEach(item => {
            console.log(`Processing item: ${item.name} (ID: ${item.product_id})`);
            console.log(`Unit price: ${item.price}, Quantity: ${item.quantity}`);

            totalItems += item.quantity; // Accumulate the total quantity
            //const itemTotalPrice = item.price * item.quantity; // Calculate the total price for this item
            //console.log(`Item total price: ${itemTotalPrice}`);

            totalPrice += item.price; // Add to total cart price
            console.log(`Running total price: ${totalPrice}, Total items: ${totalItems}`);

            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-quantity">
                        Quantity: 
                        <button class="decrease-quantity" data-id="${item.product_id}">-</button>
                        <span id="quantity-${item.product_id}">${item.quantity}</span>
                        <button class="increase-quantity" data-id="${item.product_id}">+</button>
                    </div>
                    <div class="item-price">$${(item.price).toFixed(2)}</div> <!-- Update with correct total price -->
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);

            // Add event listeners for the quantity buttons
            itemElement.querySelector('.decrease-quantity').addEventListener('click', () => {
                addToCart(item.product_id, -1);
            });

            itemElement.querySelector('.increase-quantity').addEventListener('click', () => {
                addToCart(item.product_id, 1);
            });
        });

        // Update the cart icon's span with the total number of items
        console.log(`Final total items: ${totalItems}, Final total price: ${totalPrice}`);
        cartIconSpan.textContent = totalItems;
        cartFooter.innerHTML = `
            <div class="total-price">Total: $${totalPrice.toFixed(2)}</div>
            <button id="checkout" class="checkout-button">Checkout</button>
        `;
        const checkoutButton = document.getElementById('checkout');

        checkoutButton.addEventListener('click', function () {
            window.location.href = 'checkout.html';
        });

    } else {
        console.log('Cart is empty.');
        displayEmptyCartMessage(); // If no items, display empty cart message
    }
}


function displayErrorFetchingCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = `<p>There was an error fetching your cart data. Please try again later.</p>`;
}
