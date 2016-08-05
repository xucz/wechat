/**
 * Created by xuchaozheng on 16/7/20.
 */

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
    api = {
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
        // .then(function(data) {
        // self.access_token = data.access_token;
        // self.expires_in = data.expires_in;
        // utils.writeFile(fpath, JSON.stringify(data));
    // });

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
                url: 'url',
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

        });
    })
};
Wechat.prototype.delMaterial = function(mediaId) {
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
        });
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
        });
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
        });
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
        });
    })
};
/**
 *
 * @param mediaId
 * @param type
 * @param permanent 是否是永久素材
 * @returns {Promise}
 */
module.exports = Wechat;