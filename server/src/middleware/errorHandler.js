export function notFound(req, _res, next) {
  next({ statusCode: 404, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, _req, res, _next) {
  if (error?.code === 11000) {
    return res.status(409).json({
      message: "Duplicate record",
      details: error.keyValue
    });
  }

  if (String(error?.code || "").startsWith("ERR_SQLITE_CONSTRAINT")) {
    return res.status(409).json({
      message: "Duplicate or invalid record",
      details: error.message
    });
  }

  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? "Unexpected server error" : error.message;
  res.status(statusCode).json({
    message,
    details: error.details || null
  });
}
