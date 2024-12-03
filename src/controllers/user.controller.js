import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiErrors.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken= user.generateRefreshToken()
        // access token toh user ko de dete but refresh toekn ko database me bhi save krke rakhna hotah 
        // taki baar 2 user se password na puchna pde, so ab isko databse me kasie daale
        user.refreshToken= refreshToken//databse me save kra do
        await user.save({validateBeforeSave:false})//validation mat lagao seedha save kr do
        //return krdo ab dono token
        return{accessToken,refreshToken}



    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating Access and Refresh token")
    }
}
const registerUser = asyncHandler(async (req,res)=>{
    //get user details from frontend
    //validation-not empty
    //check if user alreasy exits : username,email
    //chwack for images,avatar
    //create user object- create entry in db
    //remove password and refrersh token field from response
    //check for user ccreation
    //resturn res
    const {fullName,email,username,password}=req.body
    //console.log("email: ",email);
    if([fullName,email,username,password].some((field)=>
    field?.trim()==="")){
        throw new ApiError(400, "All fields are required")
    }
    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }




    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }
    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url|| "",
        email,
        password,
        username:username.toLowerCase()

    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully")
    )
})
const loginUser= asyncHandler(async(req,res)=>{
    // request body se data le aao
    // username or email se acccess dena user ko
    // find the user h ki nhi
    // check password
    // access and refrsh token genrate krke user kko bhejna
    // send these token in cookies and response bhej do
    const {email,username,password} = req.body
    if(!username || !email){
        throw new ApiError(400, "username or email is required")
    }
    // ya toh email dhoond do ya username dhoond do
    const user = await User.findOne({
        $or:[{username},{email}]
    })
    //if user mila nhi , meansn wo registered that hi nhi
    if(!user){
        throw new ApiError(404,"User does not Exist")

    }
    //User use nhi krna as wo mehtodds h mongodb ke
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid User Credentials")

    }
    // if sahi h then access and refresh toekn banao. isko ek mentid me daaldo 
    // generateAcessand refredshtoekn 
    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)
    //now send to cookies
    // abhi jo likh rhi hu that is optional step 
    const loggedInUser= await User.findById(user._id).
    select("-password -refreshToken")
    const options = {
        httpOnly : true,
        secure: true // abe ye cookies sirf server se modify ho skti not by frontend

    }
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{
            user:loggedInUser,accessToken,refreshToken
        },
        "User logged In Successfully"
    )
    )



})
const logoutUser = asyncHandler(async(req,res)=>{
    // cookie sko hta do and model me jo refreshtoken h wo bhi gayab hona chaiye
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options = {
        httpOnly : true,
        secure: true // abe ye cookies sirf server se modify ho skti not by frontend

    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out"))

})

export {
    registerUser,
    loginUser,
    logoutUser
}