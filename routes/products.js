const { saveProduct, getProducts, searchProducts } = require('./persist');

// Function to save a product
async function saveNewProduct(product) {
  try {
    const productId = await saveProduct(product);
    console.log(`Product saved with ID: ${productId}`);
  } catch (error) {
    console.error('Error saving product:', error);
  }
}

// Function to get all products
async function retrieveAllProducts() {
  try {
    const products = await getProducts();
    return products;
  } catch (error) {
    console.error('Error retrieving products:', error);
    return [];
  }
}

// Function to search for products
async function findProducts(query) {
  try {
    const products = await searchProducts(query);
    return products;
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

module.exports = { saveNewProduct, retrieveAllProducts, findProducts };
