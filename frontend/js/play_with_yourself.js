document.addEventListener("DOMContentLoaded", function () {});

function initGame() {
  // Initialize canvas
  var canvas = document.getElementById("canvas2");
  var ctx = canvas.getContext("2d");

  // Buttons
  var startBtn = document.getElementById("start-btn");


  var animationId;
  var gameRunning = false;

  // Define fps
  var lastUpdate = Date.now();
  var fps = 60;
  var frameDuration = 1000 / fps;
  var lag = 0;

  // Define ball properties
  var ballRadius = 10;
  var ballX = canvas.width / 2;
  var ballY = canvas.height / 2;
  var baseSpeed = 2;
  var ballSpeedX = 2;
  var ballSpeedY = 2;

  // Define paddle properties
  var paddleHeight = 80;
  var paddleWidth = 10;
  var leftPaddleY = canvas.height / 2 - paddleHeight / 2;
  var rightPaddleY = canvas.height / 2 - paddleHeight / 2;
  var paddleSpeed = 15;

  // Define score properties
  var leftPlayerScore = 0;
  var rightPlayerScore = 0;
  var maxScore = 5;

  // Handle key press
  var upPressed = false;
  var downPressed = false;
  let wPressed = false;
  let sPressed = false;

  // Listen for keyboard events
  document.addEventListener("keydown", keyDownHandler);
  document.addEventListener("keyup", keyUpHandler);

  function keyDownHandler(e) {
    if (e.key === "ArrowUp") {
      upPressed = true;
    } else if (e.key === "ArrowDown") {
      downPressed = true;
    } else if (e.key === "w") {
      wPressed = true;
    } else if (e.key === "s") {
      sPressed = true;
    }
  }

  function keyUpHandler(e) {
    if (e.key === "ArrowUp") {
      upPressed = false;
    } else if (e.key === "ArrowDown") {
      downPressed = false;
    } else if (e.key === "w") {
      wPressed = false;
    } else if (e.key === "s") {
      sPressed = false;
    }
  }

  // Start game
  startBtn.addEventListener("click", function () {
    if (!gameRunning) {
      gameRunning = true;
      loop();
    }
  });

  // Update game state
  function update() {
    // Move paddles
    if (upPressed && rightPaddleY > 0) {
      rightPaddleY -= paddleSpeed;
    } else if (downPressed && rightPaddleY + paddleHeight < canvas.height) {
      rightPaddleY += paddleSpeed;
    }

    if (wPressed && leftPaddleY > 0) {
      leftPaddleY -= paddleSpeed;
    } else if (sPressed && leftPaddleY + paddleHeight < canvas.height) {
      leftPaddleY += paddleSpeed;
    }

    // Move ball
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Ball collision with top or bottom
    if (ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
      ballSpeedY = -ballSpeedY;
    }

    // Ball collision with paddles
    if (
      ballX - ballRadius < paddleWidth &&
      ballY > leftPaddleY &&
      ballY < leftPaddleY + paddleHeight
    ) {
      ballSpeedX = -ballSpeedX;
      increaseBallSpeed();
    }

    if (
      ballX + ballRadius > canvas.width - paddleWidth &&
      ballY > rightPaddleY &&
      ballY < rightPaddleY + paddleHeight
    ) {
      ballSpeedX = -ballSpeedX;
      increaseBallSpeed();
    }

    // Ball out of bounds
    if (ballX < 0) {
      rightPlayerScore++;
      reset();
    } else if (ballX > canvas.width) {
      leftPlayerScore++;
      reset();
    }

    // Check if a player has won
    if (leftPlayerScore === maxScore) {
      playerWin("Left player");
    } else if (rightPlayerScore === maxScore) {
      playerWin("Right player");
    }
  }

  function increaseBallSpeed() {
    // Increase speed by a fixed amount
    ballSpeedX *= 1.1; // Increase horizontal speed by 10%
    ballSpeedY *= 1.1; // Increase vertical speed by 10%
  }

  // Show win message
  function playerWin(player) {
    var message = "Congratulations! " + player + " win!";
    document.getElementById("message").textContent = message;
    document.getElementById("message-modal").style.display = "block";
    reset();
  }

  // Reset ball position
  function reset() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = baseSpeed;
    ballSpeedY = baseSpeed;
  }

  // Draw objects on canvas
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFF";
    ctx.font = "15px Arial";

    // Draw middle line
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = "#FFF";
    ctx.stroke();
    ctx.closePath();

    // Draw ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Draw left paddle
    ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);

    // Draw right paddle
    ctx.fillRect(
      canvas.width - paddleWidth,
      rightPaddleY,
      paddleWidth,
      paddleHeight
    );

    // Draw scores
    ctx.fillText("Score: " + leftPlayerScore, 10, 20);
    ctx.fillText("Score: " + rightPlayerScore, canvas.width - 70, 20);
  }

  // Game loop
  function loop() {
	requestAnimationFrame(loop)
	let current = Date.now(),
    elapsed = current - lastUpdate;
	lastUpdate = current;
	lag += elapsed;

	if (lag >= frameDuration) {
		update();
		draw();
		lag -= frameDuration;
	}
  }

  // Close modal and restart game
  document
    .getElementById("message-modal-close")
    .addEventListener("click", function () {
      document.getElementById("message-modal").style.display = "none";
      document.location.reload();
    });
}
