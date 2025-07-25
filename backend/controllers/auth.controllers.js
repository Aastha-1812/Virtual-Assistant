import User from "../models/user.models.js";
import bcrypt from "bcryptjs";
import genToken from "./token.js";

export const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existEmail = await User.findOne({ email });
    if (existEmail) {
      return res
        .status(400)
        .json({ message: "A user with email already exists" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be greater than 6 characters" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      password: hashedPassword,
      email,
    });

    const token = await genToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, //days*hrs*mins*secs*millisec  the time for which the token would be stored in the ccokie.
      sameSite: "None", //The cookie will  only be sent in requests originating from the same site.
      secure: true,
    });
    return res.status(201).json(user);
  } catch (error) {
    return res.status(400).json({ message: `error in sign up ${error}` });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "A user with this email does not  exists" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect Password" });
    }

    const token = await genToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, //days*hrs*mins*secs*millisec  the time for which the token would be stored in the ccokie.
      sameSite: "None", //The cookie will not only be sent in requests originating from the same site.
      secure: true,
    });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ message: `error in login ${error}` });
  }
};

export const logOut = (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "Log out successfull" });
  } catch (error) {
    return res.status(400).json({ message: `error in log out  ${error}` });
  }
};
