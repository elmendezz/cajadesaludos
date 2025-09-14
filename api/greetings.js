// Dependencias:
// - fs (built-in de Node.js)
// - path (built-in de Node.js)
// BOT Version: 1

import fs from 'fs/promises';
import path from 'path';

// El PIN debe estar en un lugar seguro, no en el código.
// Por ahora lo dejamos aquí para la simplicidad.
const ADMIN_PIN = '26435';

export default async function handler(req, res) {
    const filePath = path.join(process.cwd(), 'data.json');

    try {
        const data = await fs.readFile(filePath, 'utf-8');
        let greetings = JSON.parse(data);

        if (req.method === 'POST') {
            const { name, message, isGlowing, pin, action } = req.body;
            
            if (action === 'submit') {
                const newGreeting = {
                    name,
                    message,
                    timestamp: new Date().toISOString(),
                    isGlowing
                };
                greetings.unshift(newGreeting);
                await fs.writeFile(filePath, JSON.stringify(greetings, null, 2));
                res.status(200).json({ message: 'Saludo enviado con éxito' });
            } else if (pin === ADMIN_PIN) {
                if (action === 'borrar') {
                    greetings = [];
                    await fs.writeFile(filePath, JSON.stringify(greetings, null, 2));
                    res.status(200).json({ message: 'Todos los saludos han sido borrados.' });
                } else if (action === 'glow') {
                    const newAdminGreeting = {
                        name: "elmendezz",
                        message: "¡Saludos de parte del admin! 😎",
                        timestamp: new Date().toISOString(),
                        isGlowing: true
                    };
                    greetings.unshift(newAdminGreeting);
                    await fs.writeFile(filePath, JSON.stringify(greetings, null, 2));
                    res.status(200).json({ message: '¡Mensaje de admin con glow enviado!' });
                } else {
                    res.status(400).json({ message: 'Acción de admin no válida.' });
                }
            } else {
                res.status(401).json({ message: 'PIN incorrecto.' });
            }
        } else if (req.method === 'GET') {
            res.status(200).json(greetings);
        } else {
            res.status(405).json({ message: 'Método no permitido' });
        }

    } catch (error) {
        console.error('Error en la API de saludos:', error);
        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
            }
                      
