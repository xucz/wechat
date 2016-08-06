/**
 * Created by xuchaozheng on 16/7/19.
 */
'use strict';
var sha1 = require('sha1'),
    // Wechat = require('./wechat'),
    getRawBody = require('raw-body'),
    utils = require('../common/utils'),
    weixin = require('../wx/reply');

module.exports = function(opt){
    return function *(){
        // var w = new Wechat(opt);
        // var t = yield w.fetchAccessToken();
        // console.log(t)

        var token = opt.token;
        var signature = this.query.signature;
        var echostr = this.query.echostr;
        var timestamp = this.query.timestamp;
        var nonce = this.query.nonce;
        var str = [token, timestamp, nonce].sort().join('');

        if (this.method === 'GET') {
            //用于服务器验证
            if(sha1(str) === signature){
                this.body = echostr;
            } else {
                this.body = 'wrong';
            }
        } else if (this.method === 'POST') {
            //微信服务器发来的请求
            if(sha1(str) !== signature){
                this.body = 'wrong';
                return false;
            }
            //获取body数据 xml
            var data = yield getRawBody(this.req, {
               length: this.length,
                limit: '1mb',
                encoding: this.charset
            });

            //xml 转成 json 但不能满足要求的格式
            var content = yield utils.parseXMLAsync(data.toString());
            //转成满足要求的json格式 message 为转换后的js对象
            var message = utils.formartMessage(content.xml);

            //创建回复体
            var content = yield weixin.reply(message);
            //根据发来的请求类型 message , 创建回复xml
            var xml = utils.tpl(content, message);

            this.status = 200;
            this.type = 'application/xml';
            this.body = xml;

            return;
        }

    }
};