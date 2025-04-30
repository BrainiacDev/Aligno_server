import jwt from "jsonwebtoken";

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.SECRETE_KEY_ACCESS_TOKEN,
    {
      expiresIn: "15m",
    }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.SECRETE_KEY_REFRESH_TOKEN,
    {
      expiresIn: "7d",
    }
  );
  return { accessToken, refreshToken };
};

export default generateTokens;
