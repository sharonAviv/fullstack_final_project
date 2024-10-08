document.addEventListener('DOMContentLoaded', function() {
    const gameSelection = document.getElementById('game-selection');
    const standSelection = document.getElementById('stand-selection');
    const seatSelection = document.getElementById('seat-selection');
    const checkoutScreen = document.getElementById('ticket-checkout');

    const gamesList = document.getElementById('games-list');
    const stadiumMap = document.getElementById('stadium-map');
    const seatsMap = document.getElementById('seats-map');
    const gameDateFilter = document.getElementById('game-date-filter');
    const continueButton = document.getElementById('continue-button');
    const checkoutTicketsButton = document.getElementById('checkout-tickets');  
    const purchaseCompleteButton = document.getElementById('checkout-form');

    const backToGameButton = document.getElementById('back-game');
    const backToGameFromSeatButton = document.getElementById('back-game-seat');
    const backToGameFromCheckoutButton = document.getElementById('back-game-checkout');
    const backToStandButton = document.getElementById('back-stand');
    const backToStandFromCheckoutButton = document.getElementById('back-stand-checkout');
    const backToSeatButton = document.getElementById('back-seat-checkout');

    let selectedGameId = null;
    let selectedStand = null;
    let seatInfo = null;
    let ticketIds = [];
    let totalPrice = 0;
    const res = null;

    // Load games and filter based on selected month
    const loadGames = async () => {
        const selectedMonth = gameDateFilter.value;

        if (!selectedMonth) {
            gamesList.style.display = 'none';
            return;
        }

        try {
            const games = await fetchGames(); // Fetch the games
            console.log(games);
            const filteredGames = filterGames(games, selectedMonth); // Filter based on selected month
            console.log("Filtered Games:", filteredGames); // Log filtered results
            displayGames(filteredGames); // Display the filtered games
        } catch (error) {
            console.error("Error loading games:", error);
        }
    };

    // Function to fetch games from the API
    const fetchGames = async () => {
        const response = await fetch('/api/games');
        const games = await response.json();
        // Log the game dates before filtering
        console.log("Game Dates:", games.map(game => game.game_date));
        return games;
    };

    // Function to filter games based on the selected month
    const filterGames = (games, selectedMonth) => {
        return games.filter(game => {
            const gameMonth = game.game_date.slice(0, 7).trim(); // Get the year-month part of the date
            console.log("Game Month:", gameMonth); // Log the month for each game
            console.log("Selected Month:", selectedMonth); // Log selected month

            // Check that both are the same for filtering
            return game.status === 'scheduled' && gameMonth === selectedMonth.trim();
        });
    };

    console.log("Selected Month Value from Filter:", gameDateFilter.value);

    // Function to display the filtered games
    const displayGames = (filteredGames) => {
        gamesList.innerHTML = ''; // Clear the list
        let gamesFound = false;

        // Debugging: Check the selected month and the filtered results
        console.log("Filtered Games:", filteredGames);

        filteredGames.forEach(game => {
            gamesFound = true;
            const gameItem = document.createElement('div');
            gameItem.className = 'game-item';
            if (filteredGames.length === 1) {
                gameItem.classList.add('single');
            }

            // Format the game date to "YYYY-MM-DD 20:00"
            const formattedDate = game.game_date.split('T')[0]; // Get just the date part (YYYY-MM-DD)
            const time = '20:00'; // Fixed time                     

            gameItem.innerHTML = `
                <h3>${game.title}</h3>
                <p>${formattedDate} ${time}</p>
                <button>Select Match</button>
            `;
            gameItem.querySelector('button').addEventListener('click', () => selectGame(game.game_id));
            gamesList.appendChild(gameItem);
        });

        gamesList.style.display = gamesFound ? 'block' : 'none';
        document.getElementById('message').innerText = gamesFound ? '' : 'No games available for the selected date.';
    };

    continueButton.addEventListener('click', () => {
        console.log('Continue button clicked.');
        if (gameDateFilter.value) {
            loadGames();
        }
    });

    backToGameButton.addEventListener('click', () => {
        console.log('Back to game selection button clicked.');
        standSelection.style.display = 'none';
        gameSelection.style.display = 'block';
    });

    backToGameFromSeatButton.addEventListener('click', () => {
        console.log('Back to game selection button from seat clicked.');
        seatSelection.style.display = 'none';
        gameSelection.style.display = 'block';
    });

    backToGameFromCheckoutButton.addEventListener('click', () => {
        console.log('Back to game selection button from checkout clicked.');
        checkoutScreen.style.display = 'none';
        gameSelection.style.display = 'block';
    });

    backToStandButton.addEventListener('click', () => {
        console.log('Back to stand selection button clicked.');
        seatSelection.style.display = 'none';
        standSelection.style.display = 'block';
    });

    backToSeatButton.addEventListener('click', () => {
        console.log('Back to seat selection button from checkout clicked.');
        checkoutScreen.style.display = 'none';
        seatSelection.style.display = 'block';
    });

    backToStandFromCheckoutButton.addEventListener('click', () => {
        console.log('Back to stand selection button checkout clicked.');
        checkoutScreen.style.display = 'none';
        standSelection.style.display = 'block';
    });

    checkoutTicketsButton.addEventListener('click', () => {
        console.log('Checkout button clicked.');
        seatSelection.style.display = 'none';
        checkoutScreen.style.display = 'block';
        loadCheckout();
    });

    purchaseCompleteButton.addEventListener('submit', (event) => {
        console.log('Purchase complete button clicked.');
        event.preventDefault(); // Prevents the default form submission behavior
        checkoutScreen.style.display = 'none';
        ticketPayment();
        console.log("res: " + res);
        console.log('Payment process finished, redirecting to confirmation');
        window.location.href = 'confirmation.html';
    });
    
    async function ticketPayment() {
        if (ticketIds.length === 0) {
            console.log('No tickets in cart to purchase');
            return;
        }
        try {
            // Simulate order completion and clearing the cart on the server
            console.log('Trying to purchase tickets for ' + JSON.stringify({ ticketIds }));
            const response = await fetch('/api/tickets/purchase', {
                method: 'POST',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json'
                }, 
                body: JSON.stringify({ ticketIds }) 
            });

            res = response.status;

            if (response.ok) {
                console.log('Tickets purchased successfully');
                alert('Tickets purchased successfully');
            } else {
                console.error('Failed to purchase tickets');
                alert('Failed to purchase tickets');

            }
        } catch (error) {
            res = response.status;
            alert(error);
            console.error('Error during purchase:', error);
            alert('There was an issue completing your purchase. Please try again.');
        }
    }

    function selectGame(gameId) {
        selectedGameId = gameId;
        gameSelection.style.display = 'none';
        standSelection.style.display = 'block';
        loadStands(selectedGameId);
    }

    // Load stands
    function loadStands(selectedGameId) {
        fetch(`/api/tickets?gameId=${selectedGameId}`)
            .then(response => response.json())
            .then(tickets => {
                console.log("Fetched Tickets for Game ID:", selectedGameId, tickets);
                const stands = ['north', 'south', 'east', 'west'];
                stands.forEach(stand => {
                    const standElement = document.getElementById(`${stand}-stand`);
                    const availableTickets = tickets.filter(ticket => ticket.stand === stand && ticket.status === 'available').length;
                    console.log(`${stand} available tickets:`, availableTickets);
    
                    // Remove any existing event listeners
                    standElement.replaceWith(standElement.cloneNode(true));
                    const newStandElement = document.getElementById(`${stand}-stand`);
    
                    if (availableTickets > 0) {
                        console.log(stand + " available");
                        newStandElement.className = 'stand available';
                        newStandElement.addEventListener('click', () => selectStand(stand));
                    } else {
                        console.log(stand + " not available");
                        newStandElement.className = 'stand unavailable';
                    }
                });
            })
            .catch(error => console.error('Error fetching tickets:', error));
    }
    
    function selectStand(stand) {
        selectedStand = stand;
        standSelection.style.display = 'none';
        seatSelection.style.display = 'block';
        loadSeats();
    }

    // Load seats
    function loadSeats() {
        fetch(`/api/tickets?gameId=${selectedGameId}&stand=${selectedStand}`)
            .then(response => response.json())
            .then(tickets => {
                console.log("Fetched tickets for selected stand:", tickets);
                seatsMap.innerHTML = '';
                for (let i = 1; i <= 100; i++) {
                    const seatNumber = `${i}${selectedStand.charAt(0).toUpperCase()}`;
                    const ticket = tickets.find(t => t.seat_number === seatNumber);
                    const seatElement = document.createElement('div');
                    seatElement.className = 'seat';
                    seatElement.setAttribute('data-seat-number', seatNumber);
                    if (ticket) {
                        seatElement.setAttribute('data-ticket-id', ticket.ticket_id);
                        if (ticket.status === 'available') {
                            seatElement.classList.add('available');
                            seatElement.addEventListener('click', () => selectSeat(ticket));
                        } else {
                            seatElement.classList.add('unavailable');
                        }
                    } else {
                        seatElement.classList.add('unavailable');
                    }                    
                    seatsMap.appendChild(seatElement);
                }
            })
            .catch(error => console.error('Error fetching seats:', error));
    }
    
    function selectSeat(seat) {
        seatInfo = document.createElement('div');
        seatInfo.className = 'seat-info';
        seatInfo.innerHTML = `
            <button class="close-btn" style="position: absolute; top: -13px; right: -45px; background: none; border: none; font-size: 1.2em; cursor: pointer; color: black;">x</button>            
            <p>Seat: ${seat.seat_number}</p>
            <p>Price: $${seat.price}</p>
            <button>Add to Cart</button>
        `;
        seatInfo.querySelector('button:not(.close-btn)').addEventListener('click', () => addToCart(seat.ticket_id));
        seatInfo.querySelector('.close-btn').addEventListener('click', () => seatInfo.style.display = 'none');
        seatsMap.appendChild(seatInfo);
        seatInfo.style.display = 'block';
    }
    
    function addToCart(ticketId) {
        fetch('/api/ticket-cart/add-to-cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ticketId: ticketId }), 
        })
        .then(response => {
            return response.json().then(data => ({ status: response.status, data }));
        })
        .then(({ status, data }) => {
            if (status === 200) {
                // If the server responds with a 200 indicating the user needs to sign in
                alert('You need to sign in to add items to your cart. Redirecting to login...');
                window.location.href = '/login.html';
                return null; // Return null to prevent further processing
            }
            if (status === 201) {
                alert('Ticket added to cart');
                console.log('Ticket was added to ticket cart with ticket ID:', ticketId);
                // Change the seat color to light green
                const seatElement = document.querySelector(`.seat[data-ticket-id="${ticketId}"]`);
                if (seatElement) {
                    seatElement.classList.remove('available');
                    seatElement.classList.add('in-cart');
                }
            } else {
                alert('Failed to add ticket to cart: ' + data.message);
            }
            seatInfo.style.display = 'none'; // Hide seat info after adding to cart
        })
        .catch(error => console.error('Error:', error));
    }

    // Load user's ticket cart for checkout
    function loadCheckout() {
        fetch(`/api/ticket-cart/view`)
            .then(response => {
                console.log('Fetch tickets response:', response);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(ticketCartItems => {
                // Extract all ticket_id values
                ticketIds = ticketCartItems.map(item => item.ticket_id);
                console.log('Fetch ticket ids:', ticketIds);
                
                // Fetch ticket details for each ticket_id
                const ticketDetailsPromises = ticketIds.map(ticketId =>
                    fetch(`/api/tickets?ticketId=${ticketId}`)
                        .then(response => response.json())
                );

                // Wait for all ticket details to be fetched
                return Promise.all(ticketDetailsPromises);
            })
            // Handle tickets presentation
            .then(ticketsDetailsArray => {
                // Flatten the array of ticket details
                const ticketsDetails = ticketsDetailsArray.flat();

                // Clear the container before adding new tickets
                const checkoutContainer = document.getElementById('checkoutContainer');
                checkoutContainer.innerHTML = ''; // Clear existing tickets
                
                // Display the required fields for each ticket
                ticketsDetails.forEach(ticket => {
                    const { ticket_id, game_date, seat_number, stand, price } = ticket;
                    totalPrice += price;
                    // Render each ticket's details
                    renderTicketDetails(ticket_id, game_date, seat_number, stand, price);
                });
            })
            .catch(error => {
                console.error('Error loading checkout:', error);
            });
    }

    function renderTicketDetails(ticket_id, game_date, seat_number, stand, price) {
        const ticketDetailsDiv = document.createElement('div');
        ticketDetailsDiv.className = 'ticket-details';
        ticketDetailsDiv.setAttribute('data-ticket-id', ticket_id);
        ticketDetailsDiv.innerHTML = `
            <p><b>Game Date</b>: ${game_date}</p>
            <p><b>Seat Number</b>: ${seat_number}</p>
            <p><b>Stand</b>: ${stand}</p>
            <p><b>Price</b>: ${price}$</p>
            <p><b>Ticket ID</b>: ${ticket_id}</p>
            <button class="clear-cart" data-ticket-id="${ticket_id}" style="background-color: #c0392b; transition: background-color 0.3s ease; width: 50%;">Remove ticket</button>
        `;
        document.getElementById('checkoutContainer').appendChild(ticketDetailsDiv);
    
        ticketDetailsDiv.querySelector('.clear-cart').addEventListener('click', function() {
            removeTicketFromCart(ticket_id);
        });
    }
    
    function removeTicketFromCart(ticketId) {
        fetch('/api/ticket-cart/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ticketId: ticketId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Item removed successfully') {
                const ticketElement = document.querySelector(`.ticket-details[data-ticket-id="${ticketId}"]`);
                if (ticketElement) {
                    ticketElement.remove();
                }
                // Update the ticketIds array
                ticketIds = ticketIds.filter(id => id !== ticketId);
            } else {
                console.error('Failed to remove ticket from cart');
            }
        })
        .catch(error => console.error('Error:', error));
    }
    
    
    
    
     

    loadGames();
});
