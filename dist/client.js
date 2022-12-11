var dgram = require('dgram');
var socket = dgram.createSocket('udp4');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
fetch('https://dev.espacefiguratif.net/generateExperiment')
    .then(function (r) {
    r.json()
        .then(function (data) {
        // @ts-ignore
        var experimentCode = data.experimentCode;
        // @ts-ignore
        var q = data.count;
        // @ts-ignore
        var startTimestamp = data.startTimestamp;
        // @ts-ignore
        var interval = data.interval;
        var send = function (index) {
            socket.send(JSON.stringify({
                experimentCode: experimentCode,
                index: index
            }), 9070, 'dev.espacefiguratif.net', function (err) {
                if (err) {
                    console.log(err);
                }
            });
        };
        var i = 0;
        var end = function () {
            socket.close();
            fetch('https://dev.espacefiguratif.net/getExperimentResult?experimentCode=' + experimentCode)
                .then(function (r) {
                console.log("Result asked");
            });
        };
        var start = function () {
            send(0);
            i++;
            var intervalId = setInterval(function () {
                send(i);
                i++;
                if (i >= q) {
                    clearInterval(intervalId);
                    end();
                }
            }, interval);
        };
        setTimeout(start, startTimestamp - Date.now());
    })["catch"](function (err) {
        console.log("Error parsing JSON");
        console.log(err);
    });
})["catch"](function (e) {
    console.log(e);
});
