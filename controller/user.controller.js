import User from "../models/user.models.js";
import AppError from "../utils/error.utils.js";
import cloudinary from "cloudinary";
import fs from "fs";
import sendEmail from "../utils/sendmail.utils.js";
import crypto from "crypto";

const cookieOptions = {
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};



const register = async (req, res, next) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return next(new AppError("All fields are required", 400));
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new AppError("Email already exists"), 400);
  }
  const user = await User.create({
    fullName,
    email,
    password,
    avatar: {
      public_id: email,
      secure_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    },
  });

  if (!user) {
    return next(new AppError("User registration failed,please try agian"));
  }

  //TODO : FILE UPLOAD

  if (req.file) {
    console.log(req.file);
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
        width: 250,
        height: 250,
        gravity: "faces",
        crop: "fill",
      });

      if (result) {
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;

        fs.rm(`uploads/${req.file.filename}`, () => {
          console.log("file removed successfully");
        });
      }
    } catch (e) {
      return next(
        new AppError(e || "File not uploading failed , please try again", 400)
      );
    }
  }

  await user.save();

  user.password = undefined;

  const token = await user.generateJWTToken();

  res.cookie("token", token, cookieOptions);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user,
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("All fields are mandatory", 400));
    }

    const user = await User.findOne({ email }).select("+password");
    console.log(user);

    if (!user) {
      return next(new AppError("Email or password is not matched", 400));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      return next(new AppError("Email or password is not matched", 400));
    }

    const token = user.generateJWTToken();
    user.password = undefined;

    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const logout = (req, res, next) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      secure: true, // only over HTTPS
      sameSite: "None", // if frontend is on different domain/port
      expires: new Date(0), // Expire immediately
    });

    return res.status(200).json({
      success: true,
      message: "User logged out successfully!",
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      message: "User details",
      user,
    });
  } catch (e) {
    return next(new AppError("Failed to fetch user details", 500));
  }
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError("Email is required", 400));
  }
  const user = await User.findOne({ email });
  if (!user) {
    return next(
      new AppError("Email is not register ! please signup first", 400)
    );
  }
  const resetToken = await user.generatePasswordResetToken();
  await user.save();

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/api/v1/user/reset-password/${resetToken}`;
  const subject = "Reset Password";
  const msg = `
   You can reset your password by clicking 
   <a href="${resetPasswordUrl}" target="_blank">Reset Password</a> 
   <br><br>
   If the above link doesn't work, copy & paste this link in your browser: <br> 
   ${resetPasswordUrl} <br><br>
   If you didn’t request a password reset, you can safely ignore this email.
 `;

  try {
    await sendEmail(email, subject, msg);
    res.status(200).json({
      success: true,
      message: `reset link sent successfully at email: ${email}`,
    });
  } catch (e) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    return next(new AppError(e.message, 400));
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { resetToken } = req.params; //plain token from url
    const { password } = req.body; //new password
    if (!resetToken) {
      return next(new AppError("Token is missing", 400));
    }
    if (!password) {
      return next(new AppError("Password is missing", 400));
    }
    //then we will hash the plain token
    const forgotPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      forgotPasswordToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError("Invalid or Expired Token", 400));
    }

    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save();
    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (e) {
    return next(new AppError(e.message, 400));
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { id } = req.user;

    if (!oldPassword || !newPassword) {
      return next(new AppError("All fields are mandatory", 400));
    }

    const user = await User.findById(id).select("+password");
    if (!user) {
      return next(new AppError("User does not exist", 400));
    }

    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      return next(new AppError("Invalid old password", 400));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return next(new AppError(error.msg, 400)); // Proper error handling
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { fullName } = req.body;
    const id = req.user.id;
    console.log(id);

    const user = await User.findById(id);
    if (!user) {
      return next(new AppError("User does not exist", 400));
    }

    // update fullName
    if (fullName) {
      user.fullName = fullName;
    }

    // update avatar if file uploaded
    if (req.file) {
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
          width: 250,
          height: 250,
          gravity: "faces",
          crop: "fill",
        });

        if (result) {
          // destroy old avatar after new upload is successful
          if (user.avatar?.public_id) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);
          }

          user.avatar.public_id = result.public_id;
          user.avatar.secure_url = result.secure_url;

          fs.rm(`uploads/${req.file.filename}`, () => {
            console.log("Temp file removed successfully");
          });
        }
      } catch (e) {
        return next(new AppError("File upload failed, please try again", 400));
      }
    }

    await user.save();
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: "User details updated successfully!",
      user,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};


export {
  register,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  updateUser,
};
