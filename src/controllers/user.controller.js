import {asyncHandler} from '../utils/asyncHandler.js';
import{ApiError} from '../utils/ApiError.js';
import {User} from '../models/User.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';

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
        throw new ApiError("All fields are required",400);
    }
    const existedUser = await User.findOne({
        //$ is used to perform Logical operations in the object
        $or: [{ email },{ username }]
    
    })
    if(existedUser){
        throw new ApiError("User already exist with this email or username",409);
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError("Avatar is required",400);
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){ 
        throw new ApiError("Failed to upload avatar",500);
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
        "-password -refToken"
    );

    if(!createdUser){
        throw new ApiError("Somethig went Wrong While Registering User",500);
    }


    return res.status(201).json(new ApiResponse(201,"User Registered Successfully",createdUser));

   //ALWAYS CLOSE EVERY RESPONSE 


});


export {registerUser};