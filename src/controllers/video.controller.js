import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadToCloudinary } from "../utils/Cloudinary.js";
import { json } from "express";
// import {uploadOnCloudinary} from "../utils/cloudinary.js"

// test this controller ( what is req.query includes in it )
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  console.log(userId);
  const pipeline = [];

  // for using Full Text based search u need to create a search index in mongoDB atlas
  // you can include field mapppings in search index eg.title, description, as well
  // Field mappings specify which fields within your documents should be indexed for text search.
  // this helps in seraching only in title, desc providing faster search results
  // here the name of search index is 'search-videos'
  if (query) {
    pipeline.push({
      $search: {
        index: "search-videos",
        text: {
          query: query,
          path: ["title", "description"], //search only on title, desc
        },
      },
    });
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }

    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  // fetch videos only that are set isPublished as true
  pipeline.push({ $match: { isPublished: true } });

  //sortBy can be views, createdAt, duration
  //sortType can be ascending(-1) or descending(1)
  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$ownerDetails",
    }
  );

  const videoAggregate = Video.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const video = await Video.aggregatePaginate(videoAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  // console.log("Uploaded Files:", req.files); // Debugging multer's output

  const { title, description } = req.body;
  console.log(title, description);
  const videoFile = req.files?.videoFile?.[0].path; // Correct field name
  const thumbnail = req.files?.thumbnail?.[0].path; // Correct field name

  // console.log("Video File:", videoFile);
  // console.log("Thumbnail File:", thumbnail);

  const video = await uploadToCloudinary(videoFile);
  const thumb = await uploadToCloudinary(thumbnail);
  console.log(video, " and ", thumb);

  if (!video) {
    throw new ApiError(401, "video file is requied");
  }

  const publish = await Video.create({
    videoFile: video.secure_url,
    thumbnail: thumb.secure_url,
    owner: req.user._id,
    title,
    description,
    duration: 0, // Set dynamically later
    views: 0,
    likes: 0,
    isPublished: true,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "User is published video successfully", publish)
    );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  const video = await Video.findById(videoId);
  console.log(video.title);
  return res
    .status(200)
    .json(new ApiResponse(200, "video get successfully", video));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const { title, description, thumbnail } = req.body;
  let thumb;
  if (thumbnail) {
    const thumbnailPath = req.files?.thumbnail?.[0]?.path; // Corrected field name
    if (!thumbnailPath) {
      throw new ApiError(400, "Thumbnail file path is not found");
    }
    thumb = await uploadToCloudinary(thumbnailPath);
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        ...(thumb && { thumbnail: thumb.secure_url }), // Update only if thumb exists
      },
    },
    { new: true }
  );

  console.log("updated video details")
  return res.status(200).json(new ApiResponse(200,"video updated successfully",video))
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  const video = await Video.findByIdAndDelete(videoId)
  console.log("delete Video :)")
  return res.status(200).json(new ApiResponse(200,"video by Id is deleted!", video))
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
