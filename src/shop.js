document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/store/products') // No need to specify full URL, proxy handles it
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(products => {
            const productList = document.getElementById('product-list');
            productList.innerHTML = ''; // Clear existing content
            products.forEach(product => {
                const productItem = document.createElement('div');
                productItem.className = 'product-item';
                productItem.innerHTML = `
                    <h2>${product.name}</h2>
                    <p>${product.description}</p>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <button onclick="addToCart('${product.id}')">Add to Cart</button>
                `;
                productList.appendChild(productItem);
            });
        })
        .catch(error => {
            console.error('Error fetching products:', error);
        });
});

function addToCart(productId) {
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
