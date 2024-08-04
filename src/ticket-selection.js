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

    // Load games
    function loadGames() {
        const selectedMonth = gameDateFilter.value;

        if (!selectedMonth) {
            gamesList.style.display = 'none';
            return;
        }

        fetch('/api/games')
            .then(response => response.json())
            .then(games => {
                gamesList.innerHTML = '';
                let gamesFound = false;
                const filteredGames = games.filter(game => {
                    const gameDate = new Date(game.date);
                    const gameMonth = gameDate.toISOString().slice(0, 7);
                    return game.status === 'scheduled' && gameMonth === selectedMonth;
                });

                filteredGames.forEach(game => {
                    gamesFound = true;
                    const gameItem = document.createElement('div');
                    gameItem.className = 'game-item';
                    if (filteredGames.length === 1) {
                        gameItem.classList.add('single');
                    }
                    gameItem.innerHTML = `
                        <h3>${game.title}</h3>
                        <p>${new Date(game.date).toLocaleDateString()} ${new Date(game.date).toLocaleTimeString()}</p>
                        <button>Select Match</button>
                    `;
                    gameItem.querySelector('button').addEventListener('click', () => selectGame(game.id));
                    gamesList.appendChild(gameItem);
                });

                gamesList.style.display = gamesFound ? 'block' : 'none';
                document.getElementById('message').innerText = gamesFound ? '' : 'No games available for the selected date.';
            });
    }

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
