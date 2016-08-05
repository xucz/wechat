/**
 * Created by xuchaozheng on 16/7/26.
 */
'use strict'
var wechat = require('./wechat/wechat');
var config = require('./config');
var wechatApi = new wechat(config.wechat);
exports.reply = function*(message) {
    var result = '';
    if(message.MsgType === 'event') {
        if(message.Event === 'subscribe') {
            if(message.EventKey) {
                console.log('扫描二维码进来');
            }
            result =  'hello,你订阅了一个\r\n,消息id:';+message.MsgId;
        } else if(message.Event === 'unsubscribe') {
            console.log('无情取关');
        } else if(message.Event === 'LOCATION') {
            result = '您上报的位置是:' + message.Latitude + '/'
            +message.Longitude + '-' + message.Precision;
        } else if (message.Event === 'CLICK') {
            result = '你点击了菜单:'+message.EventKey;
        } else if(message.Event === 'SCAN') {
            result = '你点击了菜单:'+message.EventKey + message.Ticket;
        } else if(message.Event === 'VIEW') {
            result = '你点击了菜单中的链接:'+message.EventKey;
        }
    } else if(message.MsgType === 'text'){
        var content = message.Content;
        var reply = '额,你说的:'+content+',太复杂了!';

        if(content === '1') {
            reply = [{
                    title: 'Nodejs',
                    decription: '百度',
                    picUrl: 'https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/bd_logo1_31bdc765.png',
                    url: 'http://www.baidu.com'
                },
                {
                    title: 'GitHub',
                    decription: '好123',
                    picUrl: 'https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/bd_logo1_31bdc765.png',
                    url: 'http://hao123.com'
                }];
        }
        if(content == '5') {
            var data = yield wechatApi.uploadMaterial('image', __dirname + '/1.png');
            reply = {
                type: 'image',
                mediaId: data.media_id
            }
        }

        if(content == '6') {
            var data = yield wechatApi.uploadMaterial('image', __dirname + '/1.png', {
                type: 'image',
                description:'{"title":"nice","introduction":"introduction"}'
            });
            console.log(data);
            reply = {
                type: 'image',
                mediaId: data.media_id,
                description:'这是一个description',
                title:'this is title'
            }
        }

        if(content == '7') {
            var counts = yield wechatApi.countMaterial();
            console.log(counts)
            var list = yield [
                wechatApi.batchMaterial({
                    type: 'image',
                    offset: 0,
                    count: 10
                }),
                wechatApi.batchMaterial({
                    type: 'video',
                    offset: 0,
                    count: 10
                }),
                wechatApi.batchMaterial({
                    type: 'voice',
                    offset: 0,
                    count: 10
                }),
                wechatApi.batchMaterial({
                    type: 'news',
                    offset: 0,
                    count: 10
                })
            ];
            console.log(list);
            reply = '1';
            // var list1 = yield wechatApi.batchMaterial({
            //     type: 'iamge',
            //     offset: 0,
            //     count: 10
            // });
            // var list2 = yield wechatApi.batchMaterial({
            //     type: 'video',
            //     offset: 0,
            //     count: 10
            // });
            // var list3 = yield wechatApi.batchMaterial({
            //     type: 'voice',
            //     offset: 0,
            //     count: 10
            // });
            // var list4 = yield wechatApi.batchMaterial({
            //     type: 'news',
            //     offset: 0,
            //     count: 10
            // });
        }

        if(content == '8') {
            var picData = yield wechatApi.uploadMaterial('image', __dirname + '/1.png', {});

            var media = {
                articles: [{
                    title: 'tututu1',
                    thumb_media_id: picData.media_id,
                    author: 'xu',
                    digest: '摘要',
                    show_cover_pic: 1,
                    content: '没有内容',
                    content_source_url: 'http://www.baidu.com'
                },
                {
                    title: 'tututu2',
                    thumb_media_id: picData.media_id,
                    author: 'xu',
                    digest: '摘要',
                    show_cover_pic: 1,
                    content: '没有内容',
                    content_source_url: 'http://www.baidu.com'
                }]
            };

            var data = yield wechatApi.uploadMaterial('news', media, {});
            console.log(data);
            var result = yield wechatApi.fetchMaterial(data.media_id, 'news', {});

            var items = result.news_item;
            console.log(items)
            var news = [];
            console.log(items)
            items.forEach(function(item) {
                news.push({
                    title: item.title,
                    description: item.digest,
                    picUrl: picData.url,
                    url: item.url
                })
            });
            reply = news;
        }

        result = reply;
    }

    return result;
};