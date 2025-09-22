import AppError from "../utils/error.utils.js";


const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next() );
  };
};

export default asyncHandler;
