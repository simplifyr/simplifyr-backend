var Request = require('request');

var s3 = new global.AWS.S3({ apiVersion: '2006-03-01' });

module.exports.post = function(req) {
    return new Promise(function(resolve, reject) {
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