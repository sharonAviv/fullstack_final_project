document.addEventListener('DOMContentLoaded', async function () {
    const orderItemsContainer = document.getElementById('order-items');
    const orderTotalContainer = document.getElementById('order-total');

    async function getShoppingCart() {
        try {
            const response = await fetch('/api/cart/view', {
                method: 'GET',
                credentials: 'include', // Include cookies in the request for authentication via JWT
            });
            if (!response.ok) {
                throw new Error('Failed to fetch cart data.');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching cart:', error);
            return [];
        }
    }

    async function displayOrderSummary() {
        try {
            const cartItems = await getShoppingCart(); // Wait for the cart items to be retrieved
            let total = 0;

            // Clear previous items
            orderItemsContainer.innerHTML = '';

            if (cartItems && cartItems.length > 0) {
                // Generate order items dynamically
                cartItems.forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.classList.add('order-item');

                    itemElement.innerHTML = `
                        <span class="item-name">${item.name}</span>
                        <span class="item-quantity-checkout">Quantity: ${item.quantity}</span>
                        <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                    `;

                    orderItemsContainer.appendChild(itemElement);

                    // Calculate total price
                    total += item.price * item.quantity;
                });

                // Update the total price
                orderTotalContainer.innerHTML = `<strong>Total: $${total.toFixed(2)}</strong>`;
            } else {
                orderItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            }
        } catch (error) {
            console.error('Error displaying order summary:', error);
            orderItemsContainer.innerHTML = '<p>Failed to load order summary. Please try again later.</p>';
        }
    }

    // Display the order summary on page load
    await displayOrderSummary();

    // Handle form submission
    document.getElementById('checkout-form').addEventListener('submit', async function (event) {
        event.preventDefault();
    
        try {
            // Simulate order completion and clearing the cart on the server
            const response = await fetch('/api/cart/complete-purchase', {
                method: 'POST',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            // Parse the JSON response from the server
            const data = await response.json();
    
            if (response.status === 400) {
                alert(`Error: ${data.message}`);
                window.location.href = 'shop.html';
                return;
            } else if (response.status === 500) {
                alert(`Server error: ${data.message || 'There was a problem completing your purchase. Please try again later.'}`);
                return;
            } else if (!response.ok) {
                throw new Error('Unexpected error during purchase.');
            }
    
            // Clear cart data locally after purchase
            localStorage.removeItem('cartItems');
    
            // Redirect to the thank you screen
            window.location.href = 'confirmation.html';
        } catch (error) {
            console.error('Error during purchase:', error);
            alert('There was an issue completing your purchase. Please try again.');
        }
    });
});
