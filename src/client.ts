import dgram from 'node:dgram';
const socket = dgram.createSocket('udp4');

fetch('https://dev.espacefiguratif.net/generateExperiment')
  .then(r => {
    r.json()
      .then(data => {
        const experimentCode = data.experimentCode;
        const q = data.count;
        const startTimestamp = data.startTimestamp;
        const interval = data.interval;

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