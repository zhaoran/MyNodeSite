/**
 * @author zhaoran02
 */
var http = require('http');
var route = require('./route');
var DEBUG_MODE = require('./config').DEBUG_MODE;
var server;
var reqCount = 0;
var run = function(port){
	var port = port || 8081;
	server = http.createServer(function(req, res){
		DEBUG_MODE && console.log('reqCount=' + (++reqCount));
		var postData = null;
		var postCount = 0;
		req.on('data', function(chunk){
				DEBUG_MODE && console.log('postCount=' + (++postCount));
			})
			.on('end', function(){
				route.doRouting(req, res, postData);
			});
			
	}).listen(port, function(){
			console.log('Server running at port ' + port);
		});
};
var close = function(){
	server.close();
};
exports.run = run;
exports.close = close;