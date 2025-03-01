class ApiResponse {
  constructor(statusCode, message, data) {
    this.statusCode = statusCode<400 ? statusCode : 500;
    this.message = message;
    this.data = data;
    this.success = true;
  }
}