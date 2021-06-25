var Request = require('request');

var s3 = new global.AWS.S3({ apiVersion: '2006-03-01' });

module.exports.post = function(req) {
    if(req.method === 'GET') {
        updateURLForGET(req);
    }
    interpolateAuthData(req);
    return new Promise(function(resolve, reject) {
        console.log('REQ: ', req.method, req.url, req.headers);
        Request(req, function(err, response) {
            if(err) {
                reject(err);
            } else {
                resolve({
                    headers: response.headers,
                    body: response.body,
                    status: {
                        code: response.statusCode,
                        msg: response.statusMessage
                    }
                });
            }
        });
    }).then(function(data) {
        return data;
    }).catch(function(e) {
        return {
            headers: {
                'content-type': 'text/plain'
            },
            body: e.toString(),
            status: {
                code: 600,
                msg: ''
            }
        };
    });
}

function interpolateAuthData(data) {
    const regex = /(@[$a-z0-9_-]+)/g;
    if (data.authData) {
        const keys = Object.keys(data.headers);
        for (let k of keys) {
            let v = data.headers[k];
            let m;

            while ((m = regex.exec(v)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                
                // The result can be accessed through the `m`-variable.
                m.forEach((match, groupIndex) => {
                    let prop = match.substr(1);
                    if (data.authData[prop] !== undefined) {
                        v = v.replace(match, data.authData[prop]);
                    }
                });
            }
            data.headers[k] = v;
        }
    }
}

function updateURLForGET(data) {
    if (data.body && data.body.length > 0) {
        data.url = data.url.split('?')[0] + '?' + data.body.split('\n').join('&');
    }
}

module.exports.getS3File = function(body) {
    return new Promise(function(resolve, reject) {
        s3.getObject(body, function(err, data) {
            if(err) {
                reject(err); 
            } else {
                resolve(data.Body.toString('ascii'));
            }        
        });
    }).then(function(data) {
        return data;
    }).catch(function(e) {
        return {
            err: e.toString().replace(/^Error:\s+/, '')
        };
    });
}

module.exports.getS3FileList = function(body) {
    return new Promise(function(resolve, reject) {
        s3.listObjects(body, function(err, data) {
            if(err) {
                reject(err); 
            } else {
                resolve(data);
            }        
        });
    }).then(function(data) {
        return data;
    }).catch(function(e) {
        return {
            err: e.toString().replace(/^Error:\s+/, '')
        };
    });
}