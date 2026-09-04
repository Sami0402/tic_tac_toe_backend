const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],

    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],

    [0, 4, 8],
    [2, 4, 6],
];

function checkWinner(room){
    for(const combination of winningCombinations){
        
        const [a,b,c] = combination;

        // if the first cell of the combination is empty then it will not satisfy the winning combination
        if(room.board[a] === "") {continue};

        const symbol = room.board[a];

        // Check if other two tile are of same symbol
        if (symbol === room.board[b] && symbol === room.board[c]){
            room.winningCombination = combination;
            return symbol;
        } 
    }

    return null;
};

function checkDraw(board) {
   return board.every(cell=> cell !== "");
}

function resetGame(room) {
    room.board =  Array(9).fill("");
    room.currentTurn = room.hostSymbol;
    room.status = "playing";
    room.winner = null;
    room.winningCombination = null;
};


module.exports = {
    checkWinner,
    checkDraw,
    resetGame
}