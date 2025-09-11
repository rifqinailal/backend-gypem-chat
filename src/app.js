import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Impor router utama dan helper
import mainRouter from './routes/index.js';
import { sendError } from './utils/apiResponse.js'; // Asumsi lokasi helper
dotenv.config();
// Buat instance aplikasi Express
const app = express();

/*
============================================================
 Middleware
============================================================
*/
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
  setHeaders: (res, path, stat) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
}));

/*
============================================================
 Routing
 Arahkan semua request yang masuk ke router utama.
============================================================
*/
// Menggunakan /api sebagai prefix, bukan /api/v1
app.use('/api', mainRouter);


/*
============================================================
 Penanganan Error
 Ini harus diletakkan di bagian paling akhir setelah routing.
============================================================
*/

// Middleware untuk menangani rute yang tidak ditemukan (404)
app.use((req, res, next) => {
  // Menggunakan helper untuk konsistensi
  sendError(res, 'Resource tidak ditemukan', 404);
});

// Middleware untuk menangani error server (500)
app.use((err, req, res, next) => {
  console.error(err.stack);
  // Menggunakan helper untuk konsistensi
  sendError(res, 'Terjadi kesalahan pada server', 500);
});


// Ekspor app agar bisa digunakan oleh server.js
export default app;