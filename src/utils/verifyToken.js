import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    console.log("Decoded Token gotten", token.split(" ")[1]);
    const decoded = jwt.verify(
      token.split(" ")[1],
      process.env.SECRETE_KEY_ACCESS_TOKEN
    );
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      error: "Invalid Token",
    });
  }
};

export default verifyToken;
