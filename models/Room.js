const mongoose = require('mongoose');

const roomSchema = mongoose.Schema({
    roomCode: String,
    host: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    hostUsername: {
        type: String,
        default: null
    },
    guest: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        default: null,
    },
    guestUsername: {
        type: String,
        default: null
    },
    hostSymbol: {
        type: String,
        enum: ["X","O"],
        default: "X"
    },
    guestSymbol: {
        type: String,
        enum: ["X","O"],
        default: "O"
    },
    hostScore : {
        type: Number,
        default: 0
    },
    guestScore : {
        type: Number,
        default: 0
    },
    board: {
        type: [String],
        default: ()=> Array(9).fill("")},
    currentTurn: {
       type: String,
       enum: ["X","O"],
       default: "X"
    },
    status: {
        type: String,
        enum: ["waiting", "playing", "finished", "draw"],
        default: "waiting"
    },
    winner: {
        type: String,
        default: null
    },
    winningCombination: {
        type: [Number],
        default: null
    }
}, {
    timestamps: true
}
);

module.exports = mongoose.model("Room", roomSchema);