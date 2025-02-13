const mongoose=require('mongoose');

const connectDB=async(req,res)=>{
    try{
    await mongoose.connect(`mongodb+srv://firstdb:abes@cluster0.ygpjc.mongodb.net/abes_tot_db?retryWrites=true&w=majority&appName=Cluster0`);
    console.log("==db connected==");
    
    }catch(err){
        console.log("Error in DB Connection", err.message);
        res.json({
            status:"falied db"
        });
        
    }
}
connectDB();