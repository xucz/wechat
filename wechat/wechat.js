/**
 * Created by xuchaozheng on 16/7/20.
 */
'use strict';
/**
 * 微信权限验证
 * @type {request}
 */
var request = require('request'),
    utils = require('../common/utils'),
    fpath = __dirname+ '/token.json',
    _ = require('lodash'),
    fs = require('fs'),
    prefix = 'https://api.weixin.qq.com/cgi-bin/',
    mpPrefix = 'https://mp.weixin.qq.com/cgi-bin/',
    semanticUrl = 'https://api.weixin.qq.com/semantic/semproxy/search?',
    api = {
        semanticUrl: semanticUrl,
        accessToken: prefix + 'token?grant_type=client_credential',
        temporary: {
            upload: prefix + 'media/upload?',
            fetch: prefix + 'media/get?'
        },
        permanent: {
            upload: prefix + 'material/add_material?',
            fetch: prefix + 'material/get_material?',
            del: prefix + 'material/del_material?',
            update: prefix + 'material/update_news',
            uploadNews: prefix + 'material/add_news?',
            uploadNewsPic: prefix + 'material/uploadimg?',
            count: prefix + 'material/get_materialcount?',
            batch: prefix + 'material/batchget_material?'
        },
        group: {
            create: prefix + 'groups/create?',
            fetch: prefix + 'groups/get?',
            check: prefix + 'groups/getid?',
            update: prefix + 'groups/update?',
            move: prefix + 'groups/members/update?',
            batchupdate: prefix + 'groups/members/batchupdate?',
            del: prefix + 'groups/delete?'
        },
        user: {
            remark: prefix + 'user/info/updateremark?',
            fetch: prefix + 'user/info?',
            batchFetch: prefix + 'user/info/batchget?',
            list: prefix + 'user/get?'
        },
        mass: {
            group: prefix + 'message/mass/sendall?',
            sendByOpenId: prefix + 'message/mass/send?',
            del: prefix + 'message/mass/delete?',
            preview: prefix + 'message/mass/preview?',
            check: prefix + 'message/mass/get?'
        },
        menu: {
            create: prefix + 'menu/create?',
            get: prefix + 'menu/get?',
            del: prefix + 'menu/delete?',
            current: prefix + 'get_current_selfmenu_info?'
        },
        qrcode: {
            create: prefix + 'qrcode/create?',
            show: mpPrefix + 'showqrcode?',
            shortUrl: prefix + 'shorturl?'
        }
    };

var Wechat = function(opts) {
    var self = this;
    this.appId = opts.appId;
    this.appSecret = opts.appSecret;
    utils.readFile(fpath, 'utf-8').then(function(data) {
        try {
            data = JSON.parse(data);
        } catch(e) {
            return self.updateAccsssToken();
        }

        if(self.isValidAccessToken(data)) {
            return Promise.resolve(data)
        } else {
            return self.updateAccsssToken();
        }
    });

};
Wechat.prototype.updateAccsssToken = function() {
    var url = api.accessToken + '&appid=' + this.appId + '&secret=' + this.appSecret;
    return new Promise(function(resolve, reject) {
        request.get({
            url: url,
            json: true
        }, function(error, respone, body) {
            if(!error && respone.statusCode != 200) {
                reject(error);
            }
            var data = body;
            var now = new Date().getTime();
            var expries_in = (data.expires_in - 20) * 1000;
            data.expires_in = now + expries_in;
            utils.writeFile(fpath, JSON.stringify(data)).then(function(){
                resolve(data);
            })
        });
    });
};
Wechat.prototype.isValidAccessToken = function(data) {
    if(!data || !data.access_token || !data.expires_in) {
        return false;
    }

    // var access_token = data.access_token;
    var expires_in = data.expires_in;
    var now = (new Date()).getTime();

    if(now < expires_in) {
        return true;
    } else {
        return false;
    }
};
Wechat.prototype.fetchAccessToken = function() {
    var self = this;
    return utils.readFile(fpath, 'utf-8').then(function(data) {
        try {
            data = JSON.parse(data);
        } catch(e) {
            return self.updateAccsssToken();
        }

        if(self.isValidAccessToken(data)) {
            return Promise.resolve(data)
        } else {
            return self.updateAccsssToken();
        }
    });
};
/**
 *
 * @param type
 * @param material 如果是图文 则是数组;否则是一个文件路径
 * @param permanent 额外配置项
 * @returns {Promise}
 */
Wechat.prototype.uploadMaterial = function(type, material, permanent) {

    var self = this;
    var form = {};
    var uploadUrl = api.temporary.upload;

    if (permanent) {
        uploadUrl = api.permanent.upload;
        _.extend(form, permanent);
    }

    if(type === 'pic') {
        uploadUrl = api.permanent.uploadNewsPic;
    }

    if(type === 'news') {
        uploadUrl = api.permanent.uploadNews;
        form = material;
    } else {
        form.media = fs.createReadStream(material)
    }
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = uploadUrl + 'access_token=' + data.access_token;

            if(!permanent) {
                url = url + '&type=' +type;
            } else {
                form.access_token = data.access_token;
            }
            var options = {
                method: 'POST',
                url: url,
                json: true
            };

            if(type === 'news') {
                options.body = form;
            } else {
                options.formData = form;
            }
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('upload error');
                }
            })
        });
    })
};
Wechat.prototype.fetchMaterial = function(mediaId, type, permanent) {
    var self = this;
    var fetchUrl = api.temporary.fetch;
    if (permanent) {
        fetchUrl = api.permanent.fetch;
    }
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = fetchUrl + 'access_token=' + data.access_token + '&media_id=' + mediaId;

            var options = {
                method: 'POST',
                url: url,
                json: true
            };
            var form = {};
            if(permanent) {
                form.media_id = mediaId;
                form.access_token = data.access_token;
                options.body = form;
            } else {
                if(type === 'video') {
                    url = url.replace('https://', 'http://');
                }
                url += '&media_id=' + mediaId;
                options.url = url;
            }
            if(type === 'news' || type === 'video') {
                request(options, function(err, response, body) {
                    if(body)
                        resolve(body);
                    else {
                        throw new Error('delete error');
                    }
                });
            } else {
                resolve(url);
            }

        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.deleteMaterial = function(mediaId) {
    var self = this;
    var form = {
        media_id: mediaId
    };
    var fetchUrl = api.temporary.fetch;
    if (permanent) {
        fetchUrl = api.permanent.fetch;
    }
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = fetchUrl + 'access_token=' + data.access_token + '&media_id=' + mediaId;

            var options = {
                method: 'POST',
                url: url,
                body: form,
                json: true
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('delete error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.updateMaterial = function(mediaId, news) {
    var self = this;
    var form = {
        media_id: mediaId
    };
    _.extend(form, news);

    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.permanent.update + 'access_token=' + data.access_token + '&media_id=' + mediaId;

            var options = {
                method: 'POST',
                url: url,
                json:true,
                body: form
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('update error');
                }
            })
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.countMaterial = function() {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {

            var url = api.permanent.count + 'access_token=' + data.access_token;
            console.log(url)
            var options = {
                method: 'GET',
                url: url,
                json: true
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('count error');
                }
            })
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.batchMaterial = function(options) {
    var self = this;

    options.type = options.type || 'iamge';
    options.offset = options.offset || 0;
    options.count = options.count || 1;

    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {

            var url = api.permanent.batch + 'access_token=' + data.access_token;
            request({
                method: 'POST',
                url: url,
                json: true,
                body: options
            }, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('count error');
                }
            })
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.createGroup = function(name) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.group.create + 'access_token=' + data.access_token;
            var form = {
                group: {
                    name: name
                }
            };
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: form
            };

            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('createGroup error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.fetchGroups = function() {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.group.fetch + 'access_token=' + data.access_token;
            var options = {
                method: 'GET',
                url: url,
                json: true
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('fetchGroups error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.checkGroup = function(openId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.group.check + 'access_token=' + data.access_token;
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: {
                    openid: openId
                }
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('checkGroup error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.updateGroup = function(id, name) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.group.update + 'access_token=' + data.access_token;
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: {
                    group: {
                        id: id,
                        name: name
                    }
                }
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('updateGroup error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.moveGroup = function(openId, toId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var options = {
                method: 'POST',
                json: true,
            };
            if(_.isArray(openId)) {
                options.url = url = api.group.batchupdate + 'access_token=' + data.access_token;;
                options.body = {
                    openid_list: openId,
                    to_groupid: toId
                }
            } else {
                options.url = api.group.move + 'access_token=' + data.access_token;
                options.body = {
                    openid: openId,
                    to_groupid: toId
                };

            }
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('moveGroup error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.batchMoveGroup = function(openIds, toId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.group.batchupdate + 'access_token=' + data.access_token;
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: {
                    openid_list: openIds,
                    to_groupid: toId
                }
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('moveGroup error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.deleteGroup = function(id) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.group.del + 'access_token=' + data.access_token;
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: {
                    group: {
                        id: id
                    }
                }
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('moveGroup error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.remarkUser = function(openId, remark) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.user.remark + 'access_token=' + data.access_token;
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: {
                    openid: openId,
                    remark: remark
                }
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('remarkUser error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
/**
 *
 * @param openId 为数组则为批量获取用户信息
 * @param lang
 */
Wechat.prototype.fetchUser = function(openId, lang) {
    var self = this;
    lang = lang || 'zh_CN';
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.user.batchFetch + 'access_token=' + data.access_token;
            var options = {
                method: 'POST',
                json: true,
                url: url
            };

            if(_.isArray(openId)) {
                options.body = {
                    "user_list": openId
                };
            } else {
                options.url = api.user.fetch + 'access_token=' + data.access_token + '&openid=' + openId + '&lang='+lang;
                options.method = 'GET';
            }

            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('fetchUser error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
/**
 * 批量获取用户信息
 * @param openIds
 */
Wechat.prototype.batchFetchUsers = function(openIds) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.user.batchFetch + 'access_token=' + data.access_token;
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: {
                    openid: openIds
                }
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('batchFetchUsers error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
/**
 * 获得关注者的列表
 * @param openId
 */
Wechat.prototype.listUsers = function(openId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.user.list + 'access_token=' + data.access_token;
            if(openId) {
                url += '&next_openid' + openId
            }
            var options = {
                method: 'GET',
                url: url,
                json: true
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('listUsers error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.sendByGroup = function(type, message, groupId) {
    var self = this;
    var msg = {
        filter: {},
        msgtype: type
    };
    msg[type] = message;
    if(!groupId) {
        msg.filter.is_to_all = true;
    } else {
        msg.filter.is_to_all = false;
        msg.filter.group_id = groupId
    }
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.mass.group + 'access_token=' + data.access_token;
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: msg
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('sendAll error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.sendByGroup = function(type, message, groupId) {
    var self = this;
    var msg = {
        filter: {},
        msgtype: type
    };
    msg[type] = message;
    if(!groupId) {
        msg.filter.is_to_all = true;
    } else {
        msg.filter.is_to_all = false;
        msg.filter.group_id = groupId
    }
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.mass.group + 'access_token=' + data.access_token;
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: msg
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('sendAll error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.sendByOpenId = function(type, message, openIds) {
    var self = this;
    var msg = {
        msgtype: type,
        touser: openIds
    };
    msg[type] = message;

    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.mass.group + 'access_token=' + data.access_token;
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: msg
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('sendByOpenId error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.deleteMass = function(msgId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.mass.del + 'access_token=' + data.access_token;
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: {
                    msg_id: msgId
                }
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('deleteMass error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.previewMass = function(type, message, openId) {
    var self = this;
    var msg = {
        msgtype: type,
        touser: openId
    };
    msg[type] = message;

    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.mass.preview + 'access_token=' + data.access_token;
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: msg
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('previewMass error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.checkMass = function(msgId) {
    var self = this;

    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.mass.check + 'access_token=' + data.access_token;
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: {
                    msg_id: msgId
                }
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('checkMass error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.createMenu = function(menu) {
    var self = this;

    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.menu.create + 'access_token=' + data.access_token;
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: menu
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('createMenu error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.getMenu = function() {
    var self = this;

    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.menu.get + 'access_token=' + data.access_token;
            var options = {
                method: 'GET',
                url: url,
                json: true
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('getMenu error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
/**
 * 删除当前菜单 粗暴!
 */
Wechat.prototype.deleteMenu = function() {
    var self = this;

    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.menu.del + 'access_token=' + data.access_token;
            var options = {
                method: 'GET',
                url: url,
                json: true
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('deleteMenu error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
/**
 * 获得当前菜单配置信息
 */
Wechat.prototype.getCurrentMenu = function() {
    var self = this;

    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.menu.current + 'access_token=' + data.access_token;
            var options = {
                method: 'GET',
                url: url,
                json: true
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('currentMenu error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
/**
 * 只有服务号才能使用
 * @param qr
 */
Wechat.prototype.createQrcode = function(qr) {
    var self = this;

    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.qrcode.create + 'access_token=' + data.access_token;
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: qr
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('createQrcode error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
Wechat.prototype.showQrcode = function(ticket) {
    return api.qrcode.show + 'ticket=' + encodeURI(ticket);
};
Wechat.prototype.createShortQrcode = function(url, action) {
    var self = this;
    action = action || 'long2short'
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.qrcode.shortUrl + 'access_token=' + data.access_token;
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: {
                    action: action,
                    long_url: url
                }
            };
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('createShortQrcode error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
/**
 * 暂时不知道怎么使用
 * @param semanticData
 */
Wechat.prototype.semantic = function(semanticData) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.fetchAccessToken().then(function(data) {
            var url = api.semanticUrl + 'access_token=' + data.access_token;
            semanticData.appid = self.appId;
            var options = {
                method: 'POST',
                url: url,
                json: true,
                body: semanticData
            };
            console.log(options)
            request(options, function(err, response, body) {
                if(body)
                    resolve(body);
                else {
                    throw new Error('semantic error');
                }
            });
        }).catch(function(err) {
            reject(err);
        })
    })
};
module.exports = Wechat;