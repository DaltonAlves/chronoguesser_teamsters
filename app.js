// Game State Variables
let gamePool = [];
let currentProblem = null;

// DOM Element References
const slider = document.getElementById('year-slider');
const guessDisplay = document.getElementById('guess-display');
const submitBtn = document.getElementById('submit-btn');
const nextBtn = document.getElementById('next-btn');
const frame = document.getElementById('game-frame');
const loading = document.getElementById('loading');
const siteClue = document.getElementById('site-clue');
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const resultDetails = document.getElementById('result-details');

// Dynamic Slider Label References
const minYearLabel = document.getElementById('min-year-label');
const maxYearLabel = document.getElementById('max-year-label');

// Synchronize the text display with the slider handle during adjustment
slider.addEventListener('input', (e) => {
    guessDisplay.textContent = e.target.value;
});

// Load the compiled database file and configure timeline boundaries
async function initGame() {
    try {
        const response = await fetch('gamedata.json');
        if (!response.ok) throw new Error("Could not find gamedata.json matrix.");
        
        gamePool = await response.json();
        
        if (gamePool.length > 0) {
            const years = gamePool.map(item => item.year);
            
            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);
            
            // Set the slider boundaries to match the dataset scope
            slider.min = minYear;
            slider.max = maxYear;
            
            // Position the default handle exactly mid-way through the timeline
            slider.value = Math.floor((minYear + maxYear) / 2);
            guessDisplay.textContent = slider.value;
            
            // Populate the boundary text wrappers
            minYearLabel.textContent = minYear;
            maxYearLabel.textContent = maxYear;
        }

        startNewRound();
    } catch (err) {
        console.error("Game boot failure:", err);
        siteClue.textContent = "Error initializing timeline matrix.";
    }
}

// Select a random entry and prepare the interface
function startNewRound() {
    if (gamePool.length === 0) return;
    
    loading.classList.remove('hidden');
    resultModal.classList.add('hidden');
    submitBtn.classList.remove('hidden');
    nextBtn.classList.add('hidden');
    frame.src = "";
    
    currentProblem = gamePool[Math.floor(Math.random() * gamePool.length)];
    
    // Updated: Display the raw historic URL instead of the descriptive title
    siteClue.textContent = `Original URL: ${currentProblem.displayUrl}`;
    
    frame.src = currentProblem.iframeUrl;
    
    frame.onload = () => {
        loading.classList.add('hidden');
    };
}

// Calculate the score based on proximity to the target year
function evaluateGuess() {
    const userGuess = parseInt(slider.value);
    const actualYear = currentProblem.year;
    const difference = Math.abs(userGuess - actualYear);
    
    // Point subtraction modifier based on distance from accuracy
    const pointsEarned = Math.max(0, 5000 - (difference * 500));
    
    resultModal.classList.remove('hidden');
    submitBtn.classList.add('hidden');
    nextBtn.classList.remove('hidden');
    
    if (difference === 0) {
        resultTitle.textContent = "Spot On! Perfect Score!";
        resultTitle.style.color = "green";
    } else if (difference <= 2) {
        resultTitle.textContent = "Incredibly Close!";
        resultTitle.style.color = "orange";
    } else {
        resultTitle.textContent = "A bit off target!";
        resultTitle.style.color = "red";
    }
    
    resultDetails.innerHTML = `The guess was <strong>${userGuess}</strong>. The target capture was from <strong>${actualYear}</strong>.<br><strong>Points awarded: ${pointsEarned}/5000</strong>`;
}

// Attach control interface listeners
submitBtn.addEventListener('click', evaluateGuess);
nextBtn.addEventListener('click', startNewRound);

// Initialize the execution loop on page load
window.onload = initGame;