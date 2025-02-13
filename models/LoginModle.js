const mongoose = require("mongoose");

const LoginSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: 6, // Stronger password requirement
    },
  },
  {
    timestamps: true,
  }
);

const LoginUser = mongoose.model("LoginUser", LoginSchema);

module.exports = { LoginUser };
