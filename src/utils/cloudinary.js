import { v2 as cloudinary} from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();        

// Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

    const uploadOnCloudinary = async (localfilePath) => {
        try {
            if(!localfilePath) return null
            //UPLOAD TO CLOUDINARY
           const response = await cloudinary.uploader.upload(localfilePath,{
                resource_type: "auto",
            })
            //FILE HAS BEEN UPLOADED SUCCESSFULLY
            // console.log("FILE UPLOADED TO CLOUDINARY SUCCESSFULLY",response.url);
            fs.unlinkSync(localfilePath);//REMOVE THE LOCALSTORAGE FILE AS UPLOAD HAS BEEN SUCCESSFULL
            return response;


        }    
        catch (error) {
            fs.unlinkSync(localfilePath);//REMOVE THE LOCALSTORAGE FILE AS UPLOAD HAS BEEN FAILED
            return null;  

        }
    }

    export {uploadOnCloudinary}