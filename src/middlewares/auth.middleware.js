import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT =asyncHandler(async(req,_,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
    if(!token){
        throw new ApiError(401,"Unauthorized request")
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)//is se decoded info(token) mil jaati h , ye token user ke paas gyah , it is diff from that saved in data bse
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    if(!user){
        throw new ApiError(401,"Invalid Access Token")
    }
    req.user =user;
    next()// verify Jwt hone ke baas route me do logout user
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")
        
    }
})
