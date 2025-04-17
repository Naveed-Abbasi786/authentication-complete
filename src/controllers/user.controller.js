import { User } from "../models/user.model.js";
import { ApiError } from "../utlis/apiError.js";
import { ApiResponse } from "../utlis/apiResponse.js";
import asyncHandler from "../utlis/asyncHandler.js";
import { sendVerificationCode, wellcomeEmail } from "../libs/mailsender.lib.js";

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

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!(fullName && email && password)) {
    throw new ApiError(400, "fullName, email, and password are required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Email is not valid");
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(408, "User already exists");
  }

  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  const expiry = new Date(Date.now() + 40 * 1000); // 30 seconds expiry for testing

  const user = await User.create({
    fullName,
    email,
    password,
    verificationCode: verificationCode,
    verificationCodeExpires: expiry,
  });

  const createdUser = await User.findById(user._id).select("-password");

  await sendVerificationCode(user.email, verificationCode);

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: createdUser },
        "User Registered Successfully"
      )
    );
});

const verifyUser = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    throw new ApiError(402, "Verification code is required");
  }

  const numericCode = Number(code);
  if (isNaN(numericCode)) {
    throw new ApiError(400, "Verification code must be a number");
  }

  const user = await User.findOne({ verificationCode: numericCode });

  if (!user) {
    throw new ApiError(403, "Invalid or expired verification code");
  }

  // Check expiry
  if (
    user.verificationCodeExpires &&
    user.verificationCodeExpires < new Date()
  ) {
    throw new ApiError(
      410,
      "Verification code has expired. Please request a new one."
    );
  }

  if (user.isVerified) {
    throw new ApiError(409, "User is already verified");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);
  // Mark as verified
  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  user.refreshToken = refreshToken;
  await user.save();

  // Generate tokens

  // Set tokens in cookies
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  // Send welcome email
  await wellcomeEmail(user.email, user.fullName);

  // Cleaned user data
  const userData = await User.findById(user._id).select("-password -refreshToken");

  // Send response
  return res
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          user: userData,
          accessToken,
          refreshToken,
        },
        "Email verified successfully"
      )
    );
});

const resendOtp = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(404, "Email is missing");
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      throw new ApiError(403, "User is not found");
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const expiry = new Date(Date.now() + 30 * 1000);

    // ✅ Update existing user
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = expiry;
    await user.save({ validateBeforeSave: false });

    await sendVerificationCode(user.email, verificationCode);

    return res
      .status(200)
      .json(
        new ApiResponse(200, { verificationCode }, "Resent OTP verification")
      );
  } catch (error) {
    console.log(error);
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "User name or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  console.log("isPasswordValid", isPasswordValid);
  console.log("passwrd", password);
  console.log("db", user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User LoggedIn successfully"
      )
    );
});


const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully"));
});

const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is Expired");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accesToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Acces token refresh"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message);
  }
});



export { registerUser, verifyUser, resendOtp, login ,logout,refreshToken};
