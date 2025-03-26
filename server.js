const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;


app.use(express.json());


app.use(express.static(path.join(__dirname, 'public')));


app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});


app.get('/results', (req, res) => {
    fs.readFile('game_results.json', 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.json([]);
            }
            console.error('Помилка читання game_results.json:', err);
            return res.status(500).send('Помилка сервера');
        }
        res.json(JSON.parse(data));
    });
});


app.post('/results', (req, res) => {
    const newResult = req.body;
    if (!newResult.name || !newResult.date || newResult.score === undefined) {
        return res.status(400).send('Некоректні дані');
    }

    fs.readFile('game_results.json', 'utf8', (err, data) => {
        let results = [];
        if (!err) {
            results = JSON.parse(data);
        }
        results.push(newResult);
        fs.writeFile('game_results.json', JSON.stringify(results, null, 2), (err) => {
            if (err) {
                console.error('Помилка запису в game_results.json:', err);
                return res.status(500).send('Помилка збереження результатів');
            }
            res.status(200).send('Результати збережені');
        });
    });
});


function findFreePort(port) {
    return new Promise((resolve) => {
        const server = app.listen(port, () => {
            const { port } = server.address();
            server.close(() => {
                resolve(port);
            });
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Порт ${port} зайнятий, шукаємо інший...`);
                findFreePort(port + 1).then(resolve);
            } else {
                console.error('Помилка сервера:', err);
                resolve(null);
            }
        });
    });
}


findFreePort(PORT).then((freePort) => {
    if (freePort) {
        app.listen(freePort, () => {
            console.log(`Сервер запущено на http://localhost:${freePort}`);
        });
    } else {
        console.error('Не вдалося знайти вільний порт для запуску сервера.');
    }
});