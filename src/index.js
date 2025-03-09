// require("dotenv").config();
import dotenv from "dotenv";
dotenv.config();
// import express from "express";
import connectDB from "./db/index.js";
import { app } from "./app.js";
connectDB()
  .then(() => {
    try {
      app.on("error", (err) => {
        console.log("Server Crashed", err);
      });
      app.listen(process.env.PORT || 5000, () => {
        console.log(`Server is running on port ${process.env.PORT || 5000}`);
      });
    } catch (error) {
      console.log(`Server is not running due to ${error}`);
    }

    
    
  })
  .catch((err) => {
    console.log(" MONGO DB CONNECTION FAILED", err);
  });
