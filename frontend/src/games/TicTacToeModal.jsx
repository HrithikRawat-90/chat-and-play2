import React from 'react';
import { useGame } from './GameContext';
import { useAuth } from '../context/AuthContext';
import {
  X as CloseIcon,
  RotateCcw,
  LogOut,
  Trophy,
  Gamepad2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

const TicTacToeModal = () => {
  const { activeGame, makeMove, rematch, exitGame, errorMessage } = useGame();
  const { user } = useAuth();

  if (!activeGame) return null;

  const currentUserId = (user?._id || user?.id)?.toString();
  const playerX = activeGame.players.X;
  const playerO = activeGame.players.O;
  const playerXId = (playerX?.id || playerX?._id)?.toString();
  const playerOId = (playerO?.id || playerO?._id)?.toString();

  const isUserX = Boolean(currentUserId && playerXId === currentUserId);
  const isUserO = Boolean(currentUserId && playerOId === currentUserId);
  const mySymbol = isUserX ? 'X' : isUserO ? 'O' : null;

  const isMyTurn = activeGame.status === 'in_progress' && activeGame.turn === mySymbol;
  const turnPlayer = activeGame.players[activeGame.turn];
  const isGameOver = activeGame.status === 'completed';
  const hasWon = activeGame.winner === mySymbol;
  const isDraw = activeGame.winner === 'draw';

  const handleCellClick = (index) => {
    if (!isMyTurn) return;
    if (activeGame.board[index] !== null) return;
    makeMove(activeGame.gameId, index);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-md bg-[#140e2b] border border-purple-900/50 rounded-3xl shadow-2xl shadow-purple-950/90 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-purple-900/30 flex items-center justify-between bg-[#181136]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                Play Together: Tic-Tac-Toe
              </h3>
              <p className="text-[11px] text-purple-300/60 leading-none mt-0.5">
                Real-Time Multiplayer Arena
              </p>
            </div>
          </div>

          <button
            onClick={() => exitGame(activeGame.gameId)}
            className="p-1.5 rounded-xl text-purple-400 hover:text-white hover:bg-purple-900/40 transition-colors"
            title="Exit game"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Players Scoreboard */}
        <div className="px-5 py-4 border-b border-purple-900/30 bg-[#110b24]/60">
          <div className="grid grid-cols-3 items-center">
            {/* Player X */}
            <div
              className={`flex flex-col items-center p-2 rounded-2xl transition-all ${
                activeGame.turn === 'X' && !isGameOver
                  ? 'bg-purple-900/30 ring-2 ring-purple-500/50'
                  : 'opacity-80'
              }`}
            >
              <div className="relative mb-1.5">
                <img
                  src={
                    playerX.profilePicture ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(playerX.name)}`
                  }
                  alt={playerX.name}
                  className="w-11 h-11 rounded-full object-cover bg-purple-950 border-2 border-indigo-500/50"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-600 text-white font-extrabold text-[11px] rounded-full flex items-center justify-center ring-2 ring-[#140e2b]">
                  X
                </span>
              </div>
              <span className="text-xs font-semibold text-white truncate max-w-[90px]">
                {isUserX ? `${playerX.name} (You)` : playerX.name}
              </span>
              <span className="text-[11px] text-indigo-300 font-bold mt-0.5">
                {activeGame.scores.X} {activeGame.scores.X === 1 ? 'Win' : 'Wins'}
              </span>
            </div>

            {/* VS Badge / Match Status */}
            <div className="text-center flex flex-col items-center">
              <span className="px-2.5 py-1 rounded-full bg-purple-950 border border-purple-800/40 text-[10px] font-bold text-purple-300 tracking-wider uppercase mb-1">
                VS
              </span>
              <span className="text-[11px] text-purple-300/50 font-medium">
                Draws: {activeGame.scores.draws}
              </span>
            </div>

            {/* Player O */}
            <div
              className={`flex flex-col items-center p-2 rounded-2xl transition-all ${
                activeGame.turn === 'O' && !isGameOver
                  ? 'bg-purple-900/30 ring-2 ring-purple-500/50'
                  : 'opacity-80'
              }`}
            >
              <div className="relative mb-1.5">
                <img
                  src={
                    playerO.profilePicture ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(playerO.name)}`
                  }
                  alt={playerO.name}
                  className="w-11 h-11 rounded-full object-cover bg-purple-950 border-2 border-pink-500/50"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-pink-600 text-white font-extrabold text-[11px] rounded-full flex items-center justify-center ring-2 ring-[#140e2b]">
                  O
                </span>
              </div>
              <span className="text-xs font-semibold text-white truncate max-w-[90px]">
                {isUserO ? `${playerO.name} (You)` : playerO.name}
              </span>
              <span className="text-[11px] text-pink-300 font-bold mt-0.5">
                {activeGame.scores.O} {activeGame.scores.O === 1 ? 'Win' : 'Wins'}
              </span>
            </div>
          </div>
        </div>

        {/* Turn & Outcome Banner */}
        <div className="py-2.5 px-4 text-center bg-[#171033] border-b border-purple-900/20">
          {isGameOver ? (
            isDraw ? (
              <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-300">
                <span>🤝 It's a Draw! Well played both.</span>
              </div>
            ) : hasWon ? (
              <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-400 animate-bounce">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>Victory! You won the match!</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-purple-300">
                <span>
                  {activeGame.winner === 'X' ? playerX.name : playerO.name} won this round!
                </span>
              </div>
            )
          ) : isMyTurn ? (
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-purple-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Your Turn! Place your <strong className="text-white">{mySymbol}</strong></span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-purple-300/70">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span>Waiting for {turnPlayer?.name} ({activeGame.turn})...</span>
            </div>
          )}
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* The 3x3 Tic-Tac-Toe Grid */}
        <div className="p-6 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-64 h-64 sm:w-72 sm:h-72">
            {activeGame.board.map((cellValue, idx) => {
              const isWinningCell = activeGame.winningLine?.includes(idx);
              const isEmpty = cellValue === null;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!isMyTurn || !isEmpty || isGameOver}
                  onClick={() => handleCellClick(idx)}
                  className={`aspect-square rounded-2xl flex items-center justify-center font-black text-3xl sm:text-4xl transition-all duration-200 cursor-pointer ${
                    isWinningCell
                      ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/40 scale-105 ring-2 ring-emerald-300'
                      : isEmpty
                      ? isMyTurn
                        ? 'bg-[#1e153f] hover:bg-[#281c54] border border-purple-800/40 hover:border-purple-400 hover:scale-105 active:scale-95 shadow-md shadow-purple-950/40'
                        : 'bg-[#181133] border border-purple-900/30 cursor-not-allowed'
                      : 'bg-[#1b133b] border border-purple-800/40'
                  }`}
                >
                  {cellValue === 'X' && (
                    <span className="text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">
                      X
                    </span>
                  )}
                  {cellValue === 'O' && (
                    <span className="text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]">
                      O
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-purple-900/30 bg-[#161031] flex items-center justify-between gap-3">
          <button
            onClick={() => exitGame(activeGame.gameId)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-purple-900/50 hover:bg-purple-900/30 text-purple-300 hover:text-white text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave Game</span>
          </button>

          {isGameOver && (
            <button
              onClick={() => rematch(activeGame.gameId)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicTacToeModal;

