import mongoose from "mongoose";

mongoose.set(
    'strictQuery',false
);
//"mongodb+srv://ankitgodbole:ANKa123%40@cluster0.2beflit.mongodb.net/lms";
//  ||
const connectionToDB = async ()=>{
   try{ const { connection } = await mongoose.connect(
     "mongodb://localhost:27017/lms"
   );
    if(connection){
        console.log(`connected to MongoDB:${connection.host}`)
    }} catch(err){
         console.log(err);
         process.exit(1);
    }
}
 
export default connectionToDB;