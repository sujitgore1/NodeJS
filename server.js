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

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Starting a new one...`);
        cluster.fork();
    });

} else {
    const app = express();
    const port = 3000;

    app.use(statusMonitor);
    app.get('/status', statusMonitor.pageRoute);

    app.get('/', (req, res) => {
        res.send(`Hello, World! ${process.pid}`);
    });

    app.listen(port, () => {
        console.log(`Worker ${process.pid} running at http://localhost:${port}/`);
    });
}

console.log(`Total CPUs: ${totalCPUs}`);
