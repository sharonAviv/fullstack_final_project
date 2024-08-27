document.addEventListener('DOMContentLoaded', () => {
    const activityTableBody = document.getElementById('activity-table-body');
    const usernameFilter = document.getElementById('username-filter');
    const productList = document.getElementById('product-list');
    const addProductForm = document.getElementById('add-product-form');
    const imageDropArea = document.getElementById('image-drop-area');
    const productImageFileInput = document.getElementById('product-image-file');
    const imagePreview = document.getElementById('image-preview');
    let uploadedImages = [];
    let currentProductId = null;
    let currentProductImages = [];

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
                    <p><strong>Description:</strong> ${product.description}</p>
                    <p><strong>Price:</strong> $${product.price.toFixed(2)}</p>
                    <p><strong>Stock:</strong> <span class="product-amount">${product.stock}</span></p>
                    <div class="quantity-control">
                        <input type="number" class="manual-amount" value="1" min="1" data-id="${product.id}">
                        <button class="add-amount" data-id="${product.id}">Add to stock</button>
                        <button class="remove-amount" data-id="${product.id}">Remove form stock</button>
                    </div>
                    <div class="product-actions">
                        <button class="change-name" data-id="${product.id}">Change Name</button>
                        <button class="change-price" data-id="${product.id}">Change Price</button>
                        <button class="change-description" data-id="${product.id}">Change Description</button>
                        <button class="edit-images" data-id="${product.id}" data-images='${JSON.stringify(product.images)}'>Edit Pictures</button>
                    </div>
                </div>
                <button data-id="${product.id}" class="remove-product">Remove Product</button>
            </li>
        `).join('');
    }

    // Handle image drag-and-drop and preview
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

    productImageFileInput.addEventListener('change', (event) => {
        handleFiles(event.target.files);
    });

    function handleFiles(files) {
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;

            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target.result;
                uploadedImages.push(file);
                displayImagePreview(imageUrl, file.name);
            };
            reader.readAsDataURL(file);
        }
    }

    function displayImagePreview(imageUrl, fileName) {
        const container = document.createElement('div');
        container.className = 'image-container';

        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'uploaded-image';

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-image-btn';
        removeButton.textContent = '×';
        removeButton.onclick = () => removeImage(fileName, container);

        container.appendChild(img);
        container.appendChild(removeButton);
        imagePreview.appendChild(container);
    }

    function removeImage(fileName, container) {
        imagePreview.removeChild(container);
        uploadedImages = uploadedImages.filter(file => file.name !== fileName);
    }

    // Handle adding a new product
    addProductForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append('name', document.getElementById('product-title').value);
        formData.append('description', document.getElementById('product-description').value);
        formData.append('price', parseFloat(document.getElementById('price').value));
        formData.append('stock', parseInt(document.getElementById('amount').value) || 0);

        uploadedImages.forEach((file) => {
            formData.append('images', file);
        });

        try {
            const response = await fetch('/api/admin/add-product', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Product added successfully!');
                addProductForm.reset();
                imagePreview.innerHTML = '';
                uploadedImages = [];
                fetchProducts();
            } else {
                const errorData = await response.json();
                alert('Error adding product: ' + errorData.message);
            }
        } catch (error) {
            console.error('Error adding product:', error);
        }
    });

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

        if (event.target.classList.contains('change-name')) {
            const newName = prompt('Enter the new product name:');
            if (newName && confirm('Are you sure you want to change the product name?')) {
                await updateProductInfo(productId, { name: newName });
            }
        }

        if (event.target.classList.contains('change-price')) {
            const newPrice = prompt('Enter the new product price:');
            if (newPrice && !isNaN(newPrice) && confirm('Are you sure you want to change the product price?')) {
                await updateProductInfo(productId, { price: parseFloat(newPrice) });
            }
        }

        if (event.target.classList.contains('change-description')) {
            const newDescription = prompt('Enter the new product description:');
            if (newDescription && confirm('Are you sure you want to change the product description?')) {
                await updateProductInfo(productId, { description: newDescription });
            }
        }

        if (event.target.classList.contains('edit-images')) {
            currentProductId = productId;
            
            // Get the JSON string from the data-images attribute
            let imagesData = event.target.getAttribute('data-images');
        
            // First, parse the main JSON string to remove extra quotes
            let parsedImagesString = JSON.parse(imagesData);
        
            // Then, parse the resulting string to get the actual array
            currentProductImages = JSON.parse(parsedImagesString);
        
            console.log(currentProductImages);
            showEditImageModal();
        }

        if (event.target.classList.contains('remove-product')) {
            if (confirm('Are you sure you want to remove this product?')) {
                await removeProduct(productId);
            }
        }
    });

    function showEditImageModal() {
        const modalContent = `
            <div class="modal-overlay">
                <div class="modal">
                    <h3>Edit Product Images</h3>
                    <div id="edit-image-preview" class="image-preview"></div>
                    <div id="edit-image-drop-area" class="drop-area">
                        <p>Drag and drop images here, or click to select images</p>
                        <input type="file" id="edit-product-image-file" accept="image/*" multiple>
                    </div>
                    <button id="save-edited-images">Save Changes</button>
                    <button id="cancel-edit-images">Cancel</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalContent);
    
        const editImagePreview = document.getElementById('edit-image-preview');
        const editImageDropArea = document.getElementById('edit-image-drop-area');
        const editProductImageFileInput = document.getElementById('edit-product-image-file');
        const saveEditedImagesBtn = document.getElementById('save-edited-images');
        const cancelEditImagesBtn = document.getElementById('cancel-edit-images');
    
        currentProductImages.forEach(imageUrl => {
            const container = document.createElement('div');
            container.className = 'image-container small-image-container';
    
            const img = document.createElement('img');
            img.src = imageUrl;
            img.className = 'uploaded-image small-uploaded-image';
    
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-image-btn';
            removeButton.textContent = '×';
            removeButton.onclick = () => removeImage(imageUrl, container);
    
            container.appendChild(img);
            container.appendChild(removeButton);
            editImagePreview.appendChild(container);
        });
    
        editImageDropArea.addEventListener('dragover', (event) => {
            event.preventDefault();
            editImageDropArea.classList.add('dragover');
        });
    
        editImageDropArea.addEventListener('dragleave', () => {
            editImageDropArea.classList.remove('dragover');
        });
    
        editImageDropArea.addEventListener('drop', (event) => {
            event.preventDefault();
            editImageDropArea.classList.remove('dragover');
            handleEditFiles(event.dataTransfer.files);
        });
    
        editProductImageFileInput.addEventListener('change', (event) => {
            handleEditFiles(event.target.files);
        });
    
        saveEditedImagesBtn.addEventListener('click', async () => {
            await updateProductInfo(currentProductId, { images: currentProductImages });
            closeModal();
        });
    
        cancelEditImagesBtn.addEventListener('click', () => {
            closeModal();
        });
    }

    function displayEditImagePreview(imageUrl) {
        const container = document.createElement('div');
        container.className = 'image-container preview-image-container';
    
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'uploaded-image preview-uploaded-image';
    
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-image-btn';
        removeButton.textContent = '×';
        removeButton.onclick = () => removeImage(imageUrl, container);
    
        container.appendChild(img);
        container.appendChild(removeButton);
        document.getElementById('edit-image-preview').appendChild(container);
    }

    function handleEditFiles(files) {
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;

            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target.result;
                currentProductImages.push(imageUrl);
                displayEditImagePreview(imageUrl);
            };
            reader.readAsDataURL(file);
        }
    }

    function removeImage(imageUrl, container) {
        const preview = container.closest('.image-preview');
        preview.removeChild(container);
        currentProductImages = currentProductImages.filter(img => img !== imageUrl);
    }

    async function saveEditedImages() {
        const formData = new FormData();
        formData.append('productId', currentProductId);
    
        currentProductImages.forEach((file, index) => {
            formData.append('images', file);
        });

        try {
            const response = await fetch('/api/admin/update-product-images', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Images updated successfully!');
                fetchProducts();
            } else {
                const errorData = await response.json();
                alert('Error updating images: ' + errorData.message);
            }
        } catch (error) {
            console.error('Error updating images:', error);
        }
    }

    function closeModal() {
        document.querySelector('.modal-overlay').remove();
        currentProductImages = [];
    }

    // Function to update product stock
    async function updateProductStock(productId, stockChange, updatedStock, stockElement) {
        try {
            const response = await fetch('/api/admin/update-product-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, stockChange })
            });

            if (response.ok) {
                stockElement.textContent = updatedStock;
                alert('Stock updated successfully!');
            } else {
                const errorData = await response.json();
                alert('Error updating stock: ' + errorData.message);
            }
        } catch (error) {
            console.error('Error updating stock:', error);
        }
    }

    // Function to update product information
    async function updateProductInfo(productId, updateData, newImages = [], stockElement = null) {
        try {
            const formData = new FormData();
            formData.append('productId', productId);
    
            // Append the update data to the formData
            for (const [key, value] of Object.entries(updateData)) {
                if (Array.isArray(value)) {
                    value.forEach((item, index) => {
                        formData.append(`${key}[${index}]`, item);
                    });
                } else {
                    formData.append(key, value);
                }
            }
    
            // Append the new images to the formData
            newImages.forEach((file) => {
                formData.append('images', file);
            });
    
            const response = await fetch('/api/admin/update-product-info', {
                method: 'POST',
                body: formData // Use formData instead of JSON
            });
    
            if (response.ok) {
                alert('Product updated successfully!');
                if (updateData.stock && stockElement) {
                    stockElement.textContent = updateData.stock; // Update stock display in the UI
                }
                fetchProducts(); // Refresh product list
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

    // Initial data fetches
    fetchActivities();
    fetchProducts();
});
