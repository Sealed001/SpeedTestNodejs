"use strict";
exports.__esModule = true;
var express = require('express');
var uuidv4 = require('uuid').v4;
var https = require('https');
var readFileSync = require('fs').readFileSync;
var dgram = require('dgram');
var httpsServerOptions = {
    key: readFileSync('/www/certification/privkey.pem'),
    cert: readFileSync('/www/certification/cert.pem')
};
var expressApp = express();
expressApp.use(express.json());
var httpsServer = https.createServer(httpsServerOptions, expressApp);
var socket = dgram.createSocket('udp4');
socket.on('error', function (err) {
    console.log("UDP Error: ".concat(err.name, "\n").concat(err.message));
});
var clients = {};
socket.on('message', function (msg, rinfo) {
    var message = JSON.parse(msg.toString());
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
expressApp.get('/', function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World!');
});
expressApp.get('/generateExperiment', function (req, res) {
    var uuid = uuidv4();
    clients[uuid] = {
        startTimestamp: Date.now() + 10000,
        receivedTimestamp: []
    };
    setTimeout(function () {
        delete clients[uuid];
    }, 20000);
    res.status(200).json({
        experimentCode: uuid,
        startTimestamp: clients[uuid].startTimestamp,
        count: 100,
        interval: 250
    });
});
expressApp.get('/getExperimentResult', function (req, res) {
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
    var average;
    var min;
    var max;
    average = clients[req.body.experimentCode].receivedTimestamp.reduce(function (a, b) { return a + b; }) / clients[req.body.experimentCode].receivedTimestamp.length;
    min = Math.min.apply(Math, clients[req.body.experimentCode].receivedTimestamp);
    max = Math.max.apply(Math, clients[req.body.experimentCode].receivedTimestamp);
    console.log("Average: ", average, " Min: ", min, " Max: ", max);
    res.status(200).json({});
});
socket.bind(9070, function () {
    console.log("UDP Server listening on port 9070");
    httpsServer.listen(443, function () {
        console.log("HTTPS Server listening on port 443");
    });
});
