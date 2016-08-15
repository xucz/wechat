/**
 * Created by xuchaozheng on 16/7/6.
 */
'use strict';

var koa = require('koa'),
    path = require('path'),
    g = require('./wechat/g'),
    wechat = require('./wechat/wechat'),
    config = require('./config'),
    sha1 = require('sha1'),
    views = require('co-views'),
    render = views(path.join(__dirname, 'page'), {
        ext: 'jade',
        debug: true
    });

var app = new koa();
app.use(require('koa-static')('public'));
app.use(function *(next) {
    if(this.url.indexOf('/movie') > -1) {
        var wechatApi = new wechat(config.wechat);
        var data = yield wechatApi.fetchAccessToken();
        var access_token = data.access_token;
        var ticketData = yield wechatApi.fetchTicket(access_token);
        var ticket = ticketData.ticket;
        var url = this.href.replace(':8000', '');
        var params = sign(ticket, url);
        this.body = yield render('movie', params);
        return;
    }
    yield next;
});
var createNonce = function() {
    return Math.random().toString(36).substr(2, 15);
};
var createTimestamp = function() {
  return parseInt(new Date().getTime() / 1000, 10) + '';
};
function _sign (noncestr, tikcet, timestamp, url) {
    var params = [
        'noncestr=' + noncestr,
        'jsapi_ticket=' + tikcet,
        'timestamp=' + timestamp,
        'url=' + url
    ];

    var str = params.sort().join('&');
    var shasum = sha1(str);

    return shasum;
}
function sign(ticket, url) {
    var noncestr = createNonce();
    var timestamp = createTimestamp();
    var signature = _sign(noncestr, ticket, timestamp, url);

    return {
        noncestr: noncestr,
        timestamp: timestamp,
        signature: signature
    }

}
app.use(g(config.wechat));

app.listen(3000);