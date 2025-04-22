import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "fullName is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
      minlength: [6, "Password must be at least 6 characters long"],
    }
  ,    
    isVerified:{
      type:Boolean,
      default:false
    },
    verificationCode: {
      type: Number,
  },
  verificationCodeExpires: {
    type: Date,
  },
  refreshToken:{
    type:String
  }
  
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {

  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});




// ✅ Password check method
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
      { expiresIn: '1h' }
    );
  };
  
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
      { _id: this._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '1d' }
    );
  };

  

export const User = mongoose.model("User", userSchema)