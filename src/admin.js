document.addEventListener('DOMContentLoaded', () => {
    const activityTableBody = document.getElementById('activity-table-body');
    const usernameFilter = document.getElementById('username-filter');
    const productList = document.getElementById('product-list');
    const addProductForm = document.getElementById('add-product-form');
    const gameList = document.getElementById('game-list');
    const addGameForm = document.getElementById('add-game-form');
    const imagePreviewContainer = document.getElementById('image-preview');
    const imageUrlInput = document.getElementById('image-url-input');

    let uploadedImages = [];

    // Fetch and display user activities
    async function fetchActivities() {
        try {
            const response = await fetch('/api/admin/activities');
            if (!response.ok) throw new Error('Failed to fetch activities');
            const activities = await response.json();
            displayActivities(activities);
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    }

    // Display activities in the table
    function displayActivities(activities) {
        activityTableBody.innerHTML = activities.map(activity => {
            const formattedDate = formatDate(activity.datetime);
            return `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${activity.username}</td>
                    <td>${activity.type}</td>
                </tr>
            `;
        }).join('');
    }

    // Format date to a more readable format
    function formatDate(isoString) {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', isoString);
            return 'Invalid Date';
        }
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }

    // Filter activities by username prefix
    usernameFilter.addEventListener('input', () => {
        const filterValue = usernameFilter.value.toLowerCase();
        document.querySelectorAll('#activity-table-body tr').forEach(row => {
            const username = row.children[1].textContent.toLowerCase();
            row.style.display = username.startsWith(filterValue) ? '' : 'none';
        });
    });

    // Fetch and display products
    async function fetchProducts() {
        try {
            const response = await fetch('/api/admin/products');
            if (!response.ok) throw new Error('Failed to fetch products');
            const products = await response.json();
            displayProducts(products);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    }

    // Display products in the list
    function displayProducts(products) {
        productList.innerHTML = products.map(product => `
            <li>
                <div>
                    <strong>${product.name}</strong><br>
                    <p><strong>Price:</strong> $${product.price.toFixed(2)}</p>
                    <p><strong>Stock:</strong> <span class="product-amount">${product.stock}</span></p>
                    <div class="quantity-control">
                        <input type="number" class="manual-amount" value="1" min="1" data-id="${product.id}">
                        <button class="add-amount" data-id="${product.id}">Add to stock</button>
                        <button class="remove-amount" data-id="${product.id}">Remove from stock</button>
                    </div>
                </div>
                <button data-id="${product.id}" class="remove-product">Remove Product</button>
            </li>
        `).join('');

        // Handle product list actions
        productList.addEventListener('click', async (event) => {
            const productId = event.target.getAttribute('data-id');
            const stockElement = event.target.closest('li').querySelector('.product-amount');
            const manualAmountInput = event.target.closest('li').querySelector('.manual-amount');
            let currentStock = parseInt(stockElement.textContent);
            let stockChange = 0;
            let operationString = '';

            if (event.target.classList.contains('add-amount')) {
                stockChange = parseInt(manualAmountInput.value);
                operationString = 'add';
            } else if (event.target.classList.contains('remove-amount')) {
                stockChange = -parseInt(manualAmountInput.value);
                operationString = 'remove';
            }

            if (stockChange !== 0) {
                const updatedStock = currentStock + stockChange;
                if (updatedStock >= 0 && confirm(`Are you sure you want to ${operationString} the stock?`)) {
                    await updateProductInfo(productId, { stock: updatedStock }, stockElement);
                }
            }

            if (event.target.classList.contains('remove-product')) {
                if (confirm('Are you sure you want to remove this product?')) {
                    await removeProduct(productId);
                }
            }
        });
    }

    // Function to update product information (only stock is updated)
    async function updateProductInfo(productId, updateData, stockElement = null) {
        try {
            const formData = new FormData();
            formData.append('productId', productId);
            formData.append('stock', updateData.stock);

            const response = await fetch('/api/admin/update-product-info', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Product updated successfully!');
                if (stockElement) {
                    stockElement.textContent = updateData.stock;
                }
                fetchProducts();
            } else {
                const errorData = await response.json();
                alert('Error updating product: ' + errorData.message);
            }
        } catch (error) {
            console.error('Error updating product:', error);
        }
    }

    // Function to remove a product
    async function removeProduct(productId) {
        try {
            const response = await fetch('/api/admin/remove-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });

            if (response.ok) {
                alert('Product removed successfully!');
                fetchProducts();
            } else {
                const errorData = await response.json();
                alert('Error removing product: ' + errorData.message);
            }
        } catch (error) {
            console.error('Error removing product:', error);
        }
    }

    // Handle adding a new product with image upload
    addProductForm.addEventListener('submit', async (event) => {
        event.preventDefault();
    
        const formData = new FormData();
        formData.append('name', document.getElementById('product-title').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('price', parseFloat(document.getElementById('price').value));
        formData.append('stock', parseInt(document.getElementById('amount').value) || 0);
    
        let valid = true;
        let imageCount = 0;
        let imageUrlCount = 0;
    
        uploadedImages.forEach((image) => {
            if (typeof image === 'string') {
                if (isValidUrl(image)) { // Check if the string is a valid URL
                    formData.append('imageUrls', image);
                    imageUrlCount++;
                    console.log(`Added URL: ${image} (Type: ${typeof image})`);
                } else {
                    alert(`Invalid URL: ${image}`);
                    valid = false;
                }
            } else if (image instanceof File && image.type.startsWith('image/')) {
                if (image.size <= 2 * 1024 * 1024) { // Check file size (2 MB limit)
                    formData.append('images', image);
                    imageCount++;
                    console.log(`Added file: ${image.name} (Type: File, Size: ${image.size} bytes, MIME Type: ${image.type})`);
                } else {
                    alert(`Image ${image.name} is too large (limit: 2MB).`);
                    valid = false;
                }
            } else {
                alert(`File ${image.name || 'Unknown'} is not a valid image.`);
                valid = false;
            }
        });
    
        console.log(`Total images added: ${imageCount}`);
        console.log(`Total image URLs added: ${imageUrlCount}`);
    
        if (!valid) {
            return; // Stop form submission if there are invalid files
        }
    
        for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`${key}: [File] Name: ${value.name}, Size: ${value.size} bytes, Type: ${value.type}`);
            } else {
                console.log(`${key}: ${value} (Type: ${typeof value})`);
            }
        }
    
        try {
            const response = await fetch('/api/admin/add-product', {
                method: 'POST',
                body: formData
            });
    
            if (response.ok) {
                alert('Product added successfully!');
                addProductForm.reset();
                uploadedImages = [];
                imagePreviewContainer.innerHTML = ''; // Clear the preview
                fetchProducts();
            } else {
                const errorData = await response.json();
                alert('Error adding product: ' + errorData.message);
            }
        } catch (error) {
            console.error('Error adding product:', error);
        }
    });

    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Image upload handling
    const imageDropArea = document.getElementById('image-drop-area');
    const imageInput = document.getElementById('product-image-file');
    const addImageUrlBtn = document.getElementById('add-image-url-btn');

    imageDropArea.addEventListener('click', () => {
        imageInput.click(); // Simulate click on the hidden file input
    });

    imageDropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        imageDropArea.classList.add('dragover');
    });

    imageDropArea.addEventListener('dragleave', () => {
        imageDropArea.classList.remove('dragover');
    });

    imageDropArea.addEventListener('drop', (event) => {
        event.preventDefault();
        imageDropArea.classList.remove('dragover');
        handleFiles(event.dataTransfer.files);
    });

    imageInput.addEventListener('change', (event) => {
        handleFiles(event.target.files);
    });

    addImageUrlBtn.addEventListener('click', () => {
        const imageUrl = imageUrlInput.value.trim();
        if (imageUrl) {
            addImageFromUrl(imageUrl);
            imageUrlInput.value = ''; // Clear the input field
        }
    });

    // Function to handle files from the file input or drag-and-drop
    function handleFiles(files) {
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            uploadedImages.push(file);

            const reader = new FileReader();
            reader.onload = (event) => {
                addImageToPreview(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    // Function to handle images added via URL
    function addImageFromUrl(url) {
        uploadedImages.push(url);
        addImageToPreview(url);
    }

    // Function to add images (either file-based or URL-based) to the preview area
    function addImageToPreview(imageUrl) {
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');

        const img = document.createElement('img');
        img.src = imageUrl;
        img.classList.add('uploaded-image');
        img.alt = 'Product Image';

        imageContainer.appendChild(img);
        imagePreviewContainer.appendChild(imageContainer);
    }

    const loadGames = async () => {
        try {
            const response = await fetch('/api/games');
            if (!response.ok) throw new Error('Failed to load games');
            const games = await response.json();
            displayGames(games);
        } catch (error) {
            console.error('Error loading games:', error);
        }
    };

    const displayGames = (games) => {
        gameList.innerHTML = games.map(game => `
            <li>
                <div>
                    <strong>${game.title}</strong><br>
                    <p><strong>Date:</strong> ${new Date(game.game_date).toLocaleDateString('en-GB')}</p>
                    <p><strong>Home Team:</strong> ${game.team_home}</p>
                    <p><strong>Away Team:</strong> ${game.team_away}</p>
                    <p><strong>Stadium:</strong> ${game.stadium_name}</p>
                    <p><strong>Status:</strong> ${game.status}</p>
                </div>
                <button data-id="${game.id}" class="remove-product">Remove Game</button>
            </li>
        `).join('');

        // Handle game removal
        gameList.querySelectorAll('.remove-product').forEach(button => {
            button.addEventListener('click', async (event) => {
                const gameId = button.getAttribute('data-id');
                if (confirm('Are you sure you want to remove this game?')) {
                    await removeGame(gameId);
                }
            });
        });
    };

    async function removeGame(gameId) {
        try {
            const response = await fetch(`/api/admin/remove-game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ gameId })
            });

            if (response.ok) {
                alert('Game removed successfully!');
                loadGames();  // Refresh the list of games after removal
            } else {
                const errorData = await response.json();
                alert('Error removing game: ' + errorData.message);
            }
        } catch (error) {
            console.error('Error removing game:', error);
        }
    }

    addGameForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const gameData = {
            game_date: document.getElementById('game-date').value,
            title: document.getElementById('game-title').value,
            team_home: document.getElementById('team_home').value,
            team_away: document.getElementById('team_away').value,
            stadium_name: document.getElementById('stadium-name').value,
            status: document.getElementById('status').value,
        };

        try {
            const response = await fetch('/api/admin/add-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gameData)
            });

            if (response.ok) {
                alert('Game added successfully!');
                addGameForm.reset();
                loadGames();
            } else {
                const errorData = await response.json();
                alert('Error adding game: ' + errorData.message);
            }
        } catch (error) {
            console.error('Error adding game:', error);
        }
    });

    // Initial data fetches
    fetchActivities();
    fetchProducts();
    loadGames();
});
