/**
 * Created by xuchaozheng on 16/7/6.
 */
'use strict';

var koa = require('koa'),
    g = require('./wechat/g'),
    config = require('./config');

var app = new koa();
app.use(g(config.wechat));

app.listen(3000);