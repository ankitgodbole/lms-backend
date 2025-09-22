import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// 🧾 User Schema
const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Name is required"],
      minLength: [5, "Name must be at least 5 characters"],
      maxLength: [50, "Name must be less than 50 characters"],
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email must be unique"],
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password should be at least 8 characters long"],
      select: false, // by default, password DB se fetch nahi hoga (security)
    },

    avatar: {
      public_id: { type: String },
      secure_url: { type: String },
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },

    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    subscription :{
        id : String,
        status : String
    }
  },
  {
    timestamps: true, // automatically add createdAt and updatedAt
  }
);

//
// 🔒 Password Hashing Middleware
// Jab bhi password change hoga, to hash ho jaayega
//
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // agar password modify nahi hua, skip
  this.password = await bcrypt.hash(this.password, 10); // hash the password
  next();
});

//
// 🧠 Custom Methods for the User Schema
//
userSchema.methods = {
  // JWT Generate method - login ke baad token banega
  generateJWTToken: function () {
    return jwt.sign(
      {
        id: this._id,
        email: this.email,
        role : this.role
      },
      
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRY, // example: "7d"
      }
    );
  },

  // Password Compare method - login ke time compare karne ke liye
  comparePassword: async function (plaintextPassword) {
    return await bcrypt.compare(plaintextPassword, this.password);
  },

  // Reset Password Token Generate method - forgot password ke liye
  generatePasswordResetToken: async function () {
    const resetToken = crypto.randomBytes(20).toString("hex"); // plain token

    // plain token ko hash karke store karenge (security reason)
    this.forgotPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token ki expiry 15 minutes
    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000;

    return resetToken; // plain token user ko bhejna hota hai email mein
  },
};

// 🏁 Create and export the User model
const User = model("Users", userSchema);
export default User;
