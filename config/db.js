const mongoose = require("mongoose");

const mongoDB = process.env.MONGO_URI;

const connectDB = async() => {
    try {
        const connect = await mongoose.connect(mongoDB);
        console.log(`MongoDB Connected : ${connect.connection.host}`)
    } catch(error) {
        console.error(`Database connection error: ${error.message}`);
        process.exit(1);
    }
}

module.exports = connectDB;