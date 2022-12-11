const dgram = require('dgram');
const socket = dgram.createSocket('udp4');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

fetch('https://dev.espacefiguratif.net/generateExperiment')
  .then(r => {
    r.json()
      .then(data => {
        // @ts-ignore
        const experimentCode = data.experimentCode as string;
        // @ts-ignore
        const q = data.count as number;
        // @ts-ignore
        const startTimestamp = data.startTimestamp as number;
        // @ts-ignore
        const interval = data.interval as number;

        const send = (index: number) => {
          socket.send(
            JSON.stringify({
              experimentCode,
              index
            }),
            9070,
            'dev.espacefiguratif.net',
            (err) => {
              if (err) {
                console.log(err);
              }
            },
          );
        }

        let i = 0;

        const end = () => {
          socket.close();
          fetch('https://dev.espacefiguratif.net/getExperimentResult?experimentCode=' + experimentCode)
            .then(r => {
              console.log("Result asked");
            });
        }

        const start = () => {
          send(0);
          i++;

          const intervalId = setInterval(() => {
            send(i);
            i++;

            if (i >= q) {
              clearInterval(intervalId);
              end();
            }
          }, interval);
        }

        setTimeout(start, startTimestamp - Date.now());
      })
      .catch(err => {
        console.log("Error parsing JSON");
        console.log(err);
      });
  })
  .catch(e => {
    console.log(e);
  });