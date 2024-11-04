console.log('Script started');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const resetButton = document.getElementById('resetButton');
const colorPalette = document.getElementById('colorPalette');
const howToPlayBtn = document.getElementById('howToPlayBtn');
const howToPlay = document.getElementById('howToPlay');
const checkMinColorsBtn = document.getElementById('checkMinColorsBtn');
const numVerticesInput = document.getElementById('numVertices');

console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);

let vertices = [];
let edges = [];
let draggingVertex = null;
let selectedColor = null;
let currentMode = 'random';
let sketchState = 'vertices'; // 'vertices' or 'edges'
let selectedVertex = null;

const colors = ['#FFA726', '#66BB6A', '#42A5F5', '#AB47BC', '#EC407A', '#8D6E63'];

const challenges = [
    // Challenge 1:Triangle-Based Graph 
    {
        vertices: [
            {x: canvas.width/2 - 100, y: canvas.height/2 - 100}, // top left
            {x: canvas.width/2 + 100, y: canvas.height/2 - 100}, // top right
            {x: canvas.width/2 - 200, y: canvas.height/2 + 100}, // bottom left
            {x: canvas.width/2, y: canvas.height/2 + 100},       // bottom middle
            {x: canvas.width/2 + 200, y: canvas.height/2 + 100}  // bottom right
        ],
        edges: [[0,1],[0,2],[0,3],[1,3],[1,4],[2,3],[3,4]]
    },
    // Challenge 2: Pentagon with Inner Star 
    {
        vertices: [
            {x: 300, y: 50}, {x: 450, y: 150}, {x: 400, y: 350},
            {x: 200, y: 350}, {x: 150, y: 150}, {x: 300, y: 200}
        ],
        edges: [[0,1],[1,2],[2,3],[3,4],[4,0],[0,5],[1,5],[2,5],[3,5],[4,5]]
    },
    // Challenge 3: Graph with Overlapping Edges 
    {
        vertices: [
            {x: 200, y: 100}, {x: 400, y: 100}, {x: 200, y: 300}, {x: 400, y: 300},
            {x: 250, y: 150}, {x: 450, y: 150}, {x: 250, y: 350}, {x: 450, y: 350}
        ],
        edges: [[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]]
    },
    // Challenge 4:Simple Graph 
    {
        vertices: [
            {x: 300, y: 100}, {x: 450, y: 200}, {x: 400, y: 350},
            {x: 200, y: 350}, {x: 150, y: 200}
        ],
        edges: [[0,1],[0,2],[0,3],[0,4],[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]
    },
    // Challenge 5: Complex Graph 
    {
        vertices: [
            {x: 300, y: 50}, {x: 450, y: 150}, {x: 400, y: 350},
            {x: 200, y: 350}, {x: 150, y: 150}, {x: 300, y: 100},
            {x: 375, y: 175}, {x: 350, y: 275}, {x: 250, y: 275}, {x: 225, y: 175}
        ],
        edges: [[0,1],[1,2],[2,3],[3,4],[4,0],[0,5],[1,6],[2,7],[3,8],[4,9],[5,7],[7,9],[9,6],[6,8],[8,5]]
    },
    // Challenge 6: Circular Graph 
    {
        vertices: Array(20).fill().map((_, i) => ({
            x: 300 + 200 * Math.cos(2 * Math.PI * i / 20),
            y: 200 + 200 * Math.sin(2 * Math.PI * i / 20)
        })),
        edges: [
            [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],
            [10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,17],[17,18],[18,19],[19,0],
            [0,5],[1,6],[2,7],[3,8],[4,9],[10,15],[11,16],[12,17],[13,18],[14,19]
        ]
    },
    // Challenge 7: Hexagonal Graph 
    {
        vertices: [
            {x: 200, y: 200}, {x: 400, y: 200},
            {x: 150, y: 300}, {x: 450, y: 300},
            {x: 300, y: 100}, {x: 300, y: 400}
        ],
        edges: [[0,1],[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,3],[2,4],[2,5],[3,4],[3,5],[4,5]]
    },
    // Challenge 8: Double Pentagon Graph 
    {
        vertices: [
            // Outer pentagon
            {x: 200, y: 100}, {x: 400, y: 100}, 
            {x: 450, y: 250}, {x: 300, y: 400}, 
            {x: 150, y: 250},
            // Inner pentagon
            {x: 250, y: 150}, {x: 350, y: 150},
            {x: 375, y: 250}, {x: 300, y: 325},
            {x: 225, y: 250}
        ],
        edges: [
            // Outer pentagon edges
            [0,1], [1,2], [2,3], [3,4], [4,0],
            // Inner pentagon edges
            [5,6], [6,7], [7,8], [8,9], [9,5],
            // Connections between pentagons
            [0,5], [1,6], [2,7], [3,8], [4,9]
        ]
    }
];

// Create mode buttons
const modes = [
    { value: 'random', text: 'Random' },
    { value: 'challenge', text: 'Challenge' },
    { value: 'sketch', text: 'Sketch' }
];

const modeButtonsContainer = document.getElementById('mode-buttons-container');

modes.forEach(mode => {
    const button = document.createElement('button');
    button.className = 'mode-button';
    button.dataset.mode = mode.value;
    button.textContent = mode.text;
    button.addEventListener('click', () => {
        document.querySelectorAll('.mode-button').forEach(btn => 
            btn.classList.remove('active'));
        button.classList.add('active');
        updateControlsVisibility(mode.value);
    });
    modeButtonsContainer.appendChild(button);
});

// Set initial active mode
document.querySelector('.mode-button').classList.add('active');
updateControlsVisibility('random');

function generateRandomGraph(numVertices) {
    vertices = [];
    edges = [];

    // Create vertices in a more centered way
    const radius = Math.min(canvas.width, canvas.height) * 0.35; // Use 35% of canvas size
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < numVertices; i++) {
        const angle = (2 * Math.PI * i) / numVertices;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        vertices.push({
            x: x,
            y: y,
            color: null,
            adjacentVertices: []
        });
    }

    // Create edges with 30% probability
    for (let i = 0; i < numVertices; i++) {
        for (let j = i + 1; j < numVertices; j++) {
            if (Math.random() < 0.3) {
                edges.push([i, j]);
                vertices[i].adjacentVertices.push(j);
                vertices[j].adjacentVertices.push(i);
            }
        }
    }
    
    console.log('Generated graph with:', vertices.length, 'vertices and', edges.length, 'edges');
    drawGraph();
    updateColorCount();
}

function drawGraph() {
    console.log('Drawing graph with:', vertices.length, 'vertices');
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    ctx.beginPath();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    edges.forEach(([from, to]) => {
        ctx.moveTo(vertices[from].x, vertices[from].y);
        ctx.lineTo(vertices[to].x, vertices[to].y);
    });
    ctx.stroke();

    // Draw vertices
    vertices.forEach((vertex) => {
        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, 15, 0, 2 * Math.PI);
        ctx.fillStyle = vertex.color || 'white';
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.stroke();
    });
}

function showChallengeButtons() {
    const challengeContainer = document.createElement('div');
    challengeContainer.id = 'challenge-container';
    
    const descriptions = [
        "Triangle-Based Graph ",
        "Pentagon with Inner Star ",
        "Medium Graph with Overlapping Edges",
        "Simple Complete Graph ",
        "Complex Graph ",
        "Circular Graph ",
        "Hexagonal Graph",
        "Double Pentagon Graph"
    ];
    
    // Create two rows container
    const rowsContainer = document.createElement('div');
    rowsContainer.className = 'challenge-rows';
    
    const row1 = document.createElement('div');
    const row2 = document.createElement('div');
    row1.className = 'challenge-row';
    row2.className = 'challenge-row';
    
    for (let i = 0; i < challenges.length; i++) {
        const button = document.createElement('button');
        button.className = 'challenge-button';
        button.innerHTML = `Challenge ${i + 1}<br><span class="challenge-desc">${descriptions[i]}</span>`;
        button.addEventListener('click', () => {
            document.querySelectorAll('.challenge-button').forEach(btn => 
                btn.classList.remove('active'));
            button.classList.add('active');
            loadChallenge(i);
        });
        
        if (i < 4) {
            row1.appendChild(button);
        } else {
            row2.appendChild(button);
        }
    }
    
    rowsContainer.appendChild(row1);
    rowsContainer.appendChild(row2);
    challengeContainer.appendChild(rowsContainer);
    
    const mainContent = document.getElementById('main-content');
    const existingContainer = document.getElementById('challenge-container');
    if (existingContainer) {
        existingContainer.remove();
    }
    mainContent.insertBefore(challengeContainer, mainContent.firstChild);
}

function loadChallenge(index) {
    vertices = [];
    edges = [];
    
    // Copy vertices from challenge
    challenges[index].vertices.forEach(v => {
        vertices.push({
            x: v.x,
            y: v.y,
            color: null,
            adjacentVertices: []
        });
    });
    
    // Copy edges and build adjacency lists
    challenges[index].edges.forEach(([from, to]) => {
        edges.push([from, to]);
        vertices[from].adjacentVertices.push(to);
        vertices[to].adjacentVertices.push(from);
    });
    
    // Center the graph
    centerGraph();
    
    drawGraph();
    updateColorCount();
}

function centerGraph() {
    if (vertices.length === 0) return;
    
    // Find current bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    vertices.forEach(v => {
        minX = Math.min(minX, v.x);
        maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y);
        maxY = Math.max(maxY, v.y);
    });
    
    // Calculate center offset
    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const offsetX = (canvas.width - graphWidth) / 2 - minX;
    const offsetY = (canvas.height - graphHeight) / 2 - minY;
    
    // Apply offset to all vertices
    vertices.forEach(v => {
        v.x += offsetX;
        v.y += offsetY;
    });
}

function updateControlsVisibility(mode) {
    currentMode = mode;
    
    const numVerticesControl = document.querySelector('.control-group');
    const sketchInstructions = document.getElementById('sketchInstructions');
    
    // Hide all mode-specific elements
    numVerticesControl.style.display = 'none';
    if (sketchInstructions) {
        sketchInstructions.classList.add('hidden');
    }
    
    // Remove any existing challenge/sketch containers
    const existingContainer = document.getElementById('challenge-container');
    if (existingContainer) {
        existingContainer.remove();
    }

    switch(mode) {
        case 'random':
            numVerticesControl.style.display = 'block';
            generateRandomGraph(parseInt(numVerticesInput.value, 10));
            break;
            
        case 'challenge':
            showChallengeButtons();
            break;
            
        case 'sketch':
            vertices = [];
            edges = [];
            showSketchControls();
            break;
    }

    drawGraph();
    updateColorCount();
}

// Event listener for number of vertices input
numVerticesInput.addEventListener('input', () => {
    const numVertices = parseInt(numVerticesInput.value, 10);
    generateRandomGraph(numVertices);
});

// Color palette setup
colors.forEach(color => {
    const colorButton = document.createElement('div');
    colorButton.className = 'color-option';
    colorButton.style.backgroundColor = color;
    colorButton.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(btn => 
            btn.classList.remove('selected'));
        colorButton.classList.add('selected');
        selectedColor = color;
    });
    colorPalette.appendChild(colorButton);
});

// Vertex coloring
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (currentMode === 'sketch') {
        const activeButton = document.querySelector('.challenge-button.active');
        if (!activeButton) return;
        
        if (activeButton.innerHTML === 'Vertices') {
            // Vertex creation code
            const tooClose = vertices.some(vertex => {
                const dx = vertex.x - x;
                const dy = vertex.y - y;
                return Math.sqrt(dx * dx + dy * dy) < 40;
            });

            if (!tooClose) {
                vertices.push({
                    x: x,
                    y: y,
                    color: null,
                    adjacentVertices: []
                });
                drawGraph();
            }
        } else if (activeButton.innerHTML === 'Edges') {
            // Edge creation code
            const clickedVertex = vertices.findIndex(vertex => {
                const dx = vertex.x - x;
                const dy = vertex.y - y;
                return Math.sqrt(dx * dx + dy * dy) < 15;
            });

            if (clickedVertex !== -1) {
                if (selectedVertex === null) {
                    selectedVertex = clickedVertex;
                    drawGraph();
                    ctx.beginPath();
                    ctx.arc(vertices[selectedVertex].x, vertices[selectedVertex].y, 18, 0, 2 * Math.PI);
                    ctx.strokeStyle = '#2196F3';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                } else {
                    if (selectedVertex !== clickedVertex) {
                        edges.push([selectedVertex, clickedVertex]);
                        vertices[selectedVertex].adjacentVertices.push(clickedVertex);
                        vertices[clickedVertex].adjacentVertices.push(selectedVertex);
                    }
                    selectedVertex = null;
                    drawGraph();
                }
            }
        }
    }
    
    // Handle coloring for all modes
    const clickedVertex = vertices.findIndex(vertex => {
        const dx = vertex.x - x;
        const dy = vertex.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 15;
    });

    // Only color if we're not in sketch mode's Vertices or Edges state
    if (currentMode !== 'sketch' || 
        (currentMode === 'sketch' && 
         document.querySelector('.challenge-button.active')?.innerHTML === 'Play')) {
        
        if (clickedVertex !== -1 && selectedColor) {
            if (isValidColor(clickedVertex, selectedColor)) {
                vertices[clickedVertex].color = selectedColor;
                drawGraph();
                updateColorCount();

                if (checkGraphColoring()) {
                    const usedColors = new Set(vertices.map(v => v.color)).size;
                    const minColors = greedyColoring();
                    showGameMessage(
                        usedColors === minColors ? "🎉 Perfect Solution!" : "⭐ Graph Colored!",
                        usedColors === minColors ? 
                            `Minimum ${usedColors} colors used` : 
                            `Used ${usedColors} colors - Try with ${minColors}?`,
                        usedColors === minColors ? 'perfect' : 'success'
                    );
                }
            } else {
                showGameMessage("Invalid move! Adjacent vertices cannot have the same color.", "error");
            }
        }
    }
});

// Add preview line while creating edge
canvas.addEventListener('mousemove', (event) => {
    if (currentMode === 'sketch' && selectedVertex !== null) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        drawGraph();
        // Draw preview line
        ctx.beginPath();
        ctx.moveTo(vertices[selectedVertex].x, vertices[selectedVertex].y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Keep selected vertex highlighted
        ctx.beginPath();
        ctx.arc(vertices[selectedVertex].x, vertices[selectedVertex].y, 18, 0, 2 * Math.PI);
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
});

function handleSketchModeClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Get active mode from buttons
    const activeButton = document.querySelector('.challenge-button.active');
    if (!activeButton) return;
    
    sketchState = activeButton.innerHTML.toLowerCase();
    
    if (sketchState === 'vertices') {
        // Check if click is too close to existing vertices
        const tooClose = vertices.some(vertex => {
            const dx = vertex.x - x;
            const dy = vertex.y - y;
            return Math.sqrt(dx * dx + dy * dy) < 40; // Minimum 40px between vertices
        });

        // Check if click is within canvas bounds with padding
        const padding = 20;
        const withinBounds = x >= padding && 
                            x <= canvas.width - padding && 
                            y >= padding && 
                            y <= canvas.height - padding;

        if (!tooClose && withinBounds) {
            vertices.push({
                x: x,
                y: y,
                color: null,
                adjacentVertices: []
            });
            drawGraph();
        }
    }
}

// New helper functions
function findClickedVertex(x, y) {
    return vertices.findIndex(vertex => {
        const dx = vertex.x - x;
        const dy = vertex.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 15;
    });
}

function handleVertexColoring(vertexIndex) {
    if (!isValidColor(vertexIndex, selectedColor)) {
        showGameMessage("Invalid move! Adjacent vertices cannot have the same color.", "error");
        return;
    }

    vertices[vertexIndex].color = selectedColor;
    drawGraph();
    updateColorCount();

    if (checkGraphColoring()) {
        const usedColors = new Set(vertices.map(v => v.color)).size;
        const minColors = greedyColoring();
        
        showGameMessage(
            usedColors === minColors ? "🎉 Perfect Solution!" : "⭐ Graph Colored!",
            usedColors === minColors ? 
                `Minimum ${usedColors} colors used` : 
                `Used ${usedColors} colors - Try with ${minColors}?`,
            usedColors === minColors ? 'perfect' : 'success'
        );
    }
}

function isValidColor(vertexIndex, color) {
    const vertex = vertices[vertexIndex];
    return !vertex.adjacentVertices.some(adjIndex => 
        vertices[adjIndex].color === color);
}

function updateColorCount() {
    const usedColors = new Set(vertices.map(v => v.color).filter(Boolean));
    document.getElementById('colorCount').textContent = usedColors.size;
}

// Initial graph generation
generateRandomGraph(parseInt(numVerticesInput.value, 10));

// Add this event listener for the How to Play button
document.getElementById('howToPlayBtn').addEventListener('click', function() {
    const howToPlay = document.getElementById('howToPlay');
    if (howToPlay.classList.contains('hidden')) {
        howToPlay.classList.remove('hidden');
        this.textContent = 'Hide Instructions';
    } else {
        howToPlay.classList.add('hidden');
        this.textContent = 'How to Play';
    }
});

// Add these functions to your code

function checkGraphColoring() {
    // Check if all vertices are colored
    const uncoloredVertices = vertices.filter(v => !v.color);
    if (uncoloredVertices.length > 0) {
        return false;
    }

    // Check if adjacent vertices have different colors
    for (let i = 0; i < edges.length; i++) {
        const [v1, v2] = edges[i];
        if (vertices[v1].color === vertices[v2].color) {
            return false;
        }
    }

    return true;
}

function greedyColoring() {
    const tempVertices = vertices.map(v => ({...v}));
    const availableColors = new Array(vertices.length).fill(true);
    let minColors = 0;

    // Clear all colors
    tempVertices.forEach(v => v.color = null);

    // For each vertex
    for (let i = 0; i < tempVertices.length; i++) {
        // Reset available colors
        availableColors.fill(true);

        // Mark colors of adjacent vertices as unavailable
        tempVertices[i].adjacentVertices.forEach(adj => {
            if (tempVertices[adj].color !== null) {
                availableColors[colors.indexOf(tempVertices[adj].color)] = false;
            }
        });

        // Find the first available color
        let colorIndex = 0;
        while (colorIndex < colors.length && !availableColors[colorIndex]) {
            colorIndex++;
        }
        tempVertices[i].color = colors[colorIndex];
        minColors = Math.max(minColors, colorIndex + 1);
    }

    return minColors;
}

// Add this function for nice notifications
function showNotification(message, type = 'success') {
    // Create or get the message container that sits above the graph
    let messageContainer = document.getElementById('game-message-container');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'game-message-container';
        const canvas = document.getElementById('gameCanvas');
        canvas.parentElement.insertBefore(messageContainer, canvas);
    }

    const notification = document.createElement('div');
    notification.className = `game-message ${type}`;
    
    // Create message content with icon
    notification.innerHTML = `
        <div class="message-content">
            <div class="message-icon">${type === 'success' ? '🌟' : '⚠️'}</div>
            <div class="message-text">${message}</div>
        </div>
    `;
    
    // Remove any existing notifications
    messageContainer.innerHTML = '';
    messageContainer.appendChild(notification);
    
    // Add CSS animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (messageContainer.contains(notification)) {
                messageContainer.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Add this new function for showing game messages
function showGameMessage(title, message, type = 'success') {
    console.log('Showing message:', title, message);
    
    let messageContainer = document.getElementById('game-message-container');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'game-message-container';
        document.getElementById('gameCanvas').parentElement.appendChild(messageContainer);
    }

    const notification = document.createElement('div');
    notification.className = `game-message ${type}`;
    
    notification.innerHTML = `
        <div class="message-box">
            <div class="message-title">${title}</div>
            <div class="message-content">${message}</div>
        </div>
    `;
    
    messageContainer.innerHTML = '';
    messageContainer.appendChild(notification);
    
    // Force a reflow
    notification.offsetHeight;
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Add these console logs to help debug
resetButton.addEventListener('click', () => {
    switch(currentMode) {
        case 'random':
            generateRandomGraph(parseInt(numVerticesInput.value, 10));
            break;
            
        case 'challenge':
            const activeButton = document.querySelector('.challenge-button.active');
            if (activeButton) {
                const challengeIndex = parseInt(activeButton.textContent.split(' ')[1]) - 1;
                loadChallenge(challengeIndex);
            }
            break;
            
        case 'sketch':
            vertices = [];
            edges = [];
            break;
    }
    drawGraph();
    updateColorCount();
});

function showSketchControls() {
    const container = document.createElement('div');
    container.id = 'challenge-container';
    
    const rowsContainer = document.createElement('div');
    rowsContainer.className = 'challenge-rows';
    
    const buttonRow = document.createElement('div');
    buttonRow.className = 'challenge-row';
    
    // Vertices button
    const verticesBtn = document.createElement('button');
    verticesBtn.className = 'challenge-button';
    verticesBtn.innerHTML = 'Vertices';
    verticesBtn.addEventListener('click', () => {
        document.querySelectorAll('.challenge-button').forEach(btn => 
            btn.classList.remove('active'));
        verticesBtn.classList.add('active');
        selectedVertex = null;
        sketchState = 'create';
    });
    
    // Edges button
    const edgesBtn = document.createElement('button');
    edgesBtn.className = 'challenge-button';
    edgesBtn.innerHTML = 'Edges';
    edgesBtn.addEventListener('click', () => {
        document.querySelectorAll('.challenge-button').forEach(btn => 
            btn.classList.remove('active'));
        edgesBtn.classList.add('active');
        selectedVertex = null;
        sketchState = 'create';
    });
    
    // Play button
    const playBtn = document.createElement('button');
    playBtn.className = 'challenge-button';
    playBtn.innerHTML = 'Play';
    playBtn.addEventListener('click', () => {
        document.querySelectorAll('.challenge-button').forEach(btn => 
            btn.classList.remove('active'));
        playBtn.classList.add('active');
        selectedVertex = null;
        sketchState = 'play';
    });
    
    buttonRow.appendChild(verticesBtn);
    buttonRow.appendChild(edgesBtn);
    buttonRow.appendChild(playBtn);
    rowsContainer.appendChild(buttonRow);
    container.appendChild(rowsContainer);
    
    const controls = document.getElementById('controls');
    controls.parentElement.insertBefore(container, controls);
    
    verticesBtn.click(); // Start with Vertices mode active
}

console.log('Script ended');
