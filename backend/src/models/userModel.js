import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const userSchema = new mongoose.Schema({
  name: {type: String,required: true},
  email: { type: String, unique: true,required: true},
  password: {type: String,required: true},
});

userSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

console.log(userSchema.methods.generateToken(),"+++++++++++++++++")

const useModel=mongoose.model("User", userSchema)
export {useModel,userSchema}
