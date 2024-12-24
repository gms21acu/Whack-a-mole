const hammer = document.getElementById('hammer');
const holes = document.querySelectorAll('.hole');  // This now includes all 9 holes
let currentMole = null;
let moleTimer = null;
let score = 0;
let timer = 60;
let timerInterval;
let playerId = null;
const socket = new WebSocket('wss://whack-a-mole.fly.dev');

// Display player ID and score updates
socket.onopen = () => {
    console.log('Connected to WebSocket server');
};

// Listen for messages from the server
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'yourId') {
        // Set the player's unique ID and display it
        playerId = data.playerId;
        document.getElementById('playerId').textContent = `Your Player ID: ${playerId}`;
    } else if (data.type === 'scores') {
        // Update the high scores displayed on the page
        updateHighScores(data.scores);
    }
};

// Function to send score update to the server
function updateScore(points) {
    score += points;
    document.getElementById('score').textContent = `Score: ${score}`;

    // Send the updated score to the server
    socket.send(JSON.stringify({ type: 'score', points }));
}

// Function to update the high scores list
function updateHighScores(scores) {
    const scoreList = document.getElementById('scoreList');
    scoreList.innerHTML = ''; // Clear current scores

    // Sort scores by highest to lowest
    scores.sort((a, b) => b.score - a.score);

    // Display the sorted scores
    scores.forEach((score) => {
        const listItem = document.createElement('li');
        listItem.textContent = `Player ${score.playerId}: ${score.score}`;
        scoreList.appendChild(listItem);
    });
}

function showMole() {
    if (currentMole) {
        currentMole.classList.remove('mole', 'goldenMole', 'badMole');
    }

    const randomHole = holes[Math.floor(Math.random() * holes.length)];

    const moleType = Math.floor(Math.random() * 10); 

    let mole;

    if (moleType < 5) { 
        mole = document.createElement('div');
        mole.classList.add('mole');  // Normal mole
    } else if (moleType < 8) {
        mole = document.createElement('div');
        mole.classList.add('badMole');  // Bad mole
    } else { 
        mole = document.createElement('div');
        mole.classList.add('goldenMole');  // Golden mole
    }

    randomHole.appendChild(mole);  // Append the mole to the hole
    currentMole = mole;  // Keep track of the current mole

    moleTimer = setTimeout(showMole, 1000); // Show a new mole every second
}

// Function to start the timer
function startTimer() {
    timer = 60;
    document.getElementById('timer').textContent = `Time Left: ${timer}s`;

    timerInterval = setInterval(() => {
        timer--;
        document.getElementById('timer').textContent = `Time Left: ${timer}s`;

        if (timer <= 0) {
            clearInterval(timerInterval);
            clearTimeout(moleTimer);
            endGame();
        }
    }, 1000);
}

// Function to end the game
function endGame() {
    alert(`Game over! Your score: ${score}`);
    resetGame();
}

// Function to reset the game
function resetGame() {
    clearInterval(timerInterval);
    clearTimeout(moleTimer);
    timer = 60;
    score = 0;
    document.getElementById('timer').textContent = 'Time Left: 60s';
    document.getElementById('score').textContent = 'Score: 0';

    // Remove the mole from the screen
    if (currentMole) {
        currentMole.remove();
    }

    // Notify the server that the game has ended
    socket.send(JSON.stringify({ type: 'endGame' }));
}

// Start button event listener
document.getElementById('startButton').addEventListener('click', () => {
    resetGame();
    startTimer();
    showMole();
});

// Handle whacking the mole
holes.forEach(hole => {
    hole.addEventListener('click', () => {
        if (hole.contains(currentMole)) {  // Check if the mole is inside the hole
            if (currentMole.classList.contains('goldenMole')) {
                updateScore(30);
            } else if (currentMole.classList.contains('badMole')) {
                updateScore(-30);
            } else {
                updateScore(10);
            }
            currentMole.remove();  // Remove the mole from the hole
        }
    });
});
document.addEventListener('mousemove', (e) => {
    hammer.style.left = `${e.pageX - 40}px`;
    hammer.style.top = `${e.pageY - 40}px`;
});

document.addEventListener('mousedown', () => {
    hammer.style.transform = 'rotate(30deg) scale(1.1)'; // Rotate hammer when clicked
});

document.addEventListener('mouseup', () => {
    hammer.style.transform = 'rotate(-45deg) scale(1)'; // Reset hammer rotation after click
});