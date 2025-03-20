import dotenv from "dotenv";
import mysql2 from "mysql2/promise";
dotenv.config();

const db = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    connectTimeout: 60000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

(async () => {
    try {
        const connection = await db.getConnection();
        console.log("✅ Conectado a la base de datos MySQL");
        connection.release();
    } catch (err) {
        console.error("❌ Error de conexión:", err);
    }
})();

export default db;