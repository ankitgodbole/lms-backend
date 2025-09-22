import { Router } from "express";
import { addLectureToCourseById, createCourse, getAllCourses,  getLectureFromCourseByLectureId,  getLecturesByCourseId, removeCourse, removeLectureFromCourseById, updateCourse, updateLectureToCourseByLectureId} from '../controller/course.controller.js'
import {authorizeRoles, isLoggedIn} from '../middleware/auth.middleware.js'
import upload from "../middleware/multer.middleware.js";

const router = new Router();

router.route('/')
.get(getAllCourses)
.post(isLoggedIn,
    authorizeRoles('ADMIN'),
    upload.single('thumbnail'),
    createCourse)


;


router
  .route("/:id")
  .get(isLoggedIn,authorizeRoles("ADMIN","USER") ,getLecturesByCourseId)
  .put(isLoggedIn, authorizeRoles("ADMIN"), updateCourse)
  .delete(isLoggedIn, authorizeRoles("ADMIN"), removeCourse)
  .post(
    isLoggedIn,
    authorizeRoles("ADMIN"),
    upload.single("lecture"),
    addLectureToCourseById
  )
  ;

  router
    .route("/:courseId/lectures/:lectureId")
    .delete(isLoggedIn, authorizeRoles("ADMIN"), removeLectureFromCourseById)
    .get(isLoggedIn, authorizeRoles("ADMIN"), getLectureFromCourseByLectureId)
    .put(isLoggedIn, authorizeRoles("ADMIN"), updateLectureToCourseByLectureId);

export default router;

