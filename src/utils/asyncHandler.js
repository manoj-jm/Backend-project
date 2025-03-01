const asyncHandler = (requesHandler) => {
  (req,res,next)=> {
    Promise.resolve(requesHandler(req,res,next)).catch((err)=>next(err));
  }
}

export { asyncHandler };

// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.status || 500).json({
//       success: false,
//       message: error.message || "Something went wrong",
//     });
//   }
// };
