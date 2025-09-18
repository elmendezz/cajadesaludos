# 📦 Caja de Saludos

**Version:** 1.0.0

Una cajita de saludos simple para Vercel, ideal para dejar mensajes con buena vibra. ✨

---

## 🛠️ Dependencias del Proyecto

El proyecto se basa en Node.js y utiliza las siguientes dependencias clave para su funcionamiento:

* `node-fetch`: Para realizar peticiones HTTP.
* `crypto`: Utilizado para generar identificadores únicos de forma segura.

---

## 📂 Estructura y Características

Este proyecto está dividido en varios componentes para manejar la interacción con los usuarios y la administración de los mensajes.

* **`index.html`**: La página principal, donde los usuarios pueden ver y enviar saludos. Incluye un sistema de likes y la posibilidad de ver las respuestas del administrador.
* **`index_beta.html`**: Una versión alternativa de la página principal que introduce un modal de advertencia para los usuarios.
* **`index_admin.html`**: El panel de administración, diseñado para que el administrador pueda ver los saludos y responder a ellos.
* **`admin.js`**: Lógica de backend para el panel de administración, que maneja las respuestas a los mensajes de los usuarios.
* **`like.js`**: Lógica de backend para gestionar los likes y unlikes de los saludos.
* **`greetings.js`**: El corazón del backend, encargado de recibir los nuevos saludos, darles formato y guardarlos.
* **`ngltryout.html`**: Una página independiente para generar un "NGL" (No se qué significa, pero lo agregué como una funcionalidad).

---

## 📜 HTML Changelog

A continuación, un resumen de los cambios más importantes en los archivos HTML.

* **HTML Changelog - Version 15 (`index.html`)**
    * Se corrige el error de "página cortada" y se ajusta el CSS para una mejor visualización.
    * Se ajusta la posición del menú para que no cause problemas de superposición.

* **HTML Changelog - Version 16 (`index_beta.html` y `index_admin.html`)**
    * Se añade el modal de advertencia con un temporizador de 4 segundos.
    * Se implementa el uso de `localStorage` para mostrar el disclaimer una sola vez.
    * Se añade un botón para ver las respuestas del administrador.
    * Se ajusta el CSS para el nuevo disclaimer y el botón de respuestas.
    * Se ajusta la estructura de las tarjetas para mostrar las respuestas del admin.
    * Se añade un botón para "Responder" en cada tarjeta de saludo.
    * Se añade el modal y el formulario para que el administrador pueda enviar respuestas.
    * Se actualiza el código para manejar la nueva acción "reply" en el `admin.js`.
    * Se ajusta la posición del body y el `.hamburger-menu` para que no se superpongan en la página de administración.

* **HTML Changelog - Version 28 (`ngltryout.html`)**
    * Se corrige el error que hacía que los números se vieran afectados por la tipografía cargada, incluso sin la casilla de verificación.
    * Se modifica la función de aplicación de fuente para que excluya los números de forma permanente, asegurando que siempre mantengan su estilo original.

---

## 📜 JavaScript Changelog

Aquí están los cambios de los archivos JavaScript.

* **JS Changelog - Version 2 (`like.js`)**
    * Se modifica la lógica para poder quitar likes.
    * Se usa `localStorage` para rastrear los likes del usuario.

* **JS Changelog - Version 6 (`admin.js`)**
    * Se añade la acción `reply` para que el admin pueda responder a los mensajes.
    * Se ajusta la lógica para manejar la nueva matriz `replies` en los saludos.

* **JS Changelog - Version 9 (`greetings.js`)**
    * Se modifica la estructura de la data para incluir una matriz `replies` para las respuestas del admin.
    * Se añade la matriz `replies` a los nuevos saludos por defecto.

---

## ⚙️ Notas Adicionales

* Las dependencias de los archivos `.js` se manejan a través de Vercel y la API de GitHub.

