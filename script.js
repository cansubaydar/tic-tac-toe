// Create a player - Factory function 
const Player = (name, mark, isAI = false) => {
  return { name, mark, isAI };
};

// Gameboard state - wrap the factory function inside an IIFE (Immediately Invoked Function Expression)
const GameBoard = (() => {
  const board = Array(9).fill("");

  const get = () => board;

  const set = (index, mark) => {
    if(board[index]) return false; 
    board[index] = mark;
    return true;
  }; 

  const reset = () => board.fill("");
  return { get, set, reset };
})(); 

// Game Controller - game flow and rules, AI with depth-limited minimax algorithm
const GameController = (() => {
  let players = []; 
  let currentPlayerIndex = 0;
  let gameOver = false;
  let winner = null; 

  const winCombinations = [
    [0,1,2], [3,4,5], [6,7,8], //vertical
    [0,3,6], [1,4,7], [2,5,8], // horizontal 
    [0,4,8], [2,4,6] // diagonal 
  ]; 

  const start = (playerName, mark) => {
    const humanPlayerMark = mark; 
    const aiPlayerMark = switchMark(mark); 
    
    players = [
      Player(playerName, humanPlayerMark), 
      Player("AI", aiPlayerMark, true)
    ]

    currentPlayerIndex = humanPlayerMark === "X" ? 0 : 1;

    gameOver = false; 
    winner = null; 

    GameBoard.reset(); 
    DisplayController.render();
    DisplayController.setStatus(`${players[currentPlayerIndex].name} starts`);

    aiMove();
  };

  const playRound = (index) => {
    if(gameOver) return; 

    if(!GameBoard.set(index, players[currentPlayerIndex].mark)) return;

    updateState(); 
    DisplayController.render();

    if (!gameOver) {
      switchPlayer();
      aiMove();
    }
  };

  const switchPlayer = () => {
    currentPlayerIndex = 1 - currentPlayerIndex;
    DisplayController.setStatus(`${players[currentPlayerIndex].name}'s turn`);
  };

  const switchMark = (mark) => {
    return mark === "X" ? "O" : "X";
  }

  const updateState = () => {
    const board = GameBoard.get(); 
    winner = getWinner(board);

    if(winner) {
      gameOver = true; 
      DisplayController.setStatus(`${players[currentPlayerIndex].name} has won!`);
      return; 
    }

    if (checkTie(board)) {
      gameOver = true;
      DisplayController.setStatus("It's a tie!");
    }
  }; 

  const getWinner = (board) => {
    for(let win of winCombinations) {
      const [a, b, c] = win;
      
      if(board[a] && board[a] === board[b] && board[a] === board[c]) {
        return win;
      }
    }
    return null; 
  }; 

  const checkTie = (board) => board.every(cell => cell !== "");

  //AI with Minimax algorithm 
  const AI = ((board, mark) => {
    const max_depth = 2; 

    let aiMark;
    let humanMark; 

    const getMove = (board, mark) => {
      aiMark = mark;
      humanMark = switchMark(mark);

      const isEmpty = board.every(cell => cell === "");
      if(isEmpty) return getRandomMove(board);

      return getBestMove(board);
    }

    const getRandomMove = (board) => {
      const emptyCells = board.map((cell, i) => cell === "" ? i : null)
                              .filter(i => i !== null);

      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    };

    const getBestMove = (board) => {
      let bestScore = -Infinity;
      let bestMove = null; 

      board.forEach((cell, i) => {
        if(!cell) {
          board[i] = aiMark;
          const score = minimax(board, 0, false);
          board[i] = "";
          if(score > bestScore) {
            bestScore = score;
            bestMove = i;
          }
        }
      }); 
      return bestMove;
    };

    const minimax = (board, depth, isMaximizing) => {
      const terminalScore = checkTerminal(board, depth);
      if(terminalScore !== null) return terminalScore;

      if(depth === max_depth) {
        return evaluate(board);
      }

      let best = isMaximizing ? -Infinity : Infinity; 
      const playerMark = isMaximizing ? aiMark : humanMark; 
      
      board.forEach((cell, i) => {
        if(!cell) {
          board[i] = playerMark;
          const value = minimax(board, depth + 1, !isMaximizing);
          board[i] = ""; 

          best = isMaximizing ? Math.max(best, value) : Math.min(best, value);
        }
      });
      return best; 
    };

    const checkTerminal = (board, depth) => {
      const winPotential = getWinner(board); 

      if(winPotential) { 
        const winStatus = board[winPotential[0]];
        if(winStatus === aiMark) return 10 - depth;
        if(winStatus === humanMark) return depth - 10; 
      }

      if(checkTie(board)) return 0;

      return null; 
    };

    const evaluate = (board) => {
      let score = 0;

      winCombinations.forEach(([a, b, c]) => {
        const winnerCombo = [board[a], board[b], board[c]]; 
    
        const checkWinner = (mark) => winnerCombo.filter(x => x === mark).length === 2 && winnerCombo.includes("");

        if(checkWinner(aiMark)) return score += 4;
        if(checkWinner(humanMark)) return score -=4;
      });

      return score; 
    };

    return getMove(board, mark);
  })

  const aiMove = () => {
    const currentPlayer = players[currentPlayerIndex];

    if (!gameOver && currentPlayer.isAI) {
      setTimeout(() => playRound(AI(GameBoard.get(), currentPlayer.mark)), 500);
    } 
  };

  const result = () => winner;

  return { start, playRound, result };
})();

// Display Controller - create a display object to handle the DOM
const DisplayController = (() => {
  const playerForm = document.querySelector(".player-form");
  const startBtn = document.getElementById("start-button");
  const nameInput = document.getElementById("player-name"); 
  const marker = document.getElementsByName("marker");
  const container = document.querySelector('.game-container');
  const cells = document.querySelectorAll(".cell");
  const statusText = document.querySelector(".status-text");
  const restartBtn = document.getElementById("restart-button");
  let currentMark; 

  const render = () => {
    const board = GameBoard.get();
    const playerWin = GameController.result();

    cells.forEach((cell, i) => {
      cell.textContent = board[i];
      playerWin?.includes(i) ? cell.classList.add("win") : cell.classList.remove("win");
    });
  };

  const setStatus = (message) => {
    statusText.textContent = message;
  };

  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      GameController.playRound(cell.dataset.cellIndex)
    });
  });
  
  const checkMark = () => {
    for(let i = 0; i < marker.length; i++) {
      if(marker[i].checked) {
        currentMark = marker[i].value;
      }
    }
    return currentMark;
  }

  startBtn.addEventListener('click', () => {
    const nameValue = (nameInput.value).charAt(0).toUpperCase() + (nameInput.value).slice(1);
    GameController.start(nameValue, checkMark());  
  });
  
  playerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    nameInput.value = "";
    container.style.display = "flex"
    playerForm.style.display = "none";
  })

  restartBtn.addEventListener('click', () => {
    marker[0].checked = "X"; 
    container.style.display = "none";
    playerForm.style.display = "inline-flex";
  })

  return { render, setStatus };
})();

const year = document.getElementById('year');
year.textContent = new Date().getFullYear(); 