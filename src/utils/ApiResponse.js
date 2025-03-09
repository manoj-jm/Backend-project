class ApiResponse {
  constructor(statusCode, message, data) {
    this.statusCode = statusCode<400 ? statusCode : 500;
    this.message = message;
    this.data = data;
    this.success = true;
  }
}

export { ApiResponse };
// What is the purpose of this file?
// This file is used to create a class that will be used to create a response object that will be sent back to the client. The response object will contain the status code, message, data, and a success flag. This class will be used to create a consistent response format for the API endpoints.
// What is the difference between the ApiResponse class and the ApiError class? 
// The ApiResponse class is used to create a response object that will be sent back to the client with a success flag set to true. The ApiError class is used to create an error object that will be sent back to the client with a success flag set to false. The ApiResponse class is used for successful responses, while the ApiError class is used for error responses.