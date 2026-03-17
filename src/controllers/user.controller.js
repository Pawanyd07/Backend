import {asyncHandler} from '../utils/asyncHandler.js';
import{ApiError} from '../utils/ApiError.js';
import {User} from '../models/User.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken = async (userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false});

        return {accessToken, refreshToken};

    }catch(error){
        throw new ApiError(500,"Something went wrong while generating Refresh Token and Access Token");
    }

};


const registerUser = asyncHandler(async (req, res) => {
   // get user detail from Frontend or Postman
   //validation Not Empty
   //user exist or not email username
   //check for image check for avatar 
   //upload image to cloudinary,avtar
   //create user Object - create DB calls
   //remove password and reponse token field from response
   //check response for user creation
   //return response


   const {fullName,email,username,password}=req.body
   console.log("email:", email);

   if(
    [fullName,email,username,password].some((field) => 
    field?.trim() ==="")
    ){
        throw new ApiError(400,"All fields are required");
    }
    const existedUser = await User.findOne({
        //$ is used to perform Logical operations in the object
        $or: [{ email },{ username }]
    
    })
    if(existedUser){
        throw new ApiError(409,"User already exist with this email or username");
    }

    // const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){ 
        throw new ApiError(500,"Failed to upload avatar");
    }

    const user = await User.create({
        fullName,
        email,
        username:username.toLowerCase(),
        password,
        avatar:avatar.url,
        coverImage: coverImage?.url || ""
    })
    const createdUser = await User.findByIdAndUpdate(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500,"Somethig went Wrong While Registering User");
    }


    return res.status(201).json(new ApiResponse(201,"User Registered Successfully",createdUser));

   //ALWAYS CLOSE EVERY RESPONSE 


});

const loginUser = asyncHandler(async (req, res) => {
    //req body -> Data 
    //user email or username
    //find user
    //password check
    //acces token and refresh token generate
    //send cookie

    const {email,username,password} = req.body;

    if(!username && !email){
        throw new ApiError(400,"Email or Username is required");
    }

    const user = await User.findOne({
        $or :[{email},{username}]
    })

    if(!user){
        throw new ApiError(404,"User does not exist");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid Password");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options={
        httpOnly:true,
        secure:true,
        
    }
    return res.status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
        new ApiResponse(200,
            {
                user:loggedInUser,
                 accessToken ,
                 refreshToken,
                },
            "User Logged In Successfully"
        )
    );
    

    

});
const logoutUser = asyncHandler(async (req, res) => {
      await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new:true
        }
      )
       const options={
        httpOnly:true,
        secure:true,
        
    }
    return res.status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200,{},"User Logged Out Successfully"));
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;   
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized, No token provided");
    }    
    
   try {
     const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.ACCESS_TOKEN_SECRET,
     )
 
     const user = await User.findById(decodedToken?._id)
 
     if(!user ){
         throw new ApiError(401,"Invalid REFRESH token");
     }
 
     if(user?.refreshToken !== incomingRefreshToken){
         throw new ApiError(401,"REFRESH IS EXPIRED OR USED");
     }
           const options={
         httpOnly:true,
         secure:true,
     }      
 
     const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id);
 
     return res.status(200)
     .cookie("AccessToken", accessToken,options)
     .cookie("refreshToken", newRefreshToken,options)
     .json(new ApiResponse(200,{accessToken, refreshToken:newRefreshToken},"Access Token Refreshed Successfully"));
 
   } catch (error) {
     throw new ApiError(401,error?.message || "Invalid Refresh Token");
   }
 
});



export {registerUser,loginUser,logoutUser,refreshAccessToken};


