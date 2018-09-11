// Get dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
require('dotenv').config()


const fileWatcher = require('./server/processors/imageWatch');
// Get our API routes
const api = require('./server/routes/api');
const uploads = require('./server/routes/uploads');

const app = express();

fileWatcher.init();

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Point static path to dist
app.use(express.static(path.join(__dirname, 'dist')));

// Set our api routes
app.use('/api', api);
app.use('/upload', uploads);

app.use('/images', express.static(process.env.IMG_FOLDER || '/usr/src/imgs'))
app.use('/raws', express.static(process.env.IMG_RAW || "/usr/src/imgsRaw"))

// Catch all other routes and return the index file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || '3000';
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => console.log(`API running on localhost:${port}`));
