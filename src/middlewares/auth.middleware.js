import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js"; // ✅ fix case if needed

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.headers?.authorization?.replace("Bearer ", "");

        // 🔍 STEP 1: Check header & token
        // console.log("==== DEBUG START ====");
        // console.log("AUTH HEADER:", req.headers.authorization);
        // console.log("TOKEN:", token);

        if (!token) {
            console.log("❌ No token received");
            throw new ApiError(401, "Unauthorized, No token provided");
        }

        // 🔍 STEP 2: Verify token
        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

       // console.log("DECODED TOKEN:", decodedToken);

        // 🔍 STEP 3: Extract userId safely
        const userId = decodedToken?._id || decodedToken?.id;
        //console.log("EXTRACTED USER ID:", userId);

        // 🔍 STEP 4: Find user in DB
        const user = await User.findById(userId).select(
            "-password -refreshToken"
        );

        console.log("USER FOUND:", user);

        if (!user) {
           // console.log("❌ User not found in DB");
            throw new ApiError(401, "Invalid Access Token");
        }

        // 🔍 SUCCESS
        // console.log("✅ USER AUTHENTICATED");
        // console.log("==== DEBUG END ====");

        req.user = user;
        next();

    } catch (error) {
        console.log("==== ERROR DEBUG ====");
        console.log("JWT ERROR TYPE:", error.name);
        console.log("JWT ERROR MESSAGE:", error.message);
        console.log("==== ERROR END ====");

        throw new ApiError(401, "Invalid or Expired Token");
    }
});