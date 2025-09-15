// BOT Version: 4
// Dependencias: Ninguna, usa las de Vercel y la API de GitHub
// Change Log:
// - Se corrigió el error "body stream already read" optimizando getFileContent.
// - Se obtiene el SHA y el contenido del archivo en una sola petición a la API de GitHub.

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
        'Accept': 'application/vnd.github.v3+json' // Solicitamos el formato JSON para obtener el SHA y el contenido
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

async function updateRepoFile(newContent, sha) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
    const body = {
        message: 'Nuevo saludo agregado', 
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
            const { name, message } = req.body;
            if (!name || !message) {
                return res.status(400).json({ error: 'Nombre y mensaje son requeridos.' });
            }

            const { content: greetings, sha } = await getFileContent();
            
            const newGreeting = {
                name,
                message,
                timestamp: new Date().toISOString(),
                isGlowing: false
            };
            greetings.push(newGreeting);

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
