// BOT Version: 7
// Dependencias: Ninguna, usa las de Vercel y la API de GitHub
// Change Log:
// - Se añade la acción 'reply' para que el admin pueda responder a los mensajes.
// - Se ajusta la lógica para manejar la nueva matriz 'replies' en los saludos.
// - Se agrega la lógica para manejar correctamente la solicitud de respuesta en el endpoint '/api/admin'.
// - Se asegura que el ID del saludo y el mensaje de respuesta sean requeridos.
// - Se corrige un pequeño error en la lógica de actualización del archivo.

import fetch from 'node-fetch';
import crypto from 'crypto';

// !!!!!!!!!!!!!!!!!!!!!!!! IMPORTANTE !!!!!!!!!!!!!!!!!!!!!!!!
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_FILE_PATH = 'greetings.json';
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

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
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    };
    const body = {
        message: message,
        content: Buffer.from(JSON.stringify(newContent, null, 2)).toString('base64'),
        sha: sha
    };

    const response = await fetch(url, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        throw new Error('Error al actualizar el archivo en GitHub.');
    }
}

export default async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Método ${req.method} no permitido`);
    }

    try {
        const { action, id, reply_message } = req.body;
        const { content: greetings, sha } = await getFileContent();

        if (action === 'reply') {
            if (!id || !reply_message) {
                return res.status(400).json({ error: 'ID y mensaje de respuesta son requeridos.' });
            }
            
            const newGreetings = greetings.map(g => {
                if (g.id === id) {
                    const replies = g.replies || [];
                    return {
                        ...g,
                        replies: [
                            ...replies,
                            {
                                id: crypto.randomBytes(4).toString('hex'),
                                message: reply_message,
                                timestamp: new Date().toISOString()
                            }
                        ]
                    };
                }
                return g;
            });
            
            const targetGreeting = newGreetings.find(g => g.id === id);
            if (!targetGreeting) {
                return res.status(404).json({ error: 'No se encontró un saludo con ese ID.' });
            }
            
            await updateRepoFile(newGreetings, sha, `Respuesta de admin añadida al saludo con ID ${id}`);
            return res.status(200).json({ message: 'Respuesta de admin enviada con éxito.' });
        } else {
            return res.status(400).json({ error: 'Acción de administrador no válida.' });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || 'No se pudo ejecutar la acción de admin. Revisa la consola.' });
    }
};