const express = require("express");

const {createRoom, joinRoom} = require("../controllers/roomsController")

const auth = require("../middleware/auth");

const router = express.Router();

router.post('/create', auth, createRoom);

router.post('/join', auth, joinRoom);

module.exports = router

