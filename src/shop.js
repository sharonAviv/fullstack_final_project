document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    // Check if the user is logged in
    checkUserAuthentication();

    // Fetch and display products
    fetch('/api/store/products')
        .then(response => {
            console.log('Fetch products response:', response);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(products => {
            console.log('Products:', products);
            displayProducts(products);
        })
        .catch(error => {
            console.error('Error fetching products:', error);
        });

    // Set up navigation and cart interactions
    const cartIcon = document.getElementById('cart-icon');
    const menuIcon = document.getElementById('menu-icon');
    const cartContainer = document.getElementById('cart');
    const navigationMenu = document.getElementById('navigation-menu');
    const closeCartButton = document.getElementById('close-cart');
    const overlay = document.getElementById('overlay');

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
    closeCartButton.addEventListener('click', toggleCart);
    overlay.addEventListener('click', () => {
        closeCartIfOpen();
        closeNavigationIfOpen();
        overlay.classList.remove('active');
    });
});

// Check if the user is authenticated
function checkUserAuthentication() {
    console.log('Checking user authentication...');
    const token = getCookie('token');
    console.log('Token from cookies:', token);
    if (token) {
        console.log('Token found:', token);
        const payload = parseJwt(token);
        console.log('Token payload:', payload);
        const username = payload.username;
        displayUserGreeting(username);
    } else {
        console.log('No user signed in');
        displayLoginLink();
    }
}

// Parse JWT token to get payload
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

// Display user greeting and logout link
function displayUserGreeting(username) {
    console.log('Displaying user greeting for:', username);
    const userGreeting = document.getElementById('user-greeting');
    const authLink = document.getElementById('auth-link');
    
    userGreeting.textContent = `Hi, ${username}`;
    
    authLink.onclick = function(event) {
        event.preventDefault(); // Prevent the default link behavior

        // Save user information before logging out (e.g., shopping cart)
        const cart = getShoppingCart(); // Assume this function retrieves the current shopping cart
        localStorage.setItem('cart', JSON.stringify(cart));
        // Perform the logout process
        fetch('/api/logout', {
            method: 'POST', // Assuming your logout route is a POST request
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username })
            
        })
        .then(response => {
            if (response.ok) {
                // Clear user session data but keep the cart
                localStorage.removeItem('username');
                userGreeting.textContent = 'Hi, Guest';
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

function getShoppingCart() {
    // Implement this function to retrieve the current shopping cart
    // For example, you might have an array of items stored in a variable or state
    return [
        { id: 1, name: 'Product 1', quantity: 2 },
        { id: 2, name: 'Product 2', quantity: 1 }
    ];
}

function restoreShoppingCart() {
    const cart = JSON.parse(localStorage.getItem('cart'));
    if (cart) {
        // Restore the cart to the shopping cart state
        console.log('Restoring cart:', cart);
        // Implement this logic to repopulate the shopping cart in the UI
    }
}

// Call this function when the page loads to restore the cart
document.addEventListener('DOMContentLoaded', restoreShoppingCart);


// Display login link
function displayLoginLink() {
    const userGreeting = document.getElementById('user-greeting');
    console.log('Displaying login link');
    const authLink = document.getElementById('auth-link');
    userGreeting.textContent = `Hi, Guest, login in order to buy`;
    authLink.href = 'login.html';
}

// Get a cookie by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    console.log(document.cookie)
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function displayProducts(products) {
    console.log('Displaying products:', products);
    const productList = document.getElementById('product-list');
    productList.innerHTML = ''; // Clear existing content

    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';

        // Ensure the image property exists and is an array with at least one image
        const images = Array.isArray(product.image) && product.images.length > 0 
                       ? product.image 
                       : ['default-image.jpg', 'default-image.jpg'];

        productItem.innerHTML = `
            <div class="image-carousel">
                <img src="${images[0]}" alt="${product.name} Image 1" class="product-image">
                <img src="${images[1]}" alt="${product.name} Image 2" class="product-image" style="display:none;">
                <button class="carousel-btn prev-btn">&lt;</button>
                <button class="carousel-btn next-btn">&gt;</button>
            </div>
            <h2>${product.name}</h2>
            <p>${product.description}</p>
            <p class="price">$${product.price.toFixed(2)}</p>
            <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
        `;
        productList.appendChild(productItem);

        // Carousel functionality
        const imageElements = productItem.querySelectorAll('.product-image');
        let currentIndex = 0;

        const showImage = (index) => {
            imageElements.forEach((img, i) => {
                img.style.display = i === index ? 'block' : 'none';
            });
        };

        productItem.querySelector('.prev-btn').addEventListener('click', () => {
            currentIndex = (currentIndex > 0) ? currentIndex - 1 : imageElements.length - 1;
            showImage(currentIndex);
        });

        productItem.querySelector('.next-btn').addEventListener('click', () => {
            currentIndex = (currentIndex < imageElements.length - 1) ? currentIndex + 1 : 0;
            showImage(currentIndex);
        });

        // Initialize with the first image displayed
        showImage(currentIndex);

        // Add event listener to "Add to Cart" button
        productItem.querySelector('.add-to-cart').addEventListener('click', (event) => {
            const productId = event.target.getAttribute('data-id');
            addToCart(productId);
        });
    });
}

// Add a product to the cart
function addToCart(productId) {
    console.log("adding to cart " + productId)
    fetch('/api/cart/add-to-cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Product added to cart successfully!');
        } else {
            alert('Failed to add product to cart: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error adding to cart:', error);
        alert('An error occurred while adding the product to the cart.');
    });
}
