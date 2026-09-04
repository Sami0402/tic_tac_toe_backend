const express = require('express');

// IMPORT HTTP MODULE
const http = require("http");

const jwt = require('jsonwebtoken');

const authMiddleware = require('./middleware/auth');

const Room = require("./models/Room");

const { checkWinner, checkDraw, resetGame } = require('./utils/gameUtils'); 

// IMPORT SOCKET.IO MODULE
const { Server } = require("socket.io");
 
const { initIO, getIO } = require("./socket");

const SOCKET_EVENTS = require('./constants/socketEvents');

require('dotenv').config();

const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');

const roomRoutes = require('./routes/roomRoutes');

const app = express();

// CREATE AN HTTP SERVER and WRAP IT ARROUND OUR BACKEND
const server = http.createServer(app);

// This Creates the Socket Server, That is attached with 'http server' 
const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

initIO(io);

// Socket.IO Authentication Middleware
io.use((socket, next) => {
        
        try {
            
            const token = socket.handshake.auth.token;

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            socket.user = decoded;

            next();
        } catch (error) {
            next(new Error('Unauthorized'));
        }
    });


// 'connection' is built-in Socket.IO event 
// Whenever any client connects then socket.io fires [io.on("connection"..]
// Every user connect with their own 'socket' thats why there is 'socket.id' 
io.on("connection", (socket) => {

    // JOIN-ROOM -- EVENT
    socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ roomCode }) => {
        socket.join(roomCode);

        socket.roomCode = roomCode;

        console.log(`${socket.id} joined room ${roomCode}`);
    })

    // MAKE-MOVE -- EVENT
    socket.on(SOCKET_EVENTS.MAKE_MOVE, async ({ roomCode, index }) => {

        // VALIDATIONS -- BFORE MAKING ANY MOVE
        
        const room = await Room.findOne({ roomCode });

        // If room doesn't exist
        if(!room){
            return;
        }

        // Is User in this room
        const userId = socket.user.id;
        console.log("Socket ID:", socket.user.id);
        const userInThisRoom = room.host.toString() === userId || room.guest.toString() === userId;
        if(!userInThisRoom) {
            return;
        }

        // Is this Game Already finished
        if(room.status == "finished"){
            return;
        }

        // Check If it's Player's Turn      
        const playerSymbol = socket.user.id === room.host.toString() ? room.hostSymbol : room.guestSymbol;

        if(playerSymbol !== room.currentTurn){
            return;
        }

        // Check if Cell is Empty
        if(room.board[index] !== "") {return;}

        // MAKE MOVE - BOARD UPDATED IN MONGO.DB
        room.board[index] = playerSymbol;

        // If someone Wins
        const winner = checkWinner(room);
        if (winner){

            room.status = "finished";

            if (winner === room.hostSymbol){
                room.hostScore++;
                room.winner =  room.hostUsername;
            } else {
                room.guestScore++;
                room.winner = room.guestUsername;
            }

            await room.save();

            const IO = getIO();

            IO.to(roomCode).emit(SOCKET_EVENTS.GAME_UPDATED,room);

            // Takes 3 Sec delay then Reset the board
            setTimeout(async ()=> {
                resetGame(room);

                await room.save();

                IO.to(roomCode).emit(SOCKET_EVENTS.GAME_UPDATED,room);         
            }, 3000);
            return;
        }

        // If Draw
        const isItDraw = checkDraw(room.board)
        if(isItDraw){
            room.status = "draw",
            await room.save();
            
            const IO = getIO();
            
            IO.to(roomCode).emit(SOCKET_EVENTS.GAME_UPDATED,room);         
            
            // Takes 3 Sec delay then Reset the board
            setTimeout(async ()=> {
                resetGame(room);

                await room.save();

                IO.to(roomCode).emit(SOCKET_EVENTS.GAME_UPDATED,room);         
            }, 3000);

            return;
        }

        // Update the turn
        room.currentTurn = room.currentTurn === room.hostSymbol ? room.guestSymbol : room.hostSymbol;

        await room.save();

        const io = getIO();

        io.to(roomCode).emit(SOCKET_EVENTS.GAME_UPDATED, room);


    });

    socket.on(SOCKET_EVENTS.LEAVE_ROOM, () => {
        if (socket.roomCode) {
            socket.leave(socket.roomCode);
            socket.roomCode = null;
        }
    })

    // Each 'socket' listens for events seprately
    // 'disconnects' is built-in Socket.IO event 
    // the below event runs when the user 'disconnects'
    socket.on("disconnect", async ( ) => {
        console.log("User disconnected:", socket.id);

        // Destroy the Game
        
        // Check if socket is part of any room or not
        if(!socket.roomCode) {return}

        // find room where socket is playing
        const room = await Room.findOne({ roomCode: socket.roomCode });
        if(!room) {return}

        socket.to(room.roomCode).emit(SOCKET_EVENTS.GAME_DESTROYED, {
            message: "Opponent left the game."
        } );

        // Emit that player left so that remaining player can also left
        socket.emit(SOCKET_EVENTS.PLAYER_LEFT, true);


        // Delte from MongoDB
        await Room.deleteOne({ _id: room._id });

        console.log('Game Destroye Event Works')

    });
});

const PORT = process.env.PORT || 3000;

connectDB();

app.use(express.json());

app.use(authMiddleware);

app.use('/auth', authRoutes);

app.use('/rooms', roomRoutes);


// Now we are listening with 'http server' and 'socket.io server' is attached to it 
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});


/* Important in Socket.IO*/
// io -> Entire Socket.IO server, Manages all socket connections and broadcasts events.
// socket -> One connected client, Handles communication with one connected user.
// Room -> Group of sockets communicating together, Groups related sockets so only they receive specific events.
