// controllers ? why ? - because we are going to handle the request and response here and we are going to call the services from here. logic will be here.
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/Cloudinary.js";
import jwt from "jsonwebtoken";
import { mongoose } from "mongoose";

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
    .json(new ApiResponse(200, {}, "User is logout successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // when accesstoken is expired , rather than login again , we can just hit this endpoint where we send the refreshtoken along the request and from that we can match with its database refreshtoken , if same , create an session again .

  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Access");
  }

  try {
    const decodeToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findOne(decodeToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalide RefreshToken");
    }

    // matching the user.refreshtoken is same as incomingrefreshtoken
    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used! ");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefreshTokens(user?._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refresh"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refreshToken");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id); // The req.user?._id is coming from verifyJWT middleware.
  const ispasswordValid = user.isPasswordCorrect(oldPassword);
  if (!ispasswordValid) {
    throw new ApiError(401, "Invalid Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "currect user fetched successfully", req.user));
});

// const getUserByName = asyncHandler(async (req, res) => {
//   const { username } = req.params; // 👈 Get userId from URL
//   const user = await User.findById(username).select("-password");

//   if (!user) {
//     throw new ApiError(404, "User not found");
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, "User fetched successfully", user));
// });

const updateAccountDetails = asyncHandler(async (req, res) => {
  // console.log("checkpiont 1")
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "These fiels are required!");
  }
  // console.log("checkpiont 2")
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { fullname, email }, // is equal to {fullname : fullname , email : email } since req object has user refrences
    },
    { new: true }
  ).select("-password");
  // console.log("checkpiont 3")

  return res
    .status(200)
    .json(new ApiResponse(200, "user details updated successfully ", user));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // Yes! You should delete the old avatar from Cloudinary (or wherever you're storing images) because:
  //   1️⃣ Storage Management:If you don't delete the old avatar, it will stay in Cloudinary (or any storage), taking up unnecessary space.
  //   2️⃣ Cost Optimization: Cloud storage is not free, and unused images increase storage costs over time.
  const avatarLocalPath = req.file?.path;
  console.log(req.file);
  if (!avatarLocalPath) {
    throw new ApiError(400, "file path is missing");
  }
  // fetch the user
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  // extract the public id from old avatar url  (cloudinary format)
  // delete the old image

  const avatar = await uploadToCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "error while uploading to avatar ");
  }

  const newuser = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password");

  // Do We Need to Delete the Old Avatar Photo?

  return res
    .status(200)
    .json(new ApiResponse(200, "UserAvatar is updated successfully", newuser));
});

const updateUserCoverImg = asyncHandler(async (req, res) => {
  const CoverImgLocalPath = req.file?.path;
  if (!CoverImgLocalPath) {
    throw new ApiError(400, "image lfile path is missing");
  }

  const CoverImg = await uploadToCloudinary(CoverImgLocalPath);

  if (!CoverImg.url) {
    throw new ApiError(400, "error while uploading to CoverImg ");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverimage: CoverImg.url } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, "UserCoverImg is updated successfully", user));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  console.log(channel);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

//This code is (using MongoDB Aggregation Pipeline) to fetch a user's watch history and include the video owners' details inside each video.
const getUserWatchHistory = asyncHandler(async (req, res) => {
  /*{
  $lookup: {
    from: "destination_collection",                            //  The collection we are joining with
    localField: "field_in_current_collection",                 // 🔹 The field in the current collection
    foreignField: "matching_field_in_destination_collection",  // 🔹 The field in the destination collection
    as: "new_field_name"                                       // 🔹 The field that will store the joined data
  }
}
*/

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id), // ✅ Recommended
      },
    },
    {
      $lookup: {
        from: "Video",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          // nested lookup and we are in vedios and we from here we need to connect with user
          {
            $lookup: {
              from: "User",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            // $lookup always returns an array (even if there is only one owner).
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched successfully"
      )
    );
  // user[0] → Extracts the first (and only) user from the array returned by .aggregate(). Since we are filtering by _id, we expect only one user, but the result is still wrapped in an array.
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  getUserChannelProfile,
  updateUserCoverImg,
  getUserWatchHistory,
  // getUserByName,
};
