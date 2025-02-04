const express = require('express');
const cluster = require('cluster');
const os = require('os');

const totalCPUs = os.cpus().length;
const statusMonitor = require('express-status-monitor')();

if (cluster.isPrimary) {
    console.log(`Primary process ${process.pid} is forking ${totalCPUs} workers`);

    for (let i = 0; i < totalCPUs; i++) {
        cluster.fork();
    }

    // Restart workers if they exit
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });

} else {
    const app = express();
    const port = 3000;

    app.use(statusMonitor);
    app.get('/status', statusMonitor.pageRoute);

    // Stream large API response
    app.get('/', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.write('{"message": "Streaming Data from Worker ' + process.pid + '", "data": [');

        let count = 100000; // Number of records
        for (let i = 0; i < count; i++) {
            let item = JSON.stringify({
                id: i + 1,
                name: `Item ${i + 1}`,
                value: Math.random() * 1000,
                timestamp: new Date().toISOString()
            });

            res.write(item);
            if (i < count - 1) res.write(','); // Add a comma between JSON objects
        }

        res.write(']}');
        res.end();
    });

    app.listen(port, () => {
        console.log(`Worker ${process.pid} running at http://localhost:${port}/`);
    });
}

console.log(`Total CPUs: ${totalCPUs}`);
