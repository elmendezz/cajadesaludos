// BOT Version: 1
// Dependencias: Ninguna, usa las de Vercel y la API de GitHub
// Change Log:
// - Se crea un nuevo endpoint para manejar las acciones de administrador.
// - Se añade la funcionalidad de borrar todos los saludos.
// - Se añade la funcionalidad de marcar un saludo como "glowing".
// - Se usa el mismo helper `getFileContent` y `updateRepoFile` para la lógica.

import fetch from 'node-fetch';

// !!!!!!!!!!!!!!!!!!!!!!!! IMPORTANTE !!!!!!!!!!!!!!!!!!!!!!!!
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_FILE_PATH = 'greetings.json';
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// Helpers para interactuar con GitHub (copia de greetings.js para que sea un módulo autocontenido)
async function getFileContent() {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
    };
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
        throw new Error('Error al obtener el contenido del archivo desde GitHub.');
    }
    
    const data = await response.json();
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
    
    return {
        content: content,
        sha: data.sha
    };
}

async function updateRepoFile(newContent, sha, message) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
    const body = {
        message: message, 
        content: Buffer.from(JSON.stringify(newContent, null, 2)).toString('base64'),
        sha: sha
    };
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar el archivo del repositorio');
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Método ${req.method} no permitido`);
    }

    try {
        const { action, index, customMessage } = req.body; // Añadimos 'index' y 'customMessage'
        const { content: greetings, sha } = await getFileContent();

        if (action === 'borrar') {
            await updateRepoFile([], sha, 'Todos los saludos han sido borrados por el admin.');
            return res.status(200).json({ message: 'Todos los saludos han sido borrados.' });
        } else if (action === 'glow') {
            if (typeof index !== 'number' || index < 0 || index >= greetings.length) {
                return res.status(400).json({ error: 'Índice de saludo no válido.' });
            }
            
            // Si el mensaje custom viene, lo actualizamos. Si no, solo cambiamos el glow.
            const newGreetings = greetings.map((g, i) => {
                if (i === index) {
                    return {
                        ...g,
                        isGlowing: !g.isGlowing,
                        message: customMessage || g.message // Usa el mensaje custom si existe
                    };
                }
                return g;
            });
            
            await updateRepoFile(newGreetings, sha, `Saludo en el índice ${index} actualizado.`);
            return res.status(200).json({ message: `Estado "glow" del saludo en el índice ${index} ha sido actualizado.` });
        } else {
            return res.status(400).json({ error: 'Acción de administrador no válida.' });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || 'No se pudo ejecutar la acción de admin. Revisa la consola.' });
    }
      }
