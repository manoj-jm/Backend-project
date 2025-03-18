import { Router } from "express";
import {
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
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Registration (Handles both avatar & cover image upload)
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverimage", maxCount: 1 },
  ]),
  registerUser
);

// Authentication Routes
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser); // its good to use get 
router.route("/refresh-token").post(refreshAccessToken);

// Secure User Actions
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-user-details").patch(verifyJWT, updateAccountDetails);
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/update-coverimage").patch(verifyJWT, upload.single("coverimage"), updateUserCoverImg);

// Profile & Watch History
router.route("/profile/:username").get(verifyJWT,getUserChannelProfile);
router.route("/history").get(verifyJWT, getUserWatchHistory);

export default router;
