/**
 * Created by xuchaozheng on 16/7/19.
 */
'use strict';
var fs = require('fs'),
    xml2js = require('xml2js'),
    tpl = require('../wechat/tpl');

exports.readFile = function(fpath, encoding) {
    return new Promise(function(resolve, reject) {
        fs.readFile(fpath, encoding, function(err, content) {
            if(err) reject(err);
            resolve(content);
        });
    });
};
exports.writeFile = function(fpath, content) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(fpath, content, function(err, content) {
            if(err) reject(err);
            resolve(content);
        })
    });
};
exports.parseXMLAsync = function(xml) {
  return new Promise(function(resolve, reject) {
      xml2js.parseString(xml, function(err, content) {
          if(err) reject(err);
          else resolve(content);
      });
  });
};
function formartMessage(result) {
    var message = {};
    if(typeof result === 'object') {
        var keys = Object.keys(result);
        var length = keys.length;
        for (var i = 0; i < length; i++) {
            var item = result[keys[i]];
            var key = keys[i];
            if(!(item instanceof Array) || item.length === 0) {
                continue;
            }
            if(item.length === 1) {
                var val = item[0];
                if(typeof val === 'object') {
                    message[key] = formartMessage(val)
                } else {
                    message[key] = (val || '').trim();
                }
            } else {
                //是一个长度不是1的数组
                message[key] = [];
                for (var j = 0, k = item.length; j < k; j++) {
                    message[key].push(formartMessage(item[j]));
                }
            }
        }
    }
    return message;
}
exports.formartMessage = formartMessage;
exports.tpl = function(content, message) {
    var info = {};
    var type = 'text';
    var fromUserName = message.FromUserName;
    var toUserName = message.ToUserName;

    if(Array.isArray(content)) {
        type = 'news';
    }

    type = content.type || type;

    info.content = content;
    info.createTime = new Date().getTime();
    info.msgType = type;
    info.fromUserName = toUserName;
    info.toUserName = fromUserName;

    return tpl.compile(info);
};