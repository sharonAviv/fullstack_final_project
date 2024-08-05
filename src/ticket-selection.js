document.addEventListener('DOMContentLoaded', function() {
    const gameSelection = document.getElementById('game-selection');
    const standSelection = document.getElementById('stand-selection');
    const seatSelection = document.getElementById('seat-selection');

    const gamesList = document.getElementById('games-list');
    const stadiumMap = document.getElementById('stadium-map');
    const seatsMap = document.getElementById('seats-map');
    const gameDateFilter = document.getElementById('game-date-filter');
    const continueButton = document.getElementById('continue-button');

    let selectedGameId = null;
    let selectedStand = null;

    // Load games and filter based on selected month
    const loadGames = async () => {
        const selectedMonth = gameDateFilter.value;

        if (!selectedMonth) {
            gamesList.style.display = 'none';
            return;
        }

        try {
            const games = await fetchGames(); // Fetch the games
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

    // In your HTML or JavaScript, make sure you log the selected month value to ensure it’s correct
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
            gameItem.querySelector('button').addEventListener('click', () => selectGame(game.id));
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

    function selectGame(gameId) {
        selectedGameId = gameId;
        gameSelection.style.display = 'none';
        standSelection.style.display = 'block';
        loadStands();
    }

    // Load stands
    function loadStands() {
        fetch(`/api/tickets?gameId=${selectedGameId}`)
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Error: ${text}`);
                    });
                }
                return response.json();
            })
            .then(tickets => {
                if (!Array.isArray(tickets)) {
                    throw new Error('Tickets response is not an array');
                }
                const stands = ['north', 'south', 'east', 'west'];
                stands.forEach(stand => {
                    const standElement = document.getElementById(`${stand}-stand`);
                    const availableTickets = tickets.filter(ticket => ticket.stand === stand && ticket.status === 'available').length;
                    if (availableTickets > 0) {
                        standElement.className = 'stand available';
                        standElement.addEventListener('click', () => selectStand(stand));
                    } else {
                        standElement.className = 'stand unavailable';
                    }
                });
            })
            .catch(error => console.error('Error loading stands:', error));
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
                seatsMap.innerHTML = '';
                for (let i = 1; i <= 100; i++) {
                    const seatNumber = `${selectedStand.charAt(0).toUpperCase()}${i}`;
                    const seat = tickets.find(ticket => ticket.seat_number === seatNumber);
                    const seatElement = document.createElement('div');
                    seatElement.className = 'seat';
                    if (seat && seat.status === 'available') {
                        seatElement.classList.add('available');
                        seatElement.addEventListener('click', () => selectSeat(seat));
                    } else {
                        seatElement.classList.add('unavailable');
                    }
                    seatsMap.appendChild(seatElement);
                }
            });
    }

    function selectSeat(seat) {
        const seatInfo = document.createElement('div');
        seatInfo.className = 'seat-info';
        seatInfo.innerHTML = `
            <p>Seat: ${seat.seat_number}</p>
            <p>Price: $${seat.price}</p>
            <button>Add to Cart</button>
        `;
        seatInfo.querySelector('button').addEventListener('click', () => addToCart(seat._id));
        seatsMap.appendChild(seatInfo);
        seatInfo.style.display = 'block';
    }

    function addToCart(seatId) {
        fetch('/api/tickets/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ticketIds: [seatId] }),
        })
        .then(response => response.json())
        .then(data => {
            alert('Ticket added to cart');
            seatInfo.style.display = 'none';
        })
        .catch(error => console.error('Error:', error));
    }

    loadGames();
});
