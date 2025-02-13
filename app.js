require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
require('./config/dbConfig.js'); //require helps to run line by line
const Product = require('./models/productModel.js'); // fetch product from this file
const User = require('./models/userModel.js');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { sendEmail } = require('./utils/emailHelper.js');
const OTP = require('./models/otpModel.js');
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");


const app = express();

// written code for middleware and install morgan
app.use((req, res, next) => {
  console.log("--> Request received", req.url);
  next();
});
//middleware-----------
//allow communication between frntend and backend
app.use(cors({
  credentials: true,
  origin: "http://localhost:5173",
}));
//=================
app.use(morgan());
//===============to read code
app.use(express.json());


// app.get('api/v1/prodcuts',(req,res)=>{
//     res.send('Welcome to the server!');
// });

//READ Operation - to get the products in postman api handler
// applid some filter too based on size, letter and page
app.get("/api/v1/products", async (req, res) => {
  try {
    //search on mongoose for sorting documentation
    const { q = "", size = 12, page = 1 } = req.query;
    console.log(size);

    console.log("query=", q);
    const productsQuery = Product.find(); // find the item
    if (q.length >= 0) {
      const reg = new RegExp(q, "i");
      console.log(reg);
      productsQuery.where('title').regex(reg);
    }
    //sortying by price and tile in descedning order
    productsQuery.sort("price -title");
    // to get proper count
    const productsQueryClone = productsQuery.clone();
    // sorting using pagination
    productsQuery.skip((page - 1) * size);
    productsQuery.limit(size);
    const data = await productsQuery;
    // to find total products
    const totalProducts = await productsQueryClone.countDocuments();
    res.status(200).json({
      status: "product added successfully",
      data: {
        products: data
      }
    })
  } catch (err) {
    console.log("error!", err.message);

    res.status(500).json({
      status: "fail",
      message: "Internet Server Error"
    })
  }
});

// OTP Model Schema Post

app.post("/api/v1/otps", async (req, res) => {
  try {
    const { email } = req.body;
    //email is required
    console.log(email);
    if (email && email.length > 0) {
      // otp is not sent on this email at least in last 3 times
      const otp = Math.floor(Math.random() * 9000 + 1000);
      const isMailSent = await sendEmail(email, otp);
      if (isMailSent) {
        const hashedOtp = await bcrypt.hash(otp.toString(), 14);
        await OTP.create({ email, otp: hashedOtp })
        res.status(201).json({
          status: 'success',
          message: 'otp sent'
        })
      }
      else {
        res.status(500).json({
          status: 'success',
          message: 'unabel to send the mail'
        })
      }
    }
    else {
      res.status(400).json({
        statusL: 'fail',
        message: 'email is required'
      })
    }
  } catch (err) {
    console.log(err.name);
    console.log(err.code);
    console.log(err.message);
    if (err.code == 11000 || err.name === "ValidationError") {
      res.status(400).json({
        status: "fail",
        message: "Data validataion failed" + err.message,
      })
    }
    else {
      res.status(500).json({
        status: "fail",
        message: "Internet Server Error"
      })
    }


  }
});


// userSchema Post
app.post('/api/v1/users', async (req, res) => {
  try {
    // const userInfo = req.body;
    const { otp, email, password } = req.body;
    if (!otp || !email || !password) {
      res.status(400).json({
        status: "fail",
        message: "Email, otp and passoword is required"
      });
      return;
    }
    //TODO: if email is already is exist in the user collection(have to handel this case self)

    //otp that is sent within last 3 minutes
    //mongodb way to sort the data
    const otpDoc = await OTP.findOne({
      createdAt: {
        $gte: Date.now() - (10 * 60 * 1000), // we need or require 3 mints before time rather than current time so subtract 3mint to current time and conver into second to mili seconds
      },
      email: email,
    });

    //mongoose way to sort the data
    /*  const otpDoc = await OTP.findOne()
     .where("createdAt")
     .gte(Date.now() - 10 * 60 * 1000)
     .where("email")
     .equals(email); */

    // res.json(otpDoc);
    if (otpDoc === null) {
      res.status(400);
      res.json({
        statusbar: "fail",
        message: "Either otp has expired or was not sent!",
      });
      return;
    }
    const hashedOtp = otpDoc.otp;
    const isOtpValid = await bcrypt.compare(otp.toString(), hashedOtp);
    if (isOtpValid) {
      const salt = await bcrypt.genSalt(14);
      const hashedPasswrod = await bcrypt.hash(password, salt);
      const newUser = await User.create({
        email,
        password: hashedPasswrod,
      });
      res.status(201);
      res.json({
        status: "success",
        message: "User created"
      })
    }
    else {
      res.status(401);
      res.json({
        status: "fail",
        message: "Incorrect OTP",
      });
    }
  } catch (err) {
    console.log("user not found", err._message, err);
    if (err.name === "ValidationError") {
      res.status(400).json({
        status: "fail",
        message: "Data validataion failed" + err.message,
      })
    }
    else {
      res.status(500).json({
        status: "fail",
        message: "Internet Server Error"
      })
    }
  }
})
//LoginSchema

app.post("/api/v1/login", async (req, res) => {
  try {
    const { email, password: plainPassword, } = req.body;
    const currentUser = await User.findOne({ email: email });
    if (currentUser) {
      // doing destructering using diffrent name so that both password will not clash
      const { _id, username, password: hashedPasswrod } = currentUser;
      //now compare password using bcrypt which is used for hashing
      const isPasswordCorrect = await bcrypt.compare(plainPassword, hashedPasswrod);
      if (isPasswordCorrect) {
        const token = jwt.sign(
          {
            email,
            username,
            _id,

          },
          "this_is_a_very_long_secret_key_abcs_123",
        );

        res.cookie("authorized_token", token, {
          httpOnly: true,
          sameSite: "none",
          secure: true
        });
        res.status(200);
        res.json({
          status: "success",
        });
      }
      else {
        res.status(401);
        res.json({
          status: 'fail',
          message: "Email or Password is invalid!"
        })
      }
    }
    else {
      res.status(400);
      res.json({
        status: "'fail",
        message: "User is not registered!"
      });
      return;
    }
  }
  catch (err) {
    console.log(err);
    console.log(err.code);
    console.log(err.message);
    res.status(500).json({
      status: "fail",
      message: "Internal Server Error"
    })
  }
})

// this one is also middleware to provide protection
app.use(cookieParser());
//creating another middleware wich one reads tokens and do further action
app.use((req, res, next) => {
  const { authorized_token } = req.cookies;
  jwt.verify(authorized_token, "this_is_a_very_long_secret_key_abcs_123", (error, decoded) => {
    if (error) {
      res.status(401);
      res.json({
        status: "fail",
        message: "Unauthorized"
      });
      return;
    }
    req.userInfo = decoded; // it is not important 
    next();
  });

})

// isLoggedIn API

app.get("/api/v1/isLoggedIn", (req, res) => {
  res.status(200);
  res.json({
    status: "success",
    data: req.userInfo,
  })
})

// Product Schema Post
app.post('/api/v1/products', async (req, res) => {
  const newProduct = req.body;
  try {
    const doc = await Product.create(newProduct); // Product is from productModeljs so import it
    res.status(201);
    res.json({
      status: "success",
      data: doc,
    })
  } catch (err) {
    console.log("product not found", err._message, err);
    if (err.name === "ValidationError") {
      res.status(400).json({
        status: "fail",
        message: "Data validataion failed"
      })
    }
    else {
      res.status(500).json({
        status: "fail",
        message: "Internet Server Error"
      })
    }
  }

});

// get method to fetch user data on postman api handler
/* app.get('/api/v1/users',async(req,res)=>{

  try{
    const userInfo=await reg.body;
    console.log(userInfo);
    
  }catch(err){
    console.log("wrong user data", err.message);
    
  }

}); */

app.listen(1500, () => {
  console.log("server is active!");

});