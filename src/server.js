import http from 'http';
import app from './app.js'; // Impor konfigurasi Express dari app.js

// Dapatkan port dari environment variable atau gunakan 3001 sebagai default
const port = process.env.PORT || 3001; // Menambahkan fallback jika PORT tidak ada di .env

// Buat server HTTP menggunakan aplikasi Express
const server = http.createServer(app);

// Jalankan server pada port yang ditentukan
server.listen(port, () => {
  console.log(`🚀 Server berjalan di http://localhost:${port}`);
  console.log('Tekan CTRL+C untuk menghentikan server.');
});
