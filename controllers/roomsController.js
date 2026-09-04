const Room = require("../models/Room");

const { getIO } = require("../socket");

const SOCKET_EVENTS = require('../constants/socketEvents');

const generateShortCode = ()=> {
    const randomStr = Math.random().toString(36).substring(2,8);
    return randomStr;
}

const createRoom = async(req, res) => {
    try{
        const host = req.user.id;

        const hostUsername = req.user.username;

        const { hostSymbol } = req.body;

        // Check whether user has chosen the valid symbol or not
        if(!hostSymbol || !["X", "O"].includes(hostSymbol)){
            return res.status(400).json({
                message: "Invalid host symbol"
            });
        }

        // Check the logged-in user already has an active room, either as the host or as the guest.
        const activeRoom = await Room.findOne({
            $or: [
                {host: req.user.id},
                {guest: req.user.id}
            ],
            
            status: {
                $in: ["waiting", "playing"]
            }
        })

        if(activeRoom){
            return res.status(400).json({
                message: "You already have an active room",
                room: activeRoom
            });
        }


        // Generate a room code and also check if there isn't any room with the same RoomCode 
        let roomCode;
        let roomExists;
        do{
            roomCode = generateShortCode();
            roomExists  = await Room.findOne({roomCode});
        } while(roomExists);

        const guestSymbol = hostSymbol === "X" ? "O" : "X";

        const room = new Room({
            roomCode: roomCode,
            host: host,  
            hostUsername: hostUsername,
            hostSymbol: hostSymbol,
            guestSymbol: guestSymbol,
   
        })

        await room.save();
        
        return res.status(201).json({
            message: "Room has been Created",
            room,
        });

    } catch(error) {
        console.error(error);
        res.status(500).json({
            message: "Something went wrong",
        })
    }
}

const joinRoom = async(req, res) => {
    try{
        const {roomCode} = req.body;

        const guestUsername = req.user.username;

        // Check Whether that room exist or not 
        const room = await Room.findOne({roomCode: roomCode});
        
        if(!room){
            return res.status(404).json({
                message: "Room does not Exist",
            });
        }


        // Check If game is "finished"
        if (room.status === "finished") {
            return res.status(400).json({
                message: "Game has already finished."
                });
            }


        // Check if room is already Full
        if(room.guest){
            return res.json({
                message: "Sorry the room is Full",
            })
        }


        // check if the User is already in the room / if host or guest have same ID as user's
        const userInRoom = room.host.toString() === req.user.id || room.guest?.toString() === req.user.id;

        if(userInRoom) {
            return res.status(409).json({
                message: "You are already joined this Room as host or guest"
            });
        }


        // check if the User already in another active room
        const userInAnotherRoom = await Room.findOne({
            $or: [
                {host: req.user.id},
                {guest: req.user.id}
            ],
            status: ["waiting", "playing"]
        });

        if(userInAnotherRoom){
            return res.status(409).json({
                message: "You are already in another active room",
                room: userInAnotherRoom
            });
        }


        room.guest = req.user.id;
        room.guestUsername = guestUsername;
        room.status = "playing";

        await room.save();

        const io = getIO();

        io.to(room.roomCode).emit(SOCKET_EVENTS.ROOM_UPDATED, room);
        

        return res.status(200).json({
            message: "Joined Room successfully.",
            room,
        });


    } catch(error) {
        console.error(error);
        return res.status(500).json({
            message: "Something went wrong",
        })
    }
}

module.exports = { createRoom, joinRoom }