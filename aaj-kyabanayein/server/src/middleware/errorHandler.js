const isProd = process.env.NODE_ENV === "production";

export function notFoundHandler(_req, res) {
  res.status(404).json({ success: false, message: "API route not found" });
}

export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  if (!isProd) {
    console.error("[error]", err);
  } else if (status >= 500) {
    console.error("[error]", err.message || err);
  }
  res.status(status).json({
    success: false,
    message: status >= 500 && isProd ? "Internal server error" : err.message || "Error",
  });
}
