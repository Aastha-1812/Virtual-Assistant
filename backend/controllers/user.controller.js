import uploadCloudinary from "../config/cloudinary.js";
import geminiResponse from "../gemini.js";
import User from "../models/user.models.js";
import moment from "moment";

const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ message: "get current user error" });
  }
};

export const updateAssistant = async (req, res) => {
  try {
    const { assistantName, imageUrl } = req.body;
    let assistantImage;
    if (req.file) {
      //if a user uploads a file then imageUrl would be empty but re.file will have so ething . this is if the user uploads the file from its own pc and then will upload it on cloudinary using multer .
      assistantImage = await uploadCloudinary(req.file.path); //returns a url
    } else {
      //if the image uploaded is from the default 7 images
      assistantImage = imageUrl;
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        assistantName,
        assistantImage,
      },
      { new: true }
    ).select("-password");
    res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ message: "update assistant error" });
  }
};

export const askToAssistant = async (req, res) => {
  try {
    const { command } = req.body;
    const user = await User.findById(req.userId);
    user.history.push(command);
    user.save();
    const userName = user.name;
    const assistantName = user.assistantName;
    const result = await geminiResponse(command, assistantName, userName);
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonMatch = text.match(/{[\s\S]*}/);

    if (!jsonMatch) {
      return res.status(400).json({ response: "sorry , i can't understand" });
    }
    const gemResult = JSON.parse(jsonMatch[0]);
    console.log(gemResult);
    const type = gemResult.type;

    switch (type) {
      case "get-date":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `current date is ${moment().format("YYYY-MM-DD")}`,
        });
      case "get-time":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `current time is ${moment().format("hh:mm A")}`,
        });
      case "get-day":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `today is ${moment().format("dddd")}`,
        });
      case "get-month":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `today is ${moment().format("MMMM")}`,
        });
      case "general":
      case "google-search":
      case "youtube-search":
      case "youtube-play":
      case "calculator-open":
      case "instagram-open":
      case "facebook-open":
      case "weather-show":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: gemResult.response,
        });

      default:
        return res.json({ response: "I didn't understand the command" });
    }
  } catch (error) {
    return res.status(500).json("ask assistant error");
  }
};

export default getCurrentUser;
