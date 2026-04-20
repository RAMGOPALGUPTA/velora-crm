import User from "../models/User.js";

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, "name email role")
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
