import dotenv from "dotenv";
import mysql2 from "mysql2/promise";
dotenv.config();

const db = mysql2.createPool({
    host: process.env.DB_HOST, // Asegúrate de definir estas variables en tu .env
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

(async () => {
    try {
        const connection = await db.getConnection();
        console.log("✅ Conectado a la base de datos MySQL");
        connection.release(); // Liberar la conexión al pool
    } catch (err) {
        console.error("❌ Error de conexión:", err);
    }
})();

export default db;