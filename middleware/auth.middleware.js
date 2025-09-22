import AppError from "../utils/error.utils.js";
import jwt from 'jsonwebtoken';


const isLoggedIn = async (req,res,next)=>{
        const {token} = req.cookies;
    if(!token){
        return next(new AppError('Unauthenticated ,please login first',401))
    }
 
    const userDetails =  jwt.verify(token ,process.env.JWT_SECRET);
    req.user = userDetails;
    next();
}

const authorizeRoles = (...roles) => async  (req,res,next)=>{
    const currentRole = await req.user.role;
    console.log("Decoded user role from JWT:", currentRole);
    if(! roles.includes(currentRole)){
        return next(new AppError('You do not have permission to view this route',403))
    }
    next();
}

export  {
    isLoggedIn,
    authorizeRoles
};