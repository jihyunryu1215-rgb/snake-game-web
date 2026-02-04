const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreElem = document.getElementById('score');
const rankingList = document.getElementById('ranking-list');
const restartBtn = document.getElementById('restart-btn');
const difficultyElem = document.getElementById('difficulty');

const grid = 20;
let snake, apple, count, gameOver, score, speed, frameInterval, speedName, speedLevel;
let ranking = JSON.parse(localStorage.getItem('snakeRanking') || '[]');

const speedLevels = {
    easy: {name: '이지', interval: 10},
    normal: {name: '노말', interval: 6},
    hard: {name: '하드', interval: 4},
    hell: {name: '헬', interval: 2}
};

function setSpeed(level) {
    speed = speedLevels[level].interval;
    speedName = speedLevels[level].name;
    speedLevel = level;
    count = 0; // 난이도 변경 즉시 속도 반영
    if (difficultyElem) difficultyElem.textContent = speedName;
}

function updateRanking(newScore) {
    ranking.push(newScore);
    ranking.sort((a, b) => b - a);
    ranking = ranking.slice(0, 5);
    localStorage.setItem('snakeRanking', JSON.stringify(ranking));
    renderRanking();
}

function renderRanking() {
    rankingList.innerHTML = '';
    ranking.forEach((s, i) => {
        const li = document.createElement('li');
        li.textContent = `${i + 1}위: ${s}점`;
        rankingList.appendChild(li);
    });
}

function resetGame() {
    snake = { 
        x: 160, y: 160, 
        dx: grid, dy: 0, 
        cells: [
            {x: 160, y: 160},
            {x: 140, y: 160},
            {x: 120, y: 160},
            {x: 100, y: 160}
        ], 
        maxCells: 4 
    };
    apple = { x: getRandomInt(0, 20) * grid, y: getRandomInt(0, 20) * grid };
    count = 0;
    gameOver = false;
    score = 0;
    scoreElem.textContent = score;
    restartBtn.style.display = 'none';
    if (difficultyElem) difficultyElem.textContent = speedName;
}

function restartGame() {
    resetGame();
    requestAnimationFrame(gameLoop);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// 머리/꼬리 방향 이동
let moveTail = false;
document.addEventListener('keydown', e => {
    if (gameOver) return;
    // 꼬리 이동: Shift+방향키
    if (e.shiftKey) {
        moveTail = true;
        if (e.key === 'ArrowLeft') {
            snake.tailDir = {dx: -grid, dy: 0};
        } else if (e.key === 'ArrowUp') {
            snake.tailDir = {dx: 0, dy: -grid};
        } else if (e.key === 'ArrowRight') {
            snake.tailDir = {dx: grid, dy: 0};
        } else if (e.key === 'ArrowDown') {
            snake.tailDir = {dx: 0, dy: grid};
        }
    } else {
        moveTail = false;
        // 머리 이동(기존)
        if (e.key === 'ArrowLeft' && snake.dx === 0) {
            snake.dx = -grid; snake.dy = 0;
        } else if (e.key === 'ArrowUp' && snake.dy === 0) {
            snake.dy = -grid; snake.dx = 0;
        } else if (e.key === 'ArrowRight' && snake.dx === 0) {
            snake.dx = grid; snake.dy = 0;
        } else if (e.key === 'ArrowDown' && snake.dy === 0) {
            snake.dy = grid; snake.dx = 0;
        }
    }
});

function gameLoop() {
    if (gameOver) return;
    requestAnimationFrame(gameLoop);
    if (++count < speed) return;
    count = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!moveTail) {
        // 머리 이동
        snake.x += snake.dx;
        snake.y += snake.dy;
        // 벽 충돌 체크
        if (snake.x < 0 || snake.x >= canvas.width || snake.y < 0 || snake.y >= canvas.height) {
            endGame();
            return;
        }
        snake.cells.unshift({ x: snake.x, y: snake.y });
        if (snake.cells.length > snake.maxCells) snake.cells.pop();
    } else {
        // 꼬리 이동
        let tail = snake.cells[snake.cells.length - 1];
        let newTail = {
            x: tail.x + (snake.tailDir ? snake.tailDir.dx : 0),
            y: tail.y + (snake.tailDir ? snake.tailDir.dy : 0)
        };
        // 벽 충돌 체크
        if (newTail.x < 0 || newTail.x >= canvas.width || newTail.y < 0 || newTail.y >= canvas.height) {
            endGame();
            return;
        }
        snake.cells.push(newTail);
        snake.cells.shift(); // 맨 앞(머리) 제거
        // 머리 좌표 갱신
        snake.x = snake.cells[0].x;
        snake.y = snake.cells[0].y;
    }
    // 사과
    ctx.fillStyle = 'red';
    ctx.fillRect(apple.x, apple.y, grid-1, grid-1);
    // 뱀
    ctx.fillStyle = 'lime';
    snake.cells.forEach((cell, idx) => {
        ctx.fillRect(cell.x, cell.y, grid-1, grid-1);
        // 사과 먹기 (머리로만)
        if (!moveTail && idx === 0 && cell.x === apple.x && cell.y === apple.y) {
            snake.maxCells++;
            score++;
            scoreElem.textContent = score;
            apple.x = getRandomInt(0, 20) * grid;
            apple.y = getRandomInt(0, 20) * grid;
        }
        // 자기 몸 충돌
        for (let i = idx + 1; i < snake.cells.length; i++) {
            if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
                endGame();
                return;
            }
        }
    });
}

function endGame() {
    gameOver = true;
    updateRanking(score);
    restartBtn.style.display = 'inline-block';
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('게임 오버!', canvas.width/2, canvas.height/2 - 10);
    ctx.font = '20px Arial';
    ctx.fillText(`점수: ${score}`, canvas.width/2, canvas.height/2 + 25);
}

// 초기 세팅
setSpeed('normal');
renderRanking();
resetGame();
requestAnimationFrame(gameLoop);

// 전역 함수로 노출
window.setSpeed = function(level) {
    setSpeed(level);
};
window.restartGame = restartGame;
