/**
 * Membungkus fungsi async controller untuk menangkap error secara otomatis.
 * @param {function} fn - Fungsi controller async (req, res, next).
 * @returns {function} - Fungsi baru yang akan menangkap error dan meneruskannya ke middleware error.
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
