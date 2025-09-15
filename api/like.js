// BOT Version: 2
// Dependencias: Ninguna, usa las de Vercel y la API de GitHub
// Change Log:
// - Se modifica la lógica para poder quitar likes.
// - Se usa localStorage para rastrear los likes del usuario.

import fetch from 'node-fetch';

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
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Método ${req.method} no permitido`);
    }

    try {
        const { id, action } = req.body;
        if (!id || !action) {
            return res.status(400).json({ error: 'ID del mensaje y la acción son requeridos.' });
        }

        const { content: greetings, sha } = await getFileContent();
        
        const newGreetings = greetings.map(g => {
            if (g.id === id) {
                if (action === 'like') {
                    return {
                        ...g,
                        likes: (g.likes || 0) + 1
                    };
                } else if (action === 'unlike') {
                     return {
                        ...g,
                        likes: Math.max(0, (g.likes || 0) - 1)
                    };
                }
            }
            return g;
        });

        const targetGreeting = newGreetings.find(g => g.id === id);
        if (!targetGreeting) {
            return res.status(404).json({ error: 'No se encontró un saludo con ese ID.' });
        }

        await updateRepoFile(newGreetings, sha, `Like/Unlike actualizado en saludo con ID ${id}`);
        return res.status(200).json({ message: `Like/Unlike actualizado en saludo con ID ${id}` });
        
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || 'No se pudo actualizar el like. Revisa la consola.' });
    }
                                            }
