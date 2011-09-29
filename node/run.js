var server = require('./server');
var args = process.argv.slice(2);
var port = parseInt(args.pop());
port = typeof port == 'number' ? port : 8081;
server.run(port);
