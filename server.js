import app from './app.js';
import {config } from 'dotenv';
import cloudinary from 'cloudinary';
import connectionToDB from './config/dbConnection.js';
import Razorpay from 'razorpay';
config();

const PORT = process.env.PORT || 3004;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


app.listen(PORT , ()=>{
  connectionToDB();
  console.log(`App is running at http://localhost:${PORT}`);
})


