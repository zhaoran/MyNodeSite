/**
 * @author zhaoran02
 */
var x = require('../x.js');
var baidu = x.baidu;
var mongodb = x.mongodb;
var util = require('util');
var reqChartData = function(params, callback) {
    var data = {
        "data" : {
            "data" : "<?xml version='1.0' encoding='utf-8'?><data overview='上周' showIndex='0' tag1='/展现次数/' tag2='/点击次数/' tag3='/点击率/%' tag4='￥/总费用/' selected='4'><record date='2011-09-12' data1='935616' data2='1133' data3='0.1211' data4='1567.1'/><record date='2011-09-13' data1='921623' data2='1084' data3='0.1176' data4='1506.72'/><record date='2011-09-14' data1='929247' data2='1060' data3='0.11410000000000001' data4='1516.39'/><record date='2011-09-15' data1='652874' data2='746' data3='0.11429999999999998' data4='1136.18'/><record date='2011-09-16' data1='2423' data2='1' data3='0.0413' data4='1.89'/><record date='2011-09-17' data1='3344' data2='4' data3='0.1196' data4='9.26'/><record date='2011-09-18' data1='2978' data2='1' data3='0.0336' data4='1.32'/></data>",
            "state" : 0
        },
        "msg" : [],
        "status" : 0,
        "statusInfo" : {}
    }
    console.log('arriving req ' + util.inspect(params));
    var server = new mongodb.Server('127.0.0.1', 27017, {});
    var client = new mongodb.Db('test', server, {});
    client.open(function(err, client) {
        if(err)
            throw err;
        var collection = new mongodb.Collection(client, 'test_collection');
        collection.insert({
            hello : '你好'
        }, {
            safe : true
        }, function(err, objects) {
            if(err)
                throw err;
            if(err && err.message.indexOf('E11000 ') !== -1) {
                //				return;
            }
            client.collection('test_collection', function(err, collection) {
                collection.find(function(err, cursor) {
                    cursor.toArray(function(err, items) {
                        console.log('mongo ' + util.inspect(items));
                        //						console.log('mongo ' + mongodb.tojson(items));
                        callback(util.inspect(items));
                    });
                });
            });
        });
    });
    //	callback(baidu.json.stringify(data));
};
exports.reqChartData = reqChartData;
