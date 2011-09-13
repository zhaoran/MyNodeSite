/**
 * @author zhaoran02
 */
var path = require('path');

var siteBasePath = path.join(__dirname, '../');
var staticBasePath = path.join(siteBasePath, 'static');
var actionBasePath = path.join(siteBasePath, 'action');
var uploadBasePath = path.join(siteBasePath, 'upload');

var CONTENT_TYPE_MAP = {
		'.html' : 'text/html',
		'.css' : 'text/css',
		'.js' : 'text/javascript;charset=UTF-8',
		'.json' : 'application/json;charset=UTF-8',
		'.txt' : 'text/plain',
		'.gif' : 'image/gif',
		'.jpg' : 'image/jpeg',
		'.jpeg' : 'image/jpeg',
		'.png' : 'image/x-png',
		'.ico' : 'image/x-icon',
		'.zip' : 'application/zip',
		'.exe' : 'application/octet-stream'
};
var ROUTE_MAP = {
	'download' : /downloadFile.action/,
	'action' : /.action/,
	'static' : /.html|.css|.js|.ico|.gif/
};
var DOWNLOAD_MATCH = /(.txt|.zip|.exe)$/g;
var DEBUG_MODE = true;

exports.staticBasePath = staticBasePath;
exports.actionBasePath = actionBasePath;
exports.uploadBasePath = uploadBasePath;
exports.CONTENT_TYPE_MAP = CONTENT_TYPE_MAP;
exports.ROUTE_MAP = ROUTE_MAP;
exports.DEBUG_MODE = DEBUG_MODE;
exports.DOWNLOAD_MATCH = DOWNLOAD_MATCH;