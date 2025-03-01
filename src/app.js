// why this file ? - This is the entry point of the application. This is the first file that gets executed when the application starts.
// What is the purpose of this file ? - This file is used to import all the necessary files and start the server.

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin:process.env.CORS_ORIGIN
}));

app.use(express.json({
  limit:"20kb"
}));//To parse the incoming requests with JSON payloads

// when data is coming via url : then i need to configure the express to parse the data from the url
app.use(express.urlencoded({
  extended:true
}));//To parse the incoming requests with urlencoded payloads
app.use(express.static("public"));//To serve static files

app.use(cookieParser()); //To parse the incoming requests with cookies 






export {app};