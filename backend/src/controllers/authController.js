import bcrypt from "bcryptjs";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Ensure proper bcrypt comparison
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
