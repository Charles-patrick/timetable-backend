const authService = require("./auth.service");

const isProd = process.env.NODE_ENV === "production";

// Shared cookie options. sameSite:"none" + secure:true are required in
// production because the frontend (Vercel) and backend (Render/Railway)
// are on different domains. In local dev, "lax" + secure:false works
// since both run on localhost.
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.login({ email, password });

    res.cookie("token", token, cookieOptions);
    // Non-httpOnly, readable by the frontend's middleware.js purely to decide
    // which pages to redirect to. It carries no security weight on its own —
    // every real API request is still authorized off the httpOnly "token" cookie.
    res.cookie("role", user.role, { ...cookieOptions, httpOnly: false });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie("token", { ...cookieOptions, maxAge: 0 });
    res.clearCookie("role", { ...cookieOptions, httpOnly: false, maxAge: 0 });
    res.status(200).json({ success: true, message: "Logged out", data: {} });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json({ success: true, message: "OK", data: { user } });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, logout, me };
