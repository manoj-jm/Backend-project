import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const connectionInstant = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );
    console.log(
      `MongoDB connected!! DB host  : ${connectionInstant.connection.host}`
    );
  } catch (err) {
    console.error("Error: ", err);
    process.exit(1);
  }
};

export default connectDB;
