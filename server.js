import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================
// PATHS
// =====================================================

const distPath = path.join(__dirname, 'dist');
const gamesPath = path.join(distPath, 'games');
const dataPath = path.join(__dirname, 'data');

if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
}

// =====================================================
// DATABASE
// =====================================================

const db = new Database(
    path.join(dataPath, 'zenova.db')
);

db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        background_image TEXT DEFAULT '',
        theme_color TEXT DEFAULT '#D0BCFF'
    )
`);

db.prepare(`
    INSERT OR IGNORE INTO settings
    (id, background_image, theme_color)
    VALUES (1, '', '#D0BCFF')
`).run();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// =====================================================
// API — HEALTH
// =====================================================

app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        environment: 'production'
    });
});

// =====================================================
// API — SETTINGS GET
// =====================================================

app.get('/api/settings', (req, res) => {
    try {
        const settings = db.prepare(`
            SELECT background_image, theme_color
            FROM settings
            WHERE id = 1
        `).get();

        res.json(
            settings || {
                background_image: '',
                theme_color: '#D0BCFF'
            }
        );

    } catch (error) {
        console.error('Error leyendo settings:', error);

        res.status(500).json({
            error: 'No se pudieron cargar los ajustes'
        });
    }
});

// =====================================================
// API — SETTINGS POST
// =====================================================

app.post('/api/settings', (req, res) => {
    try {
        const {
            background_image = '',
            theme_color = '#D0BCFF'
        } = req.body;

        db.prepare(`
            UPDATE settings
            SET background_image = ?,
                theme_color = ?
            WHERE id = 1
        `).run(
            background_image,
            theme_color
        );

        res.json({
            ok: true,
            background_image,
            theme_color
        });

    } catch (error) {
        console.error('Error guardando settings:', error);

        res.status(500).json({
            error: 'No se pudieron guardar los ajustes'
        });
    }
});

// =====================================================
// API — CATÁLOGO DE JUEGOS
// =====================================================

app.get('/api/games', async (req, res) => {
    try {
        const entries = await fs.promises.readdir(
            gamesPath,
            {
                withFileTypes: true
            }
        );

        const games = entries
            .filter(entry => entry.isDirectory())
            .map(entry => ({
                id: entry.name,
                title: entry.name,
                folder: entry.name
            }));

        res.json(games);

    } catch (error) {
        console.error(
            'Error al cargar juegos:',
            error
        );

        res.status(500).json({
            error: 'No se pudieron cargar los juegos'
        });
    }
});

// =====================================================
// API — SAVE GAME TIME
// =====================================================
//
// Tu componente Window también intenta utilizar:
//
// POST /api/save-time
//
// Por ahora dejamos el endpoint preparado.
//

app.post('/api/save-time', (req, res) => {
    const {
        gameFolder,
        timeSeconds
    } = req.body;

    console.log(
        `Game time: ${gameFolder} -> ${timeSeconds}s`
    );

    res.json({
        ok: true
    });
});

// =====================================================
// GAMES
// =====================================================

app.use(
    '/games',
    express.static(gamesPath)
);

// =====================================================
// FRONTEND
// =====================================================

app.use(
    express.static(distPath)
);

// =====================================================
// SPA FALLBACK
// =====================================================

app.get('/{*splat}', (req, res) => {
    res.sendFile(
        path.join(
            distPath,
            'index.html'
        )
    );
});

// =====================================================
// START
// =====================================================

app.listen(
    PORT,
    '0.0.0.0',
    () => {
        console.log('');
        console.log('=== ZENOVA SERVER ===');
        console.log(`Port:      ${PORT}`);
        console.log(`Frontend:  http://localhost:${PORT}`);
        console.log(`Games:     http://localhost:${PORT}/games/`);
        console.log(`API:       http://localhost:${PORT}/api/health`);
        console.log(`Games API: http://localhost:${PORT}/api/games`);
        console.log(`Settings:  http://localhost:${PORT}/api/settings`);
        console.log('');
    }
);