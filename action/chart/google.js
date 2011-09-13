/**
 * @author zhaoran02
 */
var x = require('../x.js');
var baidu = x.baidu;
var util = require('util');
var reqGoogleChartData = function(params, callback){
	console.log('arriving req ' + util.inspect(params));
	callback(baidu.json.stringify(params));
};
exports.reqGoogleChartData = reqGoogleChartData;