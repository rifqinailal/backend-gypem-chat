/**
 * Mengirim response sukses.
 * @param {object} res - Objek response Express.
 * @param {string} message - Pesan sukses.
 * @param {object} [data] - Data yang akan dikirim (opsional).
 * @param {number} [statusCode=200] - Kode status HTTP.
 */
export const sendSuccess = (res, message, data, statusCode = 200) => {
  const response = {
    status: 'success',
    message,
  };
  if (data !== undefined) {
    response.data = data;
  }
  res.status(statusCode).json(response);
};

/**
 * Mengirim response error.
 * @param {object} res - Objek response Express.
 * @param {string} message - Pesan error.
 * @param {number} [statusCode=500] - Kode status HTTP.
 */
export const sendError = (res, message, statusCode = 500) => {
  res.status(statusCode).json({
    status: 'error',
    message,
  });
};