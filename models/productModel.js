const { default: mongoose } = require('mongoose');
const mongodb=require('mongoose');
const { type } = require('os');

//====create schema===========
const productSchema=new mongoose.Schema({
    discount:Number, // discount is optional
    company:String, //// discount is optional
    title:{
        type:String,
        required:true,
    },
    price:{
        type:Number,
        min:1,
        required:true,
    },
    // stock:{
    //     type:String,
    //     enum:['in-stock','out-of-stock'],
    //     default:'in-stock'
    // },
    quantity:{
        type:Number,
        default:1,
        min:0,

    },
    thumbnail:{
        type:String,
        
    }
},{
    timestamps:true,
});
//===create model===========

const Product=mongoose.model('products',productSchema); //products here is name of collection frpm moongoes database

module.exports=Product;