import bcrypt from "bcryptjs";
import {useModel,userSchema} from "../models/userModel.js"; 
import jwt from "jsonwebtoken";
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
      console.log(req.body)
    let user = await useModel.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    let x=new useModel({ name, email, password: hashedPassword })
    console.log(x)
    await x.save()
    let f=jwt.verify(x.generateToken(), process.env.JWT_SECRET)
    console.log(f,"-------")
    res.status(201).json({
      message: "User registered successfully",
      token:userSchema.methods.generateToken() ,
      user
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server error", error });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await useModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      token: user.generateToken(),
      user
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export const getProfile = async (req, res) => {
  try {
    const user = req.user; // The `protect` middleware should attach `user` to `req`
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
