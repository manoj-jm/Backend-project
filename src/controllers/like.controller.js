import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  const userid = req.user.id;

  if (!isValidObjectId(videoId) || !isValidObjectId(userid)) {
    throw new ApiError(400, "Invalid userID or videoID");
  }
  const likeExisted = await Like.findOne({ video: videoId, likedBy: userid });

  if (likeExisted) {
    await Like.deleteOne({ _id: likeExisted._id });

    return res.status(200).json(new ApiResponse(200, "like is removed ", null));
  } else {
    const newlike = await Like.create({
      video: videoId,
      likeBy: userid,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "like is added ", newlike));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
