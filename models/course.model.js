import { Schema, model } from "mongoose";
 

const courseSchema = new Schema(
  {
    title: {
      type: String,
      requred: [true, "Course is required"],
      trim: true,
      minLength: [8, "title should be atleast 8 Char long"],
      maxLength: [100, "title should be less than 100 char"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minLength: [8, "description must be atleast 8 char long"],
      maxLength: [200, "description must be less than 100 char"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    thumbnail: {
      public_id: {
        type: String,
        required: true,
      },
      secure_url: {
        type: String,
        required: true,
      },
    },
    lectures: [
      {
        title: {
          type: String,
          trim: true,
          required : true,
          minLength: [3, "length should be atleast 3 char long"],
        },

        description: {
          type: String,
          trim :true,
          reuired : true,
          minLength: [3, "length should be atleast 3 char long"],
        },
        lecture: {
          public_id: {
            type: String,
            required: true,
          },
          secure_url: {
            type: String,
            required: true,
          },
        },
      },
    ],

    numberOfLectures: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Course = model('Course',courseSchema);


export default Course;