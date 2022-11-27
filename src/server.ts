import express from 'express';
import { v4 as uuidv4 } from 'uuid';

import https from 'node:https';
import dgram from 'node:dgram';
import { readFileSync } from 'node:fs';

const httpsServerOptions = {
  key: readFileSync('../../certification/privkey.pem'),
  cert: readFileSync('../../certification/cert.pem')
};

const expressApp = express();
expressApp.use(express.json());
const httpsServer = https.createServer(httpsServerOptions, expressApp);

const socket = dgram.createSocket('udp4');

socket.on('error', (err: Error) => {
  console.log(`UDP Error: ${err.name}\n${err.message}`);
});

interface IClientInfo {
  startTimestamp: number;
  receivedTimestamp: number[];
}
const clients: Record<string, IClientInfo> = {};

socket.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
  const message = JSON.parse(msg.toString());

  if (typeof message.experimentCode !== 'string') {
    console.log('Invalid message received');
    return;
  }

  if (typeof message.index !== 'number') {
    console.log('Invalid message received');
    return;
  }

  if (clients[message.experimentCode] === undefined) {
    console.log('Invalid experiment code received');
    return;
  }

  clients[message.experimentCode].receivedTimestamp[message.index] = Date.now();
});

expressApp.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!');
});

expressApp.get('/generateExperiment', (req, res) => {
  const uuid = uuidv4();

  clients[uuid] = {
    startTimestamp: Date.now() + 10000,
    receivedTimestamp: []
  };

  setTimeout(() => {
    delete clients[uuid];
  }, 20000);

  res.status(200).json({
    experimentCode: uuid,
    startTimestamp: clients[uuid].startTimestamp,
    count: 100,
    interval: 250
  });
});

expressApp.get('/getExperimentResult', (req, res) => {
  if (typeof req.body.experimentCode !== 'string') {
    res.status(400).json({
      error: 'Invalid experiment code'
    });
    return;
  }

  if (typeof clients[req.body.experimentCode] === 'undefined') {
    res.status(400).json({
      error: 'Experiment code not found'
    });
    return;
  }

  let average: number;
  let min: number;
  let max: number;

  average = clients[req.body.experimentCode].receivedTimestamp.reduce((a, b) => a + b) / clients[req.body.experimentCode].receivedTimestamp.length;
  min = Math.min(...clients[req.body.experimentCode].receivedTimestamp);
  max = Math.max(...clients[req.body.experimentCode].receivedTimestamp);

  console.log("Average: ", average, " Min: ", min, " Max: ", max);

  res.status(200).json({
  });
});

socket.bind(9070, () => {
  console.log("UDP Server listening on port 9070");

  httpsServer.listen(443, () => {
    console.log("HTTPS Server listening on port 443");
  });
});
