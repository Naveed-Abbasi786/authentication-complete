import { User } from "../models/user.model.js";
import { ApiError } from "../utlis/apiError.js";
import { ApiResponse } from "../utlis/apiResponse.js";
import asyncHandler from "../utlis/asyncHandler.js";
import SendVerificationCode from "../libs/mailsender.lib.js";

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password } = req.body;
  
    if (!(fullName && email && password)) {
      throw new ApiError(400, "fullName, email, and password are required");
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Email is not valid");
    }
  
    const existedUser = await User.findOne({
      $or: [{ email }],
    });
  
    if (existedUser) {
      throw new ApiError(408, "User already exists");
    }
  
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({ fullName, email, password, verificationCode });
  
    const createdUser = await User.findById(user._id).select("-password");

    
  
   await SendVerificationCode(user.email, verificationCode);

   
      return res
      .status(201)
      .json(new ApiResponse(201, {user:createdUser,
  
      } ,"User Registered Successfully"));

});


export { registerUser };



const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};
