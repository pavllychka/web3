
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const lastScoreDisplay = document.getElementById('last-score');
const startButton = document.getElementById('startButton');
const endButton = document.getElementById('endButton');
const playerImageInput = document.getElementById('playerImageInput');
const nameModal = document.getElementById('nameModal');
const playerNameInput = document.getElementById('playerNameInput');
const submitNameButton = document.getElementById('submitNameButton');

let player, obstacles, bonuses, score, gameActive, animationFrameId;
let playerImage;


function loadLastResult() {
    fetch('/results')
        .then(response => response.json())
        .then(results => {
            if (results.length >= 2) {
                const lastResult = results[results.length - 2];
                localStorage.setItem('lastResult', JSON.stringify(lastResult));
                lastScoreDisplay.textContent = `Попередній результат: ${lastResult.name} - ${lastResult.score}`;
            } else {
                lastScoreDisplay.textContent = `Попередній результат: немає даних`;
                localStorage.removeItem('lastResult');
            }
        })
        .catch(error => {
            console.error('Помилка завантаження результатів:', error);
            lastScoreDisplay.textContent = `Попередній результат: помилка`;
        });
}


function loadPlayerImage(callback) {
    const file = playerImageInput.files[0];
    if (!file) {
        alert('Будь ласка, виберіть зображення перед початком гри!');
        return;
    }
    playerImage = new Image();
    const reader = new FileReader();
    reader.onload = function(e) {
        playerImage.src = e.target.result;
        playerImage.onload = callback;
    };
    reader.onerror = function() {
        console.error('Помилка завантаження зображення');
        alert('Не вдалося завантажити зображення.');
    };
    reader.readAsDataURL(file);
}


function initGame() {
    loadPlayerImage(() => {
        player = {
            x: 50,
            y: canvas.height / 2 - 25,
            width: 50,
            height: 50,
            speed: 5
        };
        obstacles = [];
        bonuses = [];
        score = 0;
        gameActive = true;
        scoreDisplay.textContent = `Очки: ${score}`;
        endButton.disabled = false;
        startButton.disabled = true;
        loadLastResult();
        spawnObstacles();
        spawnBonuses();
        updateGame();
    });
}


function updateGame() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    movePlayer();
    drawPlayer();
    updateObstacles();
    updateBonuses();
    checkCollisions();
    animationFrameId = requestAnimationFrame(updateGame);
}


const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function movePlayer() {
    if (!gameActive) return;
    if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) player.y += player.speed;
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;
}


function drawPlayer() {
    if (playerImage) {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
}


function spawnObstacles() {
    setInterval(() => {
        if (!gameActive) return;
        obstacles.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 50),
            width: 30,
            height: 30,
            speed: 3
        });
    }, 2000);
}


function spawnBonuses() {
    setInterval(() => {
        if (!gameActive) return;
        bonuses.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 20),
            width: 20,
            height: 20,
            speed: 2
        });
    }, 3000);
}


function updateObstacles() {
    obstacles = obstacles.filter(obstacle => obstacle.x > -obstacle.width);
    obstacles.forEach(obstacle => {
        obstacle.x -= obstacle.speed;
        ctx.fillStyle = 'red';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}


function updateBonuses() {
    bonuses = bonuses.filter(bonus => bonus.x > -bonus.width);
    bonuses.forEach(bonus => {
        bonus.x -= bonus.speed;
        ctx.fillStyle = 'yellow';
        ctx.fillRect(bonus.x, bonus.y, bonus.width, bonus.height);
    });
}


function checkCollisions() {
    for (let obstacle of obstacles) {
        if (isCollision(player, obstacle)) {
            endGame();
            return;
        }
    }
    for (let i = bonuses.length - 1; i >= 0; i--) {
        if (isCollision(player, bonuses[i])) {
            score += 10;
            scoreDisplay.textContent = `Очки: ${score}`;
            bonuses.splice(i, 1);
        }
    }
}


function isCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}


function endGame() {
    gameActive = false;
    cancelAnimationFrame(animationFrameId);
    endButton.disabled = true;
    startButton.disabled = false;
    nameModal.style.display = 'flex'; 
}


function saveResult() {
    const playerName = playerNameInput.value.trim() || 'Гравець';
    const currentDate = new Date().toISOString().split('T')[0];
    const result = {
        name: playerName,
        date: currentDate,
        score: score
    };

    fetch('/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
    })
    .then(response => {
        if (!response.ok) throw new Error('Помилка збереження');
        return response.text();
    })
    .then(() => {
        loadLastResult();
        nameModal.style.display = 'none';
        playerNameInput.value = '';
    })
    .catch(error => {
        console.error('Помилка:', error);
        alert('Не вдалося зберегти результати.');
    });
}


startButton.addEventListener('click', initGame);
endButton.addEventListener('click', endGame);
submitNameButton.addEventListener('click', saveResult);


window.onload = loadLastResult;