// controllers ? why ? - because we are going to handle the request and response here and we are going to call the services from here. logic will be here.
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/Cloudinary.js";

// creating a methods for access and refresh tokens generation

const generateAccessTokenAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // saving the user refreshToken into database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refersh tokens ! "
    );
  }
};

// it going to get called when user hit a route "registerUser"

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  //check whether data came or not
  // console.log("Received Files:", req.files);
  // console.log("Request Body:", req.body);

  //   if (!req.files || !req.files.avatar || !req.files.coverimage) {
  //     return res.status(400).json({ error: "Missing files" });
  //   }

  const { fullname, email, username, password } = req.body;
  //console.log("email: ", email);

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  //   console.log(req.files?.avatar[0].path);

  const avatarLocalPath = req.files?.avatar[0]?.path; // 🚀 multer store the files into local , so we can get it using req.files property

  //const coverImageLocalPath = req.files?.coverimage[0]?.path;
  // check whether coverimage is came or not
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverimage) &&
    req.files.coverimage.length > 0
  ) {
    coverImageLocalPath = req.files.coverimage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);
  const coverimage = await uploadToCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverimage?.url || " ",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  // find the user and check user password
  // access and refresh token generate
  // send cookie

  const { username, email, password, fullname } = req.body;

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all  are field Required!");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(400, "User does not exists");
  }

  const ispasswordValid = await user.isPasswordCorrect(password);
  if (!ispasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // if password is correct make access and refresh token
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Does the Backend Send a Cookie After Login?
  // Yes! When you log in, the backend sends a response that usually contains a cookie for authentication purposes.
  // The cookie helps in session management and user authentication. It allows the client (browser/Postman) to store a small piece of data so that the user stays logged in without re-entering credentials.
  //A cookie typically contains an authentication token (like JWT) or a session ID.
  // Set-Cookie: session_id=abc123xyz; HttpOnly; Secure; Path=/; Max-Age=3600 (1hr)

  ///When the backend sends a Set-Cookie header, the frontend automatically stores the cookie.
  // In a browser, the cookie is stored and sent with every request to the backend.
  // In Postman, cookies can be viewed under the Cookies tab

  const options = {
    httpOnly: true,
    secure: true,
  };

  //  Yes, res.cookie() sets cookies in the backend, and the browser automatically stores them
  //  Yes, res.json({ user: token }) sends the token to the frontend, allowing it to be stored manually.

  // res.cookie() means , we are setting all tokens inside res object ? right ? , since we injected the cookieparser middleware , so we can access the cookies from both req and res object ?  ✅ correct manoj!
  return res
    .status(200)
    .cookie("accessToken", accessToken, options) // seting cookies in the backend ( res object)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "user logedin successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // since verify middleware , we have the access to user in req object
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true, // while responding , u'll get updated value
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  //Even though the user logs out on the backend, the browser still has the authentication cookies.
  // If we don't clear them, the user will still send them in future requests, leading to authentication issues.

  // removes cookies from the client (browser) by setting them again with an empty value and expiration date in the past.

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User is logout successfully"));
});

export { registerUser, loginUser, logoutUser };
