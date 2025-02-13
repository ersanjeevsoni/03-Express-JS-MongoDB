const nodemailer=require('nodemailer');

const transporter=nodemailer.createTransport({
    service: "gmail",
    host:"smtp.gmail.com",
    auth:{
        user:"ersanjeevsoni@gmail.com",
        pass:process.env.EMAIL_ACCOUNT_PASSWORD, // just not pass directly password
        // pass:"hnihsodkaumulrqa",
    }
});

const sendEmail = async (email, otp) => {
    const info = {
        from: "ABES-Canteen", // sender address
        to:email, // list of receivers
        subject: "OTP verification ABES Canteen", // Subject line
        html: `
        <div>
        <p>Securtiy mail from ABES Canteen</p>
        <h4>${otp}</h4>
        <p>&copy; ABES- Canteen</p>
        </div>`, // html body
    };
    try{
        const resp = await transporter.sendMail(info);
        console.log("Message sent: %s", resp.messageId);
        return true;
    }
    catch(err){
        console.log(err.message);
        return false;
        
    }
};

module.exports={sendEmail};