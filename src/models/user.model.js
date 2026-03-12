import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const useerSchema = new Schema({
  username:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
    index:true,
  },
  email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
    
  },
  fullName:{
    type:String,
    required:true,
    trim:true,
    index:true,
  },
  avatar:{
    type:String,
    required:true,
  },
   coverImage:{
    type:String,
  },
  watchHistroy:{
    type:Schema.Types.ObjectId,
    ref:"Video"
  },
  password:{
    type:String,
    required:[true,'Password is Required'],
  },
  refToken:{
    type:String,
  }
},{
    timestamps:true,
})

useerSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
    
})
useerSchema.methods.isPasswordCorrect = async function
(password){
return await bcrypt.compare(password, this.password);
}

useerSchema.methods.generateAccessToken = function(){
    return jwt.sign({id:this._id,
                    email:this.email,
                    username:this.username,
                    fullName:this.fullName
    }, 
    process.env.ACESS_TOKEN_SECRET,
     {
        expiresIn:process.env.Access_Token_Expiry
    }

)
}
useerSchema.methods.generateRefreshToken = function(){
    return jwt.sign({id:this._id}, process.env.REFRESH_TOKEN_SECRET, {expiresIn:process.env.Refresh_Token_Expiry})
}

export const User = mongoose.model("User",useerSchema)