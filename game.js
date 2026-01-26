// Game State Object
const gameData = {
    stats: {
        epoch: 1,
        population: 2
    },
    factions: {
        army: {
            name: 'Армия',
            power: 0,
            people: []
        },
        religion: {
            name: 'Религия',
            power: 0,
            people: []
        },
        farming: {
            name: 'Фермерство',
            power: 0,
            people: [
                { id: 1 },
                { id: 2 }
            ]
        },
        trade: {
            name: 'Торговля',
            power: 0,
            people: []
        }
    },
    people: {
        nextId: 3
    },
    cards: {
        available: [],
        selected: []
    },
    gameOver: false,
    paused: false
};

// UI Element References
const elements = {
    epoch: document.getElementById('epoch'),
    population: document.getElementById('population'),
    armyPower: document.getElementById('army-power'),
    religionPower: document.getElementById('religion-power'),
    farmingPower: document.getElementById('farming-power'),
    tradePower: document.getElementById('trade-power'),
    armyPeople: document.getElementById('army-people'),
    religionPeople: document.getElementById('religion-people'),
    farmingPeople: document.getElementById('farming-people'),
    tradePeople: document.getElementById('trade-people'),
    cardsContainer: document.getElementById('cards'),
    confirmButton: document.getElementById('confirm-button'),
    gameOverModal: document.getElementById('game-over-modal'),
    gameOverMessage: document.getElementById('game-over-message'),
    finalStats: document.getElementById('final-stats'),
    restartButton: document.getElementById('restart-button'),
    cardNotification: document.getElementById('card-notification'),
    notificationIcon: document.querySelector('.notification-icon'),
    notificationTitle: document.querySelector('.notification-title'),
    notificationDescription: document.querySelector('.notification-description'),
    helpButton: document.getElementById('help-button'),
    helpModal: document.getElementById('help-modal'),
    helpBody: document.getElementById('help-body'),
    closeHelpButton: document.getElementById('close-help-button')
};

// Update Stats Display
function updateStats() {
    elements.epoch.textContent = gameData.stats.epoch;
    elements.population.textContent = gameData.stats.population;
}

// Show Card Notification
function showCardNotification(card, description) {
    // Set notification type class
    elements.cardNotification.className = `card-notification ${card.type}`;
    
    // Set icon based on card type
    const icons = {
        positive: '🟢',
        negative: '🔴',
        neutral: '🔘'
    };
    elements.notificationIcon.textContent = icons[card.type] || '📜';
    
    // Set card name and description
    elements.notificationTitle.textContent = card.name;
    elements.notificationDescription.textContent = description;
    
    // Show notification
    elements.cardNotification.classList.add('show');
    
    // Hide notification after 4 seconds
    setTimeout(() => {
        elements.cardNotification.classList.remove('show');
    }, 4000);
}

// Update Factions Display
function updateFactions() {
    elements.armyPower.textContent = gameData.factions.army.power;
    elements.religionPower.textContent = gameData.factions.religion.power;
    elements.farmingPower.textContent = gameData.factions.farming.power;
    elements.tradePower.textContent = gameData.factions.trade.power;

    // Update people displays
    updateFactionPeople('army', elements.armyPeople);
    updateFactionPeople('religion', elements.religionPeople);
    updateFactionPeople('farming', elements.farmingPeople);
    updateFactionPeople('trade', elements.tradePeople);
}

function updateFactionPeople(factionKey, container) {
    container.innerHTML = '';
    gameData.factions[factionKey].people.forEach(person => {
        const personIcon = document.createElement('div');
        personIcon.className = 'person-icon';
        personIcon.draggable = true;
        personIcon.dataset.personId = person.id;
        personIcon.dataset.currentFaction = factionKey;
        personIcon.textContent = '👤';
        
        // Drag events
        personIcon.addEventListener('dragstart', handleDragStart);
        personIcon.addEventListener('dragend', handleDragEnd);
        
        container.appendChild(personIcon);
    });
    
    // Make faction container a drop zone
    container.parentElement.addEventListener('dragover', handleDragOver);
    container.parentElement.addEventListener('drop', handleDrop);
    container.parentElement.addEventListener('dragleave', handleDragLeave);
}

// Drag and Drop State
let draggedPerson = null;
let draggedFromFaction = null;

function handleDragStart(e) {
    if (gameData.gameOver || gameData.paused) {
        e.preventDefault();
        return;
    }
    draggedPerson = e.target;
    draggedFromFaction = e.target.dataset.currentFaction;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.personId);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.faction').forEach(f => {
        f.classList.remove('drag-over');
    });
    draggedPerson = null;
    draggedFromFaction = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (!draggedPerson || gameData.gameOver || gameData.paused) return;
    
    const personId = parseInt(e.dataTransfer.getData('text/plain'));
    const targetFactionId = e.currentTarget.id;
    
    // Extract faction key from ID (e.g., 'faction-army' -> 'army')
    let targetFactionKey;
    if (targetFactionId === 'faction-army') targetFactionKey = 'army';
    else if (targetFactionId === 'faction-religion') targetFactionKey = 'religion';
    else if (targetFactionId === 'faction-farming') targetFactionKey = 'farming';
    else if (targetFactionId === 'faction-trade') targetFactionKey = 'trade';
    else return;
    
    // Don't move if same faction
    if (targetFactionKey === draggedFromFaction) return;
    
    // Find and remove person from source faction
    const sourcePeople = gameData.factions[draggedFromFaction].people;
    const personIndex = sourcePeople.findIndex(p => p.id === personId);
    if (personIndex === -1) return;
    
    const person = sourcePeople.splice(personIndex, 1)[0];
    
    // Update person's faction
    person.faction = targetFactionKey;
    
    // Add to target faction
    gameData.factions[targetFactionKey].people.push(person);
    
    // Update UI
    updateFactions();
}

// Update Cards Display
function updateCards() {
    elements.cardsContainer.innerHTML = '';
    
    gameData.cards.available.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.type}`;
        cardElement.dataset.index = index;
        
        if (gameData.cards.selected.includes(index)) {
            cardElement.classList.add('selected');
        }
        
        cardElement.innerHTML = `
            <div class="card-name">${card.name}</div>
            <div class="card-description">${card.description}</div>
        `;
        
        cardElement.addEventListener('click', () => toggleCardSelection(index));
        elements.cardsContainer.appendChild(cardElement);
    });
    
    updateConfirmButton();
}

// Toggle Card Selection
function toggleCardSelection(index) {
    if (gameData.gameOver || gameData.paused) return;
    
    const selectedIndex = gameData.cards.selected.indexOf(index);
    
    if (selectedIndex > -1) {
        // Deselect card
        gameData.cards.selected.splice(selectedIndex, 1);
    } else {
        // Select card - max 2 cards allowed
        if (gameData.cards.selected.length < 2) {
            gameData.cards.selected.push(index);
        }
    }
    
    updateCards();
}

// Update Confirm Button State
function updateConfirmButton() {
    elements.confirmButton.disabled = gameData.cards.selected.length !== 2 || gameData.gameOver;
}

// Get a random card from a specific type pool
function getRandomCardByType(type) {
    let cardPool;
    if (type === 'negative') {
        cardPool = negative_cards;
    } else if (type === 'positive') {
        cardPool = positive_cards;
    } else {
        cardPool = neutral_cards;
    }
    return cardPool[Math.floor(Math.random() * cardPool.length)];
}

// Generate a random card (1/3 green, 1/3 red, 1/3 gray)
function generateRandomCard() {
    const rand = Math.random();
    if (rand < 0.333) {
        return getRandomCardByType('positive');
    } else if (rand < 0.666) {
        return getRandomCardByType('negative');
    } else {
        return getRandomCardByType('neutral');
    }
}

// Generate New Cards for Current Epoch
function generateCards() {
    gameData.cards.available = [];
    gameData.cards.selected = [];
    
    // Generate 5 cards using 1/3 probability distribution (1/3 green, 1/3 red, 1/3 gray)
    for (let i = 0; i < 5; i++) {
        gameData.cards.available.push(generateRandomCard());
    }
    
    updateCards();
}

// Advance to Next Epoch
function advanceEpoch() {
    if (gameData.gameOver || gameData.paused) return;
    
    // Validate that exactly 2 cards are selected
    if (gameData.cards.selected.length !== 2) {
        return;
    }
    
    // Randomly select 1 of the 2 selected cards (50/50 chance)
    const selectedIndex = gameData.cards.selected[Math.floor(Math.random() * 2)];
    const selectedCard = gameData.cards.available[selectedIndex];
    
    // Apply the selected card's effect
    if (selectedCard && selectedCard.effect_apply) {
        const text = selectedCard.effect_apply(gameData);

        // Show notification for the applied card
        showCardNotification(selectedCard, text);
    }
    
    // Remove the activated card from hand
    gameData.cards.available.splice(selectedIndex, 1);
    
    // Clear selections
    gameData.cards.selected = [];
    
    // Check game over conditions
    if (checkGameOver()) {
        showGameOver();
        return;
    }
    
    // Increment epoch
    gameData.stats.epoch++;
    
    // Fill empty slots with new random cards (1/3 green, 1/3 red, 1/3 gray)
    while (gameData.cards.available.length < 5) {
        gameData.cards.available.push(generateRandomCard());
    }
    
    // Update UI
    updateStats();
    updateFactions();
    updateCards();
}

// Check Game Over Conditions
function checkGameOver() {
    // Population reaches 0
    if (gameData.stats.population <= 0) {
        return true;
    }
    
    // Any faction power reaches value below 0
    for (const factionKey in gameData.factions) {
        if (gameData.factions[factionKey].power < 0) {
            return true;
        }
    }
    
    // gameOver can be set from card apply function
    return gameData.gameOver;
}

// Show Game Over Modal
function showGameOver() {
    gameData.gameOver = true;
    
    elements.gameOverMessage.textContent = 'Цивилизация погибла.';
    elements.finalStats.innerHTML = `
        Эпоха: ${gameData.stats.epoch}<br>
        Военные силы: ${gameData.factions.army.power}<br>
        Счастье населения: ${gameData.factions.religion.power}<br>
        Запасы еды: ${gameData.factions.farming.power}<br>
        Казна: ${gameData.factions.trade.power}<br>
        Население: ${gameData.stats.population}
    `;
    
    elements.gameOverModal.classList.add('active');
    updateConfirmButton();
}

// Restart Game
function restartGame() {
    // Reset game state
    gameData.stats = {
        epoch: 1,
        population: 2
    };
    
    gameData.factions = {
        army: {
            name: 'Армия',
            power: 0,
            people: []
        },
        religion: {
            name: 'Религия',
            power: 0,
            people: []
        },
        farming: {
            name: 'Фермерство',
            power: 0,
            people: [
                { id: 1 },
                { id: 2 }
            ]
        },
        trade: {
            name: 'Торговля',
            power: 0,
            people: []
        }
    };
    
    gameData.people.nextId = 3;
    gameData.cards.selected = [];
    gameData.gameOver = false;
    
    // Hide modal
    elements.gameOverModal.classList.remove('active');
    
    // Generate initial cards
    generateCards();
    
    // Update UI
    updateStats();
    updateFactions();
}

// Help Modal Functions
async function loadHelpContent() {
    try {
        const response = await fetch('game_help.txt');
        if (!response.ok) {
            throw new Error('Failed to load help content');
        }
        const markdown = await response.text();
        
        // Convert Markdown to HTML (simple conversion)
        const html = convertMarkdownToHtml(markdown);
        elements.helpBody.innerHTML = html;
    } catch (error) {
        console.error('Error loading help content:', error);
        elements.helpBody.innerHTML = '<p>Ошибка загрузки справки. Пожалуйста, проверьте файл game help.md</p>';
    }
}

function convertMarkdownToHtml(markdown) {
    let html = markdown;
    
    // Headers
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr>');
    
    // Unordered lists
    html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    
    // Paragraphs (wrap text that's not a header, list item, or hr)
    html = html.split('\n\n').map(para => {
        if (para.trim() === '') return '';
        if (para.startsWith('<h') || para.startsWith('<li') || para.startsWith('<hr')) return para;
        if (para.startsWith('|')) return para; // Skip tables for now
        return `<p>${para.trim()}</p>`;
    }).join('\n');
    
    // Clean up list items
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    
    // Tables (simple conversion)
    html = html.replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(c => c.trim() !== '');
        if (cells.length < 2) return match;
        const cellTags = cells.map(c => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cellTags}</tr>`;
    });
    html = html.replace(/(<tr>.*<\/tr>)/gs, '<table>$1</table>');
    html = html.replace(/<\/table>\s*<table>/g, '');
    
    return html;
}

function showHelpModal() {
    gameData.paused = true;
    loadHelpContent();
    elements.helpModal.classList.add('active');
}

function hideHelpModal() {
    gameData.paused = false;
    elements.helpModal.classList.remove('active');
}

// Event Listeners
elements.helpButton.addEventListener('click', showHelpModal);
elements.closeHelpButton.addEventListener('click', hideHelpModal);
elements.confirmButton.addEventListener('click', advanceEpoch);
elements.restartButton.addEventListener('click', restartGame);

// Initialize Game
function initGame() {
    generateCards();
    updateStats();
    updateFactions();
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);
