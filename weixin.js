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
        console.log(message.Event)
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
            // console.log(counts)
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

        if(content == '9') {
            // var group = yield wechatApi.createGroup('新分组');
            // console.log('new group')
            // console.log(group);
            //
            // var groups = yield wechatApi.fetchGroups();
            // console.log('分组列表')
            // console.log(groups);
            //
            // var group2 = yield wechatApi.checkGroup(message.FromUserName);
            // console.log('查看自己分组');
            // console.log(group2);
            //
            // var group = yield wechatApi.moveGroup(message.FromUserName, 100);
            //
            // var group3 = yield wechatApi.checkGroup(message.FromUserName);
            // console.log('移动后');
            // console.log(group3);

            var updateName = yield wechatApi.updateGroup('101', '新名字');
            console.log('修改名称后')
            console.log(updateName);

            var groups2 = yield wechatApi.fetchGroups();
            console.log('分组列表')
            console.log(groups2);

            var deleteGroup = yield wechatApi.deleteGroup(101);
            console.log('删除分组')
            console.log(deleteGroup);

            var groups3 = yield wechatApi.fetchGroups();
            console.log('分组列表')
            console.log(groups3);

            reply = 'Group Done'
        }

        if(content == '10') {
            var user = yield wechatApi.fetchUser(message.FromUserName);
            console.log(user);

            var openIds = [
                    {
                        openid: message.FromUserName,
                        lang: 'en'
                    }
                ];
            var user2 = yield wechatApi.fetchUser(openIds);
            console.log(user2);

            reply = JSON.stringify(user);
        }

        if(content == '11') {
            var userlist = yield wechatApi.listUsers();
            console.log(userlist)

            reply = userlist.total;
        }

        if(content == '12') {

            // var data = yield wechatApi.uploadMaterial('image', __dirname + '/1.jpg', {
            //     type: 'image',
            //     description:'{"title":"nice","introduction":"introduction"}'
            // });
            // 1lcqbhwL9fgKIHTE6-CC8gp8lPDGjknIlyWUAWHp2bo
            var text = {
                content: '这是一个群发'
            };
            var sendResult = yield wechatApi.sendByGroup('text', text, 100);
            console.log(sendResult)

            reply = '1';
        }

        if(content == '13') {
            var text = {
                content: '这是一个preview群发'
            };
            var image = {
                media_id: '1lcqbhwL9fgKIHTE6-CC8gp8lPDGjknIlyWUAWHp2bo'
            }
            // var sendResult = yield  wechatApi.previewMass('text', text, message.FromUserName);
            var sendResult = yield  wechatApi.previewMass('image', image, message.FromUserName);
            console.log(sendResult)

            reply = 'preview done';
        }

        if(content == '14') {
            var sendResult = yield  wechatApi.checkMass(1000000001);
            console.log(sendResult)

            reply = 'checkMass done';
        }
        result = reply;
    }

    return result;
};