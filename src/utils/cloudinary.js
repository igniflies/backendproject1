import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"


    // Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath)=>{
    try{
        if(!localFilePath) return null
        //upload file on cloudinary
        const response =await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file has been uploaded successfully
        //console.log("File is uploaded on Cloudinary",respone.url);
        fs.unlinkSync(localFilePath)
        return response;
    }catch(error){
        if(fs.existsSync(localFilePath)){
            fs.unlink(localFilePath);
        }
        console.error('Error uploading on coludinary:',error);//it will remove the locally saved temp file as the upload operation got failed
        return null;
    }
}
export {uploadOnCloudinary}