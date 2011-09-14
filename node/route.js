/**
 * @author zhaoran02
 */
var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var util = require('util');
var config = require('./config');

var DEBUG_MODE = config.DEBUG_MODE;
var staticBasePath = config.staticBasePath;
var actionBasePath = config.actionBasePath;
var uploadBasePath = config.uploadBasePath;
var CONTENT_TYPE_MAP = config.CONTENT_TYPE_MAP;
var ROUTE_MAP = config.ROUTE_MAP;

var routeCount = 0;
var doRouting = function(req, res, postData){
	console.log('routeCount=' + (++routeCount));
	var urlObj = url.parse(req.url, true);
	var args = {};
	var pathname = urlObj.pathname;
	var extIndex = pathname.lastIndexOf('.');
	if(extIndex < 0){
		pathname = path.join(pathname, 'index.html');
		extIndex = pathname.lastIndexOf('.');
	}
	var ext = pathname.substring(extIndex);
	DEBUG_MODE && console.log('pathname = ' + pathname);
	switch(true){
		case pathname.match(ROUTE_MAP.download) instanceof Array:
			args = {
				'get' : urlObj.query
			};
			handleDownload(res, args);
			break;
		case ext.match(ROUTE_MAP.action) instanceof Array:
			args = {
				'get' : urlObj.query,
				'post' : postData,
				'pathname' : pathname
			};
			handleAction(res, args);
			break;
		case ext.match(ROUTE_MAP.static) instanceof Array:
			args = {
				'pathname' : pathname,
				'ext' : ext
			};
			handleStatic(res, args);
			break;
		default:
			resHandler.handle404(res, 'no such resource');
			break;
	}
};
/**
 *@param {object} res 
 *@param {object} params
 * */
var handleDownload = function(res, params){
	var filename = params.get.filename;
	if(!filename){
		resHandler.handle404(res, '请指定文件名' + fullFilename);
		return;
	}
	var fullFilename = path.join(uploadBasePath, filename);
	DEBUG_MODE && console.log('filename = ' + fullFilename);
	var matchArray = filename.match(config.DOWNLOAD_MATCH);
	if(!matchArray){
		resHandler.handle404(res, '不允许下载此类文件' + fullFilename);
		return;
	}
	var ext = matchArray[0];
	fs.readFile(fullFilename, 'binary', function(err, data){
		if(err){
			resHandler.handle404(res, fullFilename);
			return;
		}
		var args = {
			'header' : {
				'Content-Type' : CONTENT_TYPE_MAP[ext] || 'text/plain',
				'Content-Disposition' : 'attachment;filename=' + filename
			},
			'body' : data,
			'format' : 'binary'
		};
		resHandler.handle200(res, args);
	});
};
var handleStatic = function(res, params){
	var fullFilename = path.join(staticBasePath, params.pathname);
	fs.readFile(fullFilename, 'binary', function(err, data){
		if(err){
			resHandler.handle404(res, fullFilename);
			return;
		}
		var args = {
			'header' : {
				'Content-Type' : CONTENT_TYPE_MAP[params.ext] || 'text/html'
			},
			'body' : data,
			'format' : 'binary'
		};
		resHandler.handle200(res, args);
	});
};
var handleAction = function(res, params){
	var pathname = params.pathname;
	var lastSlashIndex = pathname.lastIndexOf('/');
	var actionPath = pathname.substring(0, lastSlashIndex);
	var methodName = pathname.substring(lastSlashIndex + 1).replace('.action', '');
	var actionFn = require(path.join(actionBasePath, actionPath))[methodName];
//	console.log('exports = ' + util.inspect(exports, true));
	if(typeof actionFn == 'function'){
		actionFn(params, function(data){
			var args = {
				'header' : {
					'Content-Type' : CONTENT_TYPE_MAP['.json'] || 'text/html'
				},
				'body' : data,
				'format' : 'utf-8'
			};
			resHandler.handle200(res, args);
		});
	}else{
		resHandler.handle404(res, actionPath + '\n' + methodName);
	}
	
};
var resHandler = (function(){
	var resCount = 0;
	var onResEnd = function(){
		DEBUG_MODE && console.log('resCount = ' + (++resCount));
	};
	return {
		handle404 : function(res, msg){
			res.writeHead(404, {"Content-Type": "text/plain"});
			res.write("404 Not Found\n");
			onResEnd();
			res.end(msg);
		},
		handle200 : function(res, params){
			res.writeHead(200, params.header);
			res.write(params.body, params.format);
			onResEnd();
			res.end();
		}
	};
})();
exports.doRouting = doRouting;
