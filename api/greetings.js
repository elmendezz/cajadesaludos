// BOT Version: 8
// Dependencias: crypto
// Change Log:
// - Se elimina la restricción de que el campo "nombre" sea obligatorio.
// - Si el nombre está vacío, se asigna por defecto "Usuario Anónimo".

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
    const body = {
        message: message,
        content: Buffer.from(JSON.stringify(newContent, null, 2)).toString('base64'),
        sha: sha
    };
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
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
    if (req.method === 'GET') {
        try {
            const { content } = await getFileContent();
            res.status(200).json(content);
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'No se pudieron cargar los saludos. Revisa tus credenciales y el repositorio.' });
        }
    } else if (req.method === 'POST') {
        try {
            let { name, message } = req.body;
            if (!message) {
                return res.status(400).json({ error: 'Mensaje es requerido.' });
            }

            if (!name || name.trim() === '') {
                name = 'Usuario Anónimo';
            }

            const { content: greetings, sha } = await getFileContent();
            
            const isMyMessage = name.toLowerCase() === '@elmendez_2.0';
            const newGreeting = {
                id: crypto.randomBytes(4).toString('hex'),
                name,
                message,
                timestamp: new Date().toISOString(),
                isGlowing: isMyMessage,
                likes: 0
            };
            greetings.push(newGreeting);

            await updateRepoFile(greetings, sha, `Nuevo saludo de ${name} añadido`);

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
