// BOT Version:2
// Dependencias: Ninguna, usa las de Vercel y la API de GitHub
// Change Log:
// - Se cambió la interacción de GitHub Gist a un repositorio de GitHub.
// - La lógica ahora maneja la obtención, modificación y actualización del archivo.

import fetch from 'node-fetch';

// !!!!!!!!!!!!!!!!!!!!!!!! IMPORTANTE !!!!!!!!!!!!!!!!!!!!!!!!
// 🚨 Estas son tus nuevas variables de entorno de Vercel
// Ten en cuenta que debes cambiar 'elmendezz' y 'saludos-repo' por los tuyos.
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // ¡Tu token seguro!
const GITHUB_OWNER = 'elmendezz'; // Tu nombre de usuario de GitHub
const GITHUB_REPO = 'saludos-repo'; // El nombre de tu repositorio
const GITHUB_FILE_PATH = 'greetings.json'; // La ruta del archivo dentro del repo
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

async function getFileSha() {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3.raw'
    };
    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error('Error al obtener el SHA del archivo.');
    }
    const data = await response.json();
    return data.sha;
}

async function getGreetings() {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3.raw' // Para obtener el contenido del archivo directo
    };
    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error('Error al obtener los saludos.');
    }
    const content = await response.text();
    return JSON.parse(content);
}

async function updateRepoFile(newContent, sha) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
    const body = {
        message: 'Nuevo saludo agregado', // Mensaje del commit
        content: Buffer.from(JSON.stringify(newContent, null, 2)).toString('base64'), // El contenido debe estar en base64
        sha: sha
    };
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
        method: 'PUT', // PUT para actualizar archivos
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar el archivo del repositorio');
    }
}

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const greetings = await getGreetings();
            res.status(200).json(greetings);
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'No se pudieron cargar los saludos. Revisa tus credenciales y el repositorio.' });
        }
    } else if (req.method === 'POST') {
        try {
            const { name, message } = req.body;
            if (!name || !message) {
                return res.status(400).json({ error: 'Nombre y mensaje son requeridos.' });
            }

            const greetings = await getGreetings();
            const newGreeting = {
                name,
                message,
                timestamp: new Date().toISOString(),
                isGlowing: false
            };
            greetings.push(newGreeting);

            // Obtener el SHA del archivo antes de actualizarlo
            const sha = await getFileSha();
            await updateRepoFile(greetings, sha);

            res.status(200).json({ message: 'Saludo enviado con éxito' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'No se pudo enviar el saludo. Revisa la consola para más detalles.' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Método ${req.method} no permitido`);
    }
}
