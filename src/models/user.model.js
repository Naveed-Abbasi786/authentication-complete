import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
const userSchema = new Schema(
  {
    fullName: {
      type: String,
      requied: [true, "fullName is required"],
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      requied: [true, "email is required"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      requied: [true, "password is required"],
      lowercase: true,
      trim: true,
    },
    refreshToken: {
      type: String,
    },
    isVerified:{
      type:Boolean,
      default:false
    },
    verificationCode: {
      type: Number,
      required: true
  }
  
  },
  { timestamps: true }
);

userSchema.pre("save",async function (next) {
    if(!this.isModified("password")) return next()
        this.password=await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
  };
  

  // 🔐 Generate Access Token
// user.model.js
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
      {
        _id: this._id,
        email: this.email,
        userName: this.userName,
        fullName: this.fullName,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1m' }
    );
  };
  
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
      { _id: this._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '1d' }
    );
  };

  

export const User = mongoose.model("user", userSchema)