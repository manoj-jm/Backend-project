// controllers ? why ? - because we are going to handle the request and response here and we are going to call the services from here. logic will be here.

import {asyncHandler} from "../utils/asyncHandler.js"; 

// it going to get called when user hit a route "registerUser"
const registerUser = asyncHandler(async (req, res) => { 
   res.status(200).json({
    message: "ok",
  });
   
});


export {registerUser};