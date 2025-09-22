
import Course from '../models/course.model.js';
import AppError from '../utils/error.utils.js';
import cloudinary from 'cloudinary';
import fs from 'fs/promises';

const getAllCourses = async  (req,res,next)=>{
    try {
        const courses = await Course.find({}).select("-lectures");
            if (courses.length === 0) {
              return res.status(200).json({
                success: true,
                message: "No course found",
                courses: [],
              });
            }

        res.status(200).json({
          success: true,
          message: "All Course",
          courses,
        });
    } catch (error) {
        return next(new AppError(error.message,500));
    }
};


const getLecturesByCourseId = async (req,res,next)=>{ 
       try {
         const { id } = req.params;
          
         const course = await Course.findById(id);
          
         if (!course) {
           return next(new AppError("Invalid Course Id", 500));
         }
         res.status(200).json({
          success : true,
          message : 'Course details',
          course
         })
         

          
    } catch(error) {
            return next(new AppError(error.message,500));
       }

};


const createCourse = async (req , res , next) =>{
   const {
    title ,
     description ,
     category ,
      createdBy,
      
    } = req.body;
   if(!title || !description || !category || !createdBy
   ){
        return next( new AppError('All feilds must be required',400));
   }

   const course = await Course.create({
    title,
    description,
    category,
    createdBy,
    thumbnail : {
        public_id : 'Dummy',
        secure_url : 'Dummy'
    }
   });
   
   if(!course){
    return next(new AppError('Course could not created , please try again',500));
   }

   if(req.file){
    const result = await cloudinary.v2.uploader.upload(req.file.path,{
        folder : 'lms'
    });
    if (result && result.public_id && result.secure_url) {
        course.thumbnail = {
          public_id: result.public_id,
          secure_url: result.secure_url,
        };
    }
    await fs.rm(`uploads/${req.file.filename}`);

   }
   await course.save();

   res.status(201).json({
    success : true,
    message : 'Course created successfully',
    course
   });


};


const updateCourse  = async (req,res,next) =>{

  try {
    const { id } = req.params;
    const course = await Course.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      {
        runValidators: true,
      }
    );
    if (!course) {
      return next(new AppError("Course with given Id does not exits ", 404));
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (e) {
    return next(new AppError(e.message,400))
  }


};


const removeCourse = async (req,res,next)=>{
  const {id} = req.params;
  const course = await Course.findById(id);
  if(!course){
    return next(new AppError('Course with the given Id does not exits',404));
  }

  await Course.findByIdAndDelete(id);
  res.status(200).json({
    success : true,
    message : 'Course removed successfully',

  });
};


const addLectureToCourseById = async (req,res,next)=>{
  //body me lecture ka title ,descriptiom destructure kro
    const {title,description}  = req.body;
    const {id} = req.params; //url se id get kro 
console.log(`title : ${title} , description : ${description}`);
    console.log(title,description,id);

    if(!title || !description){
       return next(new AppError('All fields must be required ',400));
    }//validate title and description


    const course = await Course.findById(id); //check valid id and get the data

    if(!course){ //check data exist or not

      return next(new AppError("Course with the given Id does not exits", 404));
  
    }

    //bcoz lecture data is inside nested we have to give it an format first
    const lectureData = {
      title,description,
    };

    //agr file/image/thumbnail send kiya h then cloudinary pe upload kro 
    if(req.file){
      console.log(req.file);
     try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
      });

      //console.log(JSON.stringify(result));

      if (result) { //agr cloudinary pe file upload hogyi h to 

        lectureData.lecture = { public_id : result.public_id, secure_url : result.secure_url};// and secure_url assign kro
      }
      fs.rm(`uploads/${req.file.filename}`);//file ka instance delete kro
     } catch (e) {
        return next(new AppError(e.message,500))
     }
    }

    course.lectures.push(lectureData); //now push the lecture data into lectures array
    course.numberOfLectures = course.lectures.length;
    await course.save();

    res.status(200).json({
      success : true,
      message : 'Lectures successfully added to the course',
      course
    })
}


const removeLectureFromCourseById = async (req,res,next)=>{
 try {
  const { courseId, lectureId } = req.params;
 

  if (!courseId || !lectureId) {
    return next(new AppError(" Missing courseId or LectureID !",400));
  }

  const course = await Course.findById(courseId);
   
  if (!course) {
    return next(new AppError("Invalid Course ID ", 404));
  }

  const lecture = course.lectures.id(lectureId);
  console.log(lecture);
  if (!lecture) {
    return next(
      new AppError("Lecture not found with the given lecture id", 404)
    );
  }

  //cloudinary se thumbnail remove kro if exists
  if (lecture.lecture?.public_id) {
    await cloudinary.v2.uploader.destroy(lecture.lecture?.public_id);
  }

  // Remove lecture
  course.lectures.pull(lectureId);
  course.numberOfLectures = course.lectures.length;

  await course.save();

  res.status(200).json({
    success: true,
    message: "lecture removed successfully",
    course,
  });
  
 } catch (e) {

    return next(new AppError(e.message,500));
 }
};


const getLectureFromCourseByLectureId = async (req,res,next)=>{

    try {
      const { courseId, lectureId } = req.params;

      if (!courseId || !lectureId) {
        return next(new AppError(" Missing courseId or LectureID !"));
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return next(new AppError("Invalid course Id", 404));
      }
      const lecture = course.lectures.id(lectureId);

      if (!lecture) {
        return next(new AppError("Invalid course Id", 404));
      }

      res.status(200).json({
        success: true,
        message: "successfully fetched the lecture!",
        lecture,
      });
    } catch (e) {
      return next(new AppError(e.message,500));
 
    }
    

}


const updateLectureToCourseByLectureId = async (req,res,next)=>{
  try {
    const { courseId, lectureId } = req.params;
    const {title,description} = req.body;

    if (!courseId || !lectureId) {
      return next(new AppError(" Missing courseId or LectureID !", 400));
    }

    if (!title || !description) {
      return next(new AppError(" all feilds must be required !", 400));
    }


    const course = await Course.findById(courseId);

    if (!course) {
      return next(new AppError("Invalid Course ID ", 404));
    }

    const lecture = course.lectures.id(lectureId);
    console.log(lecture);
    if (!lecture) {
      return next(
        new AppError("Lecture not found with the given lecture id", 404)
      );
    }

    console.log(lecture);

    lecture.title = title;
    lecture.description = description;

    if(req.file){
      if (lecture.lecture?.public_id) {
        await cloudinary.v2.uploader.destroy(lecture.lecture.public_id);
      }


      const result = await cloudinary.v2.uploader.upload(req.file.path,{
        folder : 'lms'
      });

        lecture.lecture.public_id = result.public_id;
        lecture.lecture.secure_url = result.secure_url;


        fs.rm(`uploads/${req.file.filename}`)

     

    }


    await course.save();

 

    res.status(200).json({
      success: true,
      message: "lecture details updated  successfully",
      course,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }

}


export {
  getAllCourses,
  getLecturesByCourseId,
  createCourse,
  updateCourse,
  removeCourse,
  addLectureToCourseById,
  removeLectureFromCourseById,
  updateLectureToCourseByLectureId,
  getLectureFromCourseByLectureId,
};

