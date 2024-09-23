// src/App.js
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Board from './components/Board';
import './App.css';

const socket = io('http://localhost:4000'); // Replace with your backend server URL if different

const App = () => {
  const [symbol, setSymbol] = useState('');
  const [myTurn, setMyTurn] = useState(false);
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [status, setStatus] = useState('Waiting for opponent...');

  useEffect(() => {
    // Listen for game begin event
    socket.on('game.begin', (data) => {
      setSymbol(data.symbol);
      setStatus(`Game started! You are '${data.symbol}'.`);
      setMyTurn(data.symbol === 'X');
    });

    // Listen for opponent leaving
    socket.on('opponent.left', () => {
      setStatus('Your opponent left the game.');
      setMyTurn(false);
    });

    // Listen for moves made by players
    socket.on('move.made', (data) => {
      const newSquares = squares.slice();
      newSquares[data.index] = data.symbol;
      setSquares(newSquares);

      // If the symbol of the last move is not the same as your symbol, it's your turn
      if (data.symbol !== symbol) {
        setMyTurn(true);
        setStatus('Your turn');
      } else {
        setMyTurn(false);
        setStatus("Opponent's turn");
      }

      // Check for game over
      const winner = calculateWinner(newSquares);
      if (winner) {
        setStatus(winner === symbol ? 'You win!' : 'You lose.');
        setMyTurn(false);
      } else if (newSquares.every((square) => square !== null)) {
        setStatus('Draw game.');
        setMyTurn(false);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.off('game.begin');
      socket.off('opponent.left');
      socket.off('move.made');
    };
  }, [squares, symbol]);

  const handleClick = (index) => {
    if (!myTurn || squares[index]) {
      // Invalid move
      return;
    }

    // Make the move and emit the event to the server
    socket.emit('make.move', {
      index: index,
      symbol: symbol,
    });
  };

  return (
    <div className="game">
      <h1>Tic Tac Toe Multiplayer</h1>
      <p>{status}</p>
      <Board squares={squares} onClick={handleClick} />
    </div>
  );
};

// Helper function to calculate the winner
const calculateWinner = (squares) => {
  const lines = [
    [0, 1, 2], // Rows
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6], // Columns
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8], // Diagonals
    [2, 4, 6],
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return squares[a];
    }
  }

  return null;
};

export default App;