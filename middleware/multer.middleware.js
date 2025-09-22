import multer from 'multer';
import path from 'path';

const upload = multer({
     
    
    limits : {filesize : 50*1024*1024},//50 mb file size
    storage : multer.diskStorage({
        destination : "uploads/",
        filename : (_req,file,cb)=>{
            cb(null , file.originalname)
        }
    }),
fileFilter : (_req,file,cb) =>{
    const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type !'), false);
  }
 
}
});


export default upload;