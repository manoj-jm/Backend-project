import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  // study about req.params and req.query and req.body
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const { comment } = req.body;
  const newComment = await Comment.create({
    video: videoId,
    comment,
  });
  await newComment.save();  // save the new comment in the database
  res.json(new ApiResponse(201, newComment));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
});

export { getVideoComments, addComment, updateComment, deleteComment };
