const mongoose=require('mongoose');

const otpSchema=new mongoose.Schema({
 email:{
    type:String,
    required:true,
    trim:true
 },
 otp:{
    type:String,
    required:true
 }
},{
   timestamps:true,
}
);

const OPT=mongoose.model('otps', otpSchema);
module.exports= OPT;