const dgram = require('dgram');

dgram.send('hello', 8070, 'localhost', (err) => {

})