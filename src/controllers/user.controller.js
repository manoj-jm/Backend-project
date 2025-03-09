// controllers ? why ? - because we are going to handle the request and response here and we are going to call the services from here. logic will be here.
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.js";
import { uploadToCloudinary } from "../utils/Cloudinary.js";

// it going to get called when user hit a route "registerUser"
const registerUser = asyncHandler(async (req, res) => {
  // 1.get user details from frontend
  const { username, email, fullname, password } = req.body;
  //  console.log(" email : ", email);

  // 2.validations - not empty
  if (
    [username, email, fullname, password].some((field) => {
      field.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fileds are required");
  }
  // 3.check if user already exists(by username , email)
  const userExists = await User.findOne({ $or: [{ username }, { email }] });
  if (userExists) {
    throw new ApiError(409, "User with username or email already exists");
  }
  // 4.check if images are uploaded
  const avatarImageLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  // 5.console.log(" avatarImageLocalPath : ", avatarImageLocalPath);
  if (!avatarImageLocalPath) {
    throw new ApiError(400, `Please upload ${avatarImageLocalPath} image`);
  }
  if (!coverImageLocalPath) {
    throw new ApiError(400, `Please upload ${coverImageLocalPath} image`);
  }
  // 6.upload images to cloudinary
  const avatar = await uploadToCloudinary(avatarImageLocalPath);
  const cover = await uploadToCloudinary(coverImageLocalPath);

  // 7.check does avatar and cover image uploaded successfully
  if (!avatar) {
    throw new ApiError(400, "Error uploading avatar image");
  }

  // 8.create a user entry to the database
  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: cover?.url || "",
  });
  // 9. remove password and refresh token from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // 10.check user is created successfully
  if (!createdUser) {
    throw new ApiError(500, "Error creating user");
  }
  // 11.send response to frontend
  // return res.send(new ApiResponse(200,"User created successfully",createdUser)) not good practice
  return res
    .status(200)
    .json(new ApiResponse(200, "User created successfully", createdUser));
});

export { registerUser };
