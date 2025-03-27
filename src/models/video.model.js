import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
  {
    videoFile: { // vedio file 
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

videoSchema.plugin(mongooseAggregatePaginate); // what is this? 
// mongooseAggregatePaginate is a plugin that adds a paginate method to the Model that uses the aggregate function to get the data. This is useful when you need to get the total count of documents that match the query. 

export const Video = mongoose.model("Video", videoSchema);
