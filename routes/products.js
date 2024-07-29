const fs = require('fs');
const path = require('path');
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

async function saveProduct(product) {
    const products = await getProducts();
    products.push(product);
    return fs.promises.writeFile(PRODUCTS_FILE, JSON.stringify(products));
}

async function getProducts() {
    try {
        const data = await fs.promises.readFile(PRODUCTS_FILE);
        return JSON.parse(data);
    } catch (error) {
        return []; // Return an empty array if no products or error
    }
}

async function searchProducts(query) {
    const products = await getProducts();
    return products.filter(p => p.name.startsWith(query) || p.description.startsWith(query));
}

module.exports = { saveProduct, getProducts, searchProducts };
