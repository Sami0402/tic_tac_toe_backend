const User = require('../models/User');

const bcrypt = require("bcrypt");

const jwt = require('jsonwebtoken');

const register = async(req, res) => {

   try {
     const {username, email, password} = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ message: "All fields are required"});     
    }

    
    const emailExits = await User.findOne({email});
    const usernameExits = await User.findOne({username});

    if(emailExits){
        return res.status(400).json({ message: "Email already exists"});   
    } else if (usernameExits) {
        return res.status(400).json({ message: "Username already exists"});     
    } 

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User(
        {
            username,
            email,
            password : hashedPassword,
        }
    );

    await user.save();

    return res.status(201).json({message: "Account Created Succesfully!"});
   } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal Server Error",
        })
   }

}

const login = async(req, res) => {

    try {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({message: "All fields are required!"});
    }

    const user = await User.findOne({email});

    if(!user) {
        return res.status(400).json({message: "Invalid email or password"});
    }

    const checkPassword = await bcrypt.compare(password, user.password);

    if(!checkPassword) {
        return res.status(400).json({message: "Invalid email or password"});
    }

    const payload = { id: user._id , username: user.username,};

    const secretKey = process.env.JWT_SECRET;

    const token = jwt.sign(payload, secretKey, {expiresIn: '30d'});

    return res.status(200).json({
        message: "Logged In",
        token: token
    });

    } catch (error) {
        console.error(error);
        return res.status(400).json({
            message: "Internal Server Error",
        })
    }

    

}

module.exports = {register, login}