// products.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Products JS Loaded');

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
});

function displayProducts(products) {
    const productList = document.getElementById('product-list');
    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';

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

        // Complete the product HTML including the quantity input and add to cart button
        productItem.innerHTML = `
            ${imageCarouselHTML}
            <h2>${product.name}</h2>
            <p>${product.description}</p>
            <p class="price">$${product.price.toFixed(2)}</p>
            <div class="quantity-container">
                <label for="quantity-${product.id}">Qty:</label>
                <input type="number" id="quantity-${product.id}" name="quantity" value="1" min="1">
            </div>
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
            const quantity = document.getElementById(`quantity-${productId}`).value;
            console.log("quantity " + quantity);
            addToCart(productId, quantity);
        });
    });
}

function addToCart(productId, quantity) {
    console.log(`addToCart called with productId: ${productId}, quantity: ${quantity}`);
    
    fetch('/api/cart/add-to-cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, quantity })
    })
        .then(response => {
            console.log(`Response status: ${response.status}`);
            if (!response.ok) {
                return response.json().then(data => {
                    console.error('Error response from server:', data);
                    throw new Error(data.message || 'Failed to add product to cart');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Product added to cart successfully:', data);
            alert('Cart updated successfully!');
            getShoppingCart(); // Assume this function is defined in the cart file
        })
        .catch(error => {
            console.error('Error occurred while adding the product to the cart:', error);
            alert('An error occurred while adding the product to the cart.');
        });
}
