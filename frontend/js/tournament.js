let user1 = "";
let user2 = "";
let user3 = "";
let user4 = "";
let players = [];
let currentMatch = 0;
let tournamentResults = [];
let gameRunning = false;
let flag = 0;
let flag1 = 0;
let flag2 = 0;
let final_winner = "";
document.addEventListener("DOMContentLoaded", function () {
    
});


function initTournament() {
    // Kullanıcı isimlerini al
    user1 = document.getElementById("user1Name").value;
    user2 = document.getElementById("user2Name").value;
    user3 = document.getElementById("user3Name").value;
    user4 = document.getElementById("user4Name").value;

    if (!user1 || !user2 || !user3 || !user4) {
        alert("Lütfen tüm oyuncu isimlerini giriniz!");
        return;
    }

    players = [user1, user2, user3, user4];
    currentMatch = 0;
    tournamentResults = [];

    document.getElementById("startTournament").innerHTML = `
        <div class="container3">
            <canvas id="canvas3" style="height: 900; width: 1200px"></canvas>
        </div>
        <div class="modal" id="message-modal" style="display: none">
            <div class="modal-content">
                <h5 id="message"></h5>
                <button id="message-modal-close" class="btn">Close</button>
            </div>
        </div>
    `;
    startTournament();
}

function StartingMessageSender(player, player1, message) {
    if (window.chatSocket) {
        window.chatSocket.send(
          JSON.stringify({
            username: "SERVER",
            message: player + " Vs " + player1 + " " + message,
          })
        );
      }
}


function messageSender(message) {
    if (window.chatSocket) {
        window.chatSocket.send(
          JSON.stringify({
            username: "SERVER",
            message: message,
          })
        );
      }
}
function startTournament() {
    if (flag === 0) {
        flag = 1;
        if (players.length < 4) {
            alert("Tüm oyuncu isimlerini girin!");
            return;
        }
        messageSender("Tournament is starting!");
        scheduleMatch(players[0], players[1]);
    }
}



function scheduleMatch(player1, player2) {
    const canvas = document.getElementById("canvas3");
    const ctx = canvas.getContext("2d");

    // Tuvali temizle ve yeni eşleşmeyi yazdır
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFF";
    ctx.font = "15px Arial";
    ctx.textAlign = "center"; 
    ctx.fillText(`Next Match: ${player1} vs ${player2}`, canvas.width / 2, canvas.height / 2);
    StartingMessageSender(player1, player2, "match is starting!");

    // 5 saniye bekle sonra oyunu başlat
    setTimeout(() => {
        initGame2(player1, player2);
    }, 5000);
}



function initGame2(player1, player2) {
    const canvas = document.getElementById("canvas3"); // Canvas ID'si
    const ctx = canvas.getContext("2d");

    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballSpeedX = 2;
    let ballSpeedY = 2;
    let baseSpeed = 2;

    let leftPlayerScore = 0;
    let rightPlayerScore = 0;
    const maxScore = 5;

    let leftPaddleY = canvas.height / 2 - 40 / 2;
    let rightPaddleY = canvas.height / 2 - 40 / 2;

    let upPressed = false;
    let downPressed = false;
    let wPressed = false;
    let sPressed = false;

    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    function keyDownHandler(e) {
        if (e.key === "ArrowUp") upPressed = true;
        if (e.key === "ArrowDown") downPressed = true;
        if (e.key === "w") wPressed = true;
        if (e.key === "s") sPressed = true;
    }

    function keyUpHandler(e) {
        if (e.key === "ArrowUp") upPressed = false;
        if (e.key === "ArrowDown") downPressed = false;
        if (e.key === "w") wPressed = false;
        if (e.key === "s") sPressed = false;
    }

    function update() {
        if (upPressed && rightPaddleY > 0) rightPaddleY -= 6;
        if (downPressed && rightPaddleY < canvas.height - 40) rightPaddleY += 6;
        if (wPressed && leftPaddleY > 0) leftPaddleY -= 6;
        if (sPressed && leftPaddleY < canvas.height - 40) leftPaddleY += 6;

        ballX += ballSpeedX;
        ballY += ballSpeedY;

        if (ballY <= 0 || ballY >= canvas.height) ballSpeedY = -ballSpeedY;
        if (ballX <= 5 && ballY > leftPaddleY && ballY < leftPaddleY + 40)
        {
            ballSpeedX = -ballSpeedX;
            increaseBallSpeed();
        }
        if (
            ballX >= canvas.width - 5 &&
            ballY > rightPaddleY &&
            ballY < rightPaddleY + 40
        )
        {
            ballSpeedX = -ballSpeedX;
            increaseBallSpeed();
        }

        if (ballX < 0) {
            rightPlayerScore++;
            reset();
        } else if (ballX > canvas.width) {
            leftPlayerScore++;
            reset();
        }

        if (leftPlayerScore === maxScore || rightPlayerScore === maxScore) {
            const winner = leftPlayerScore === maxScore ? player1 : player2;
            endGame(winner);   
        }
    }

    function increaseBallSpeed() {
		// Increase speed by a fixed amount
		ballSpeedX *= 1.1; // Increase horizontal speed by 10%
		ballSpeedY *= 1.1; // Increase vertical speed by 10%
	}

    function reset() {
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = baseSpeed
        ballSpeedY = baseSpeed
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FFF";
        ctx.fillRect(0, leftPaddleY, 5, 40);
        ctx.fillRect(canvas.width - 5, rightPaddleY, 5, 40);
        ctx.beginPath();
        ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "10px Arial";
        ctx.fillText(`${player1}: ${leftPlayerScore}`, 40, 20);
        ctx.fillText(`${player2}: ${rightPlayerScore}`, canvas.width - 100, 20);

        if(flag2 === 1 && !gameRunning)
        {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#FFF";
            ctx.font = "15px Arial";
            ctx.textAlign = "center";
            ctx.fillText(`Tournament Camp: ${final_winner}!`, canvas.width / 2, canvas.height / 2);
        }
        else if (flag1 === 1  && !gameRunning)
        {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#FFF";
            ctx.font = "15px Arial";
            ctx.textAlign = "center"; 
            ctx.fillText(`Next Match: ${tournamentResults[0]} vs ${tournamentResults[1]}`, canvas.width / 2, canvas.height / 2);
            flag2 =1;
        }
        else if(!gameRunning)
        {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#FFF";
            ctx.font = "15px Arial";
            ctx.textAlign = "center"; 
            ctx.fillText(`Next Match: ${players[2]} vs ${players[3]}`, canvas.width / 2, canvas.height / 2);
            flag1 = 1;
        }
    }

    function loop() {
        update();
        draw();
        if (gameRunning) requestAnimationFrame(loop);
    }

    gameRunning = true;
    loop();

    function endGame(winner) {
        gameRunning = false;
        tournamentResults.push(winner);
        currentMatch++;
        if (currentMatch === 1) {
            scheduleMatch(players[2], players[3]);
        } else if (currentMatch === 2) {
            scheduleMatch(tournamentResults[0], tournamentResults[1]);
        } else {
            final_winner = winner;
            const canvas = document.getElementById("canvas3");
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#FFF";
            ctx.font = "30px Arial";
            ctx.textAlign = "center";
            messageSender("Tournament is over! and winner is " + winner);
            ctx.fillText(`Turnuva Şampiyonu: ${winner}!`, canvas.width / 2, canvas.height / 2);
        }
    }
    
}
