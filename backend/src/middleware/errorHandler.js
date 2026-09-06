function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Duplicate value. Username/email may already exist.' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File is too large. Maximum is 5 MB.' });
  }

  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };
