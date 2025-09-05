// backend/src/core/middleware/successHandler.js
const successHandler = (req, res, next) => {
  res.success = (data = null, message = 'Success', statusCode = 200) => {
    const response = {
      success: true,
      message,
      ...(data && { data })
    };
    
    return res.status(statusCode).json(response);
  };
  
  next();
};

module.exports = successHandler;