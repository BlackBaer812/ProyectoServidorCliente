# Share Control

Aplicación web para la gestión y división de gastos en grupo.

## 📌 Descripción

**Share Control** nace como solución a un problema cotidiano: dividir gastos de forma justa entre varias personas. Ya sea para viajes, cenas o vida compartida, esta herramienta permite crear grupos, registrar gastos, consultar deudas y mantener transparencia financiera en tiempo real.

## 🎯 Características principales

- Autenticación con recuperación de cuenta por correo electrónico.
- Creación de grupos con permisos diferenciados por usuario.
- Invitaciones mediante teléfono o nombre de usuario.
- Registro de tickets de compra y clasificación por tipos de productos.
- Consulta de gastos por grupo, con resumen de deudas.
- Generación automática de informes PDF con envío por email.
- Paginación y filtros por fechas.
- Interfaz intuitiva y adaptable a contextos locales.

## 🧱 Tecnologías utilizadas

- **Frontend**: HTML + CSS con [Bootstrap](https://getbootstrap.com/)
- **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- **Motor de plantillas**: [Pug](https://pugjs.org/)
- **Base de datos**: PL/SQL
- **Correo electrónico**: [Nodemailer](https://nodemailer.com/)
- **Seguridad**: [bcrypt](https://github.com/kelektiv/node.bcrypt.js) para el cifrado de contraseñas
- **Despliegue**: [Render](https://render.com/)  
  🔗 [https://proyectoservidorcliente.onrender.com](https://proyectoservidorcliente.onrender.com)

## 🗂️ Estructura de la base de datos

- **Usuarios**: Email, contraseña, nombre, teléfono
- **Grupos**: Nombre y miembros
- **Productos**: Clasificación por tipo, comentarios y valor
- **Compras**: Asociación con grupo, producto y usuario
- **Relaciones**: Tabla de pertenencia a grupo con permisos y aceptación

## 🚀 Instalación y ejecución

```bash
git clone https://github.com/BlackBaer812/ProyectoServidorCliente.git
cd ProyectoServidorCliente
npm install
npm start
