// Import required modules
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";  
import { asyncHandler } from "../utils/asyncHandler";  
import { User } from "../models/user.model";   

// Middleware to verify JWT (checks if user is authenticated)
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // 1️⃣ Extract Token from Cookie or Authorization Header  
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    // ✅ If token is missing, throw an Unauthorized error
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // 2️⃣ Decode & Verify JWT Token  
    const decodedJWT = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);  // Verifies token using secret key

    // 3️⃣ Find User in Database (Without Password & Refresh Token)  
    const user = await User.findById(decodedJWT?._id).select("-password -refreshToken");

    // ✅ If user is not found, token is invalid → Throw error  
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    // 🔥 4️⃣ Attach User to `req` Object (So Other Routes Can Use It)  
    // This makes the authenticated user available in `req.user`,  
    // so later in controllers, we can access `req.user` without querying the database again.
    req.user = user;

    // 🔥 5️⃣ Call `next()` to Pass Control to Next Middleware or Route Handler
    next();
  } catch (error) {
    // If token verification fails, send Unauthorized error  
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});
