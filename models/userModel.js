const mongodb=require('mongoose');
const mongoose=require('mongoose');

//create user schema

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
    },
    password:{
        type: String,
        required:true
    },
  
    },
    {
        timestamps:true,
    }
);

const User=mongoose.model('users', userSchema); //collection name users

module.exports=User;