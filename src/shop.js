document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    var username = "";
    const cartIcon = document.getElementById('cart-icon');
    const clearCartIcon = document.getElementById('clear-cart');
    const menuIcon = document.getElementById('menu-icon');
    const cartContainer = document.getElementById('cart');
    const navigationMenu = document.getElementById('navigation-menu');
    const closeCartButton = document.getElementById('close-cart');
    const overlay = document.getElementById('overlay');
    const checkoutButton = document.getElementById('checkout');
    const adminLink = document.querySelector('nav a[href="admin.html"]');

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
            products.forEach(product => {
                // Parse the images string into an array
                product.images = JSON.parse(product.images.replace(/\\/g, ''));
            });
            displayProducts(products);
        })
        .catch(error => {
            console.error('Error fetching products:', error);
        });

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
    closeCartButton.addEventListener('click', toggleCart);
    clearCartIcon.addEventListener('click', cartClear);
    overlay.addEventListener('click', () => {
        closeCartIfOpen();
        closeNavigationIfOpen();
        overlay.classList.remove('active');
    });

    checkoutButton.addEventListener('click', function () {
        window.location.href = 'checkout.html';
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
            clearCartDisplay();
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

function displayProducts(products) {
    const productList = document.getElementById('product-list');
    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product';

        // Create the image carousel
        let imageCarouselHTML = `
            <div class="image-carousel">
        `;
        product.images.forEach((image, index) => {
            imageCarouselHTML += `
                <img src="${image}" alt="${product.name} Image ${index + 1}" class="product-image" style="${index === 0 ? 'display:block;' : 'display:none;'}">
            `;
        });

        if (product.images.length > 1) {
            imageCarouselHTML += `
                <button class="carousel-btn prev-btn">&lt;</button>
                <button class="carousel-btn next-btn">&gt;</button>
            `;
        }

        imageCarouselHTML += `
            </div>
        `;

        // Complete the product HTML
        productItem.innerHTML = `
            ${imageCarouselHTML}
            <h2>${product.name}</h2>
            <p>${product.description}</p>
            <p class="price">$${product.price.toFixed(2)}</p>
            <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
        `;

        productList.appendChild(productItem);

        // Add event listeners for carousel buttons if there are more than one image
        if (product.images.length > 1) {
            const carousel = productItem.querySelector('.image-carousel');
            const images = carousel.querySelectorAll('.product-image');
            let currentImageIndex = 0;

            const showImage = (index) => {
                images[currentImageIndex].style.display = 'none';
                currentImageIndex = index;
                images[currentImageIndex].style.display = 'block';
            };

            const prevBtn = carousel.querySelector('.prev-btn');
            const nextBtn = carousel.querySelector('.next-btn');

            prevBtn.addEventListener('click', () => {
                const newIndex = (currentImageIndex === 0) ? images.length - 1 : currentImageIndex - 1;
                showImage(newIndex);
            });

            nextBtn.addEventListener('click', () => {
                const newIndex = (currentImageIndex === images.length - 1) ? 0 : currentImageIndex + 1;
                showImage(newIndex);
            });
        }

        // Add event listener to "Add to Cart" button
        productItem.querySelector('.add-to-cart').addEventListener('click', (event) => {
            const productId = event.target.getAttribute('data-id');
            addToCart(productId);
        });
    });
}

function checkUserAuthentication() {
    fetch('/api/user-data/user-data')
        .then(response => {
            console.log('Fetch user response:', response);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!data || !data.user) { // Check if the user object is present and has a username
                console.log('No user found or user is not authenticated.');
                displayLoginLink();
            } else {
                console.log('Authenticated user:', data.user.username);
                displayUserGreeting(data.user.username);

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

function displayLoginLink() {
    const userGreeting = document.getElementById('user-greeting');
    const authLink = document.getElementById('auth-link');
    userGreeting.textContent = `Hi, Guest, login in order to buy`;
    authLink.href = 'login.html';
}

function displayUserGreeting(username) {
    const userGreeting = document.getElementById('user-greeting');
    const authLink = document.getElementById('auth-link');

    userGreeting.textContent = `Hi, ${username}`;
    const cart = getShoppingCart(); // Assume this function retrieves the current shopping cart

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
            body: JSON.stringify({ username: username })
        })
            .then(response => {
                if (response.ok) {
                    // Clear user session data but keep the cart
                    localStorage.removeItem('username');
                    userGreeting.textContent = 'Hi, Guest';

                    // Update the cart display to prompt login for adding items
                    displayLoginToAddMessage();

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

function addToCart(productId) {
    fetch('/api/cart/add-to-cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Failed to add product to cart');
                });
            }
            return response.json();
        })
        .then(data => {
            alert('Product added to cart successfully!');
            getShoppingCart(); // Function to display cart items
        })
        .catch(error => {
            alert('An error occurred while adding the product to the cart.');
            throw error;
        });
}

function displayEmptyCartMessage() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = `<p>Your cart is currently empty.</p>`; // Clear the cart and show a message
}

function displayCartItems(cartItems) {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartIconSpan = document.querySelector('#cart-icon span'); // Select the cart icon's span
    cartItemsContainer.innerHTML = ''; // Clear existing cart items

    if (cartItems && cartItems.length > 0) {
        let totalItems = 0; // Initialize total items counter

        cartItems.forEach(item => {
            totalItems += item.quantity; // Accumulate the total quantity

            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-quantity">Quantity: ${item.quantity}</div>
                <div class="item-price">$${item.price}</div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        // Update the cart icon's span with the total number of items
        cartIconSpan.textContent = totalItems;
    } else {
        displayEmptyCartMessage(); // If no items, display empty cart message

        // Set the cart icon's span to 0 if the cart is empty
        cartIconSpan.textContent = '0';
    }
}

function displayErrorFetchingCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = `<p>There was an error fetching your cart data. Please try again later.</p>`;
}
