import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
  {
    fileName: {
      type: String, // cloudinary url
      required: true,
      unique: true,
    },
    thumbnail: {
      type: String, // cloudinary url
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    duration: {
      type: Number,
      default: 0,
      required: true,
    },
    views: {
      type: String,
      default: 0,
      required: true,
    },
    likes: {
      type: Number,
      default: 0,
      required: true,
    },
    isPublished: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
