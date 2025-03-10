import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (filepath) => {
  try {
    if (!filepath) return null;
    // upload to cloudinary
    const response = await cloudinary.uploader.upload(filepath, {
      resource_type: "auto", // resource_type should be "auto" to automatically detect the type of file
    });
    console.log("File has been uploaded to Cloudinary:", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(filepath); // remove the locally saved temporary file as the upload operation failed
    return null;
  }
};

export { uploadToCloudinary };
