const jwt = require('jsonwebtoken');

const auth = async(req, res, next) => {
   
 try {
    const authHeader  = req.get('authorization');

    if(!authHeader ) {
        return res.status(401).json({message: "Unauthorized"}); 
    }

    const token = authHeader.split(" ")[1]


    const secretKey = process.env.JWT_SECRET;

    const decoded =  jwt.verify(token, secretKey);

    req.user = decoded;

    next(); 

    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Internal Server Error"});
    }
}



module.exports = auth;