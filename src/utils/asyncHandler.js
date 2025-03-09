const asyncHandler = (requesHandler) => {
  return (req,res,next)=> {
    Promise.resolve(requesHandler(req,res,next)).catch((err)=>next(err));
  }
}

export { asyncHandler };

// what is the neccesary that we wrapping the async function in a Promise.resolve()?
// The purpose of wrapping the async function in a Promise.resolve() is to ensure that any errors that occur in the async function are caught and passed to the next() function. This allows us to handle errors in the async function using the catch() method and pass them to the error handling middleware.

// why we can't use try catch here ? 
// The try...catch block is used to handle synchronous errors, but it cannot be used to catch errors that occur in asynchronous code.
//When an error occurs in an asynchronous function, it is not caught by the try...catch block and needs to be handled using the catch() method of the Promise object.
