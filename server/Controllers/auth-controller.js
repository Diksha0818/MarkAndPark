const bcrypt = require("bcrypt");
const User = require("../model/user-model");
const { generateToken } = require("../middlewares/authMiddleware");
const chalk = require("chalk");
const {
  generateOTP,
  sendOTPEmail,
  storeOTP,
  verifyOTP,
} = require("../utils/nodemailer");

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Error fetching user details" });
  }
};

const home = async (req, res) => {
  try {
    res.status(200).send("Welcome to the Authentication API");
  } catch (err) {
    console.log("Error in home route:", err);
    res.status(500).send("Server Error");
  }
};

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOTP(); // Generate OTP

    storeOTP(email, otp); // Store OTP with expiration
    await sendOTPEmail(email, otp); // Send OTP email

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

// const register = async (req, res) => {
//   try {
//     console.log("Request body:", req.body);

//     const { name, email, aadharNumber, password } = req.body;

//     // Ensure all required fields are provided
//     if (!name || !email || !aadharNumber || !password) {
//       console.log(chalk.red("All fields are required"));
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     // Check if the user already exists with the given email
//     console.log("Checking if user exists with email:", email);
//     const userExist = await User.findOne({ email });

//     if (userExist) {
//       console.log(chalk.red("User already exists with this email"));
//       return res.status(400).json({ error: "User already exists" });
//     }

//     // Check if the user already exists with the given Aadhar number
//     const aadharExist = await User.findOne({ aadharNumber });
//     if (aadharExist) {
//       console.log(chalk.red("Aadhar number already registered"));
//       return res
//         .status(400)
//         .json({ error: "Aadhar number already registered" });
//     }

//     // Hash the password before storing it
//     const salt = await bcrypt.genSalt();
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create a new user document
//     const user = await User.create({
//       name,
//       email,
//       aadharNumber,
//       password: hashedPassword,
//     });

//     if (!user) {
//       return res.status(400).json({
//         error: "Failed to register user, please enter details properly.",
//       });
//     }

//     // User registration successful
//     console.log("User created:", user);

//     // Generate token
//     const token = generateToken(user);

//     res.status(201).json({
//       message: "User registered successfully",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         aadharNumber: user.aadharNumber,
//       },
//       token,
//     });
//   } catch (err) {
//     console.log("Error during registration:", err);
//     res.status(500).json({ error: "Server Error" });
//   }
// };
const register = async (req, res) => {
  try {
    console.log("Request body:", req.body);

    const { name, email, password, phone, otp } = req.body;

    // Check if OTP is correct and not expired
    if (!verifyOTP(email, otp)) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Ensure all required fields are provided
    if (!name || !email || !aadharNumber || !password || !phone) {
      console.log(chalk.red("All fields are required"));
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the user already exists with the given email
    console.log("Checking if user exists with email:", email);
    const userExist = await User.findOne({ email });

    if (userExist) {
      console.log(chalk.red("User already exists with this email"));
      return res.status(400).json({ error: "User already exists" });
    }

    // Check if the user already exists with the given Aadhar number
    const aadharExist = await User.findOne({ aadharNumber });
    if (aadharExist) {
      console.log(chalk.red("Aadhar number already registered"));
      return res
        .status(400)
        .json({ error: "Aadhar number already registered" });
    }

    // Check if the phone number already exists
    const phoneExist = await User.findOne({ phone });
    if (phoneExist) {
      console.log(chalk.red("Phone number already registered"));
      return res.status(400).json({ error: "Phone number already registered" });
    }

    // Hash the password before storing it
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user document
    const user = await User.create({
      name,
      email,
      aadharNumber,
      password: hashedPassword,
      phone,
    });

    if (!user) {
      return res.status(400).json({
        error: "Failed to register user, please enter details properly.",
      });
    }

    // User registration successful
    console.log("User created:", user);

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        aadharNumber: user.aadharNumber,
        phone: user.phone,
      },
      token,
    });
  } catch (err) {
    console.log("Error during registration:", err);
    res.status(500).json({ error: "Server Error" });
  }
};

const login = async (req, res) => {
  try {
    // Destructure email and password from the request body
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      console.log(chalk.yellow("Please provide email and password"));
      return res.status(400).json({ error: "Email and password are required" }); // Return error response if either is missing
    }

    // Look for a user with the given email in the database
    const user = await User.findOne({ email });

    // If no user is found, return an error
    if (!user) {
      console.log(chalk.red("User not found"));
      return res.status(400).json({ error: "User not found" });
    }

    // Compare the provided password with the hashed password stored in the database
    const isMatch = await bcrypt.compare(password, user.password);

    // If the passwords do not match, return an error
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate a JWT token for the authenticated user
    const token = generateToken(user);

    // Log the generated token for debugging purposes
    console.log("JWT token generated: " + token);

    console.log(chalk.green("User Logged in Successfully"));
    // Return a success response with the token
    return res.json({
      message: "User Logged in Successfully",
      token,
    });
  } catch (error) {
    // Log any server-side errors for debugging
    console.log("Error during login:", error);

    // Return a generic server error response
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = { home, register, login, sendOTP, getUser };
