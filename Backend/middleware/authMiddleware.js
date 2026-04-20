import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ msg: "No token, access denied" });
  }

  try {
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ msg: "Invalid token" });
  }
};

export default authMiddleware;
