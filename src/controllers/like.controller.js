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
  const likeExisted = await Like.findOne({ video: videoId, likedBy: userid }); // likeExisted store the like object

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
  const userId = req.user.id;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(new ApiResponse(400, "Invalid userID"));
  }

  const likedComment = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });

  if (likedComment) {
    await Like.deleteOne({ _id: userId });
    return res.status(200).json(new ApiResponse(200, "like removed", null));
  } else {
    const newLike = await Like.create({
      comment: commentId,
      likeBy: userId,
    });
    return res.status(200).json(new ApiResponse(200, "like added", newLike));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const likeTweet = await Like.findOne({ tweet: tweetId, likeBy: req.user.id });
  if (likeTweet) {
    await Like.deleteOne({ _id: userId });
    return res.status(200).json(new ApiResponse(200, "Like is removed", null));
  } else {
    const newLike = await Like.create({
      tweet: tweetId,
      likeBy: req.user.id,
    });
    return res.status(200).json(new ApiResponse(200, "Like is added", newLike));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const allLikedVideos = await Like.aggregate([
    {
      $match: {
        likeBy: mongoose.Types.ObjectId(req.user?.id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
            },
          },
          {
            $unwind: "$owner",
          },
        ],
      },
    },
    {
      $unwind: "$likedVideo",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        likedVideo: 1,
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, "success", allLikedVideos));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
