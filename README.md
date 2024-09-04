# Israel's Soccer Team's Store

### Project Overview

Israel's Soccer Team's Store is an e-commerce web application built to sell products for Israel's Soccer Team fans, including tickets to the team's games. The app provides a user-friendly interface to browse, search, and purchase items, manage a shopping cart, and even get the latest news about the team.

---

## Features

- **User Authentication**: Register, login, and logout functionalities.
- **Ticket Purchasing**: Buy tickets for the national team's games, including filtering by date, selecting stadium stands, and choosing specific seats.
- **Shopping Cart**: Add items to the cart, view, and manage your cart before completing purchases.
- **News Section**: View selected news articles about the national soccer team from the NewsAPI.
- **Contact Us**: Send emails directly from the site to the support team.
- **Admin Panel**: Manage products, games, and view user activities.

---

## Project Structure

Here's an overview of the project's root directory structure:

```plaintext
israel-soccer-store/
├── routes/                 # Express route handlers
│   ├── admin-server.js      # Admin-specific routes
│   ├── auth-server.js       # Authentication logic
│   ├── cart-server.js       # Shopping cart management
│   ├── contact-server.js    # Contact form handling
│   ├── games-server.js      # Game management
│   ├── news-server.js       # News fetching from NewsAPI
│   ├── store-server.js      # Product store management
│   ├── tickets-server.js    # Ticket management
│   ├── user-data-server.js  # User data management
│   ├── register-server.js   # User registration logic
│   ├── login-server.js      # User login logic
│   ├── logout-server.js     # User logout logic
│   ├── ticket-cart-server.js# Ticket cart management
│   ├── persist.js           # Database manager
│   ├── middleware.js        # Middleware logic
│   ├── security.js          # Security measures
│   ├── activityLogger.js    # Activity logging
│   └── products.js          # Product management
│
├── src/                    # Static files and frontend logic
│
├── icons/                  # Icons and images being used by the app
│
├── tests/                  # Test files for testing routes and functionalities
│
├── server.js               # Main application entry point
├── package.json            # Project dependencies and scripts
└── README.md               # Project documentation (this file)
```

## Installation & Setup

### Prerequisites

* **Node.js**: Ensure Node.js is installed on your machine.
* **SQLite3**: Install SQLite3 on your machine.

### Step 1: Clone the Repository

```bash
git clone https://github.com/sharonAviv/fullstack_final_project.git  
cd israel-soccer-store
```

### Step 2: Install Dependencies

```bash
npm install
```
- Move to /tests folder install dependencies for tests:
```bash
npm install
```

### Step 3: Insert your API Key for NewsAPI and details ethereal email
- In news-server.js, insert your NewsAPI key inside:
```plaintext
apiKey = 'YOUR_API_KEY';
```
- In contact-server.js, insert your username and password for https://ethereal.email/ inside:
```plaintext
  auth: {
    user: 'your.username@ethereal.email',
    pass: 'your-password'
  }
...
      from: '"Your Store" <your.username@ethereal.email>',
      to: "your.username@ethereal.email",
```

### Step 4: Running the Application
- Start the server:
```bash
npm start server.js
```
- The app should now be running on http://localhost:3000.

### Step 5: Running Tests
- Run the test suite:
```bash
node tests/test.js
```
- ##### Important: Ensure to run tests before using the rest of the store's options, as tests rely on initialized products which may change during the application's normal operation.

## Routes

Below are the different routes supported by the application:

#### Authentication Routes:

* **POST /api/register**: Register a new user.
* **POST /api/login**: User login.
* **POST /api/logout**: User logout.

#### User Data Routes:

* **GET /api/user-data**: Retrieve authenticated user data.

#### Game Routes:

* **GET /api/games**: Retrieve all games.

#### Ticket Routes:

* **GET /api/tickets**: Retrieve tickets with optional filters by gameId, stand, or ticketId.
* **POST /api/tickets/purchase**: Purchase tickets.

#### Ticket Cart Routes:

* **GET /api/ticket-cart/view**: View the ticket cart.
* **POST /api/ticket-cart/add-to-cart**: Add a ticket to the cart.
* **POST /api/ticket-cart/remove**: Remove a ticket from the cart.

#### Store Routes:

* **GET /api/store/products**: Retrieve all products.
* **GET /api/store/search**: Search products.

#### Cart Routes:

* **GET /api/cart/view**: View the cart.
* **POST /api/cart/add-to-cart**: Add an item to the cart.
* **POST /api/cart/removeAll**: Remove all items from the cart.
* **POST /api/cart/complete-purchase**: Complete the purchase.

#### News Route:

* **GET /api/news**: Retrieve news articles.

#### Contact Route:

* **POST /api/contact**: Submit a contact form.

#### Admin Routes:

* **GET /api/admin/activities**: Retrieve admin activities.
* **POST /api/admin/add-product**: Add a new product.
* **POST /api/admin/remove-product**: Remove a product.
* **GET /api/admin/products**: Retrieve all products.
* **POST /api/admin/remove-game**: Remove a game.
* **POST /api/admin/add-game**: Add a new game.

## Contributors
- Aviv Sharon - https://github.com/sharonAviv
- Nir Shoham - https://github.com/nir1shoham
