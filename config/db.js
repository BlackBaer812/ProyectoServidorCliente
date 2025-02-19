import dotenv from "dotenv";
import mysql2 from "mysql2";
dotenv.config();

const db = mysql2.createConnection({
    host: process.env.DB_HOST, // Asegúrate de definir estas variables en tu .env
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) {
      console.error("❌ Error de conexión a la base de datos:", err.message);
    } else {
      console.log("✅ Conectado a la base de datos MySQL");
    }
});

export default db;