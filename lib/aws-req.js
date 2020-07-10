var aws4 = require('aws4');
var crypto = require("crypto-js");

module.exports.toAwsReq = function(req) {
    var params = toParam(req);
    var nR = aws4.sign(params, params.cred);
    req.headers = nR.headers;
    return req;
}


function toParam(req) {
    var method = "method",
        path = "path",
        host = "host",
        region = "region",
        service = "service",
        x_api_key = "x-api-key",
        x_txn_id = "X-Transaction-ID",
        content_type = "Content-Type";
  
  
    var param = {
      headers: {
        "X-Amz-Content-Sha256": crypto.enc.Hex.stringify(crypto.SHA256(req.body))
      },
      cred: {}
    };
  
    param[method] = req[method];
    param[path] = req.headers[path];
    param[host] = req.headers.Host,
    param[region] = req.headers[region];
    param[service] = 'execute-api';
    param.body = req.body;
    param.headers[x_api_key] = req.headers[x_api_key];
    param.headers[x_txn_id] = req.headers[x_txn_id];
    param.headers[content_type] = req.headers[content_type];
    param.cred.accessKeyId = req.headers.accesskey;
    param.cred.secretAccessKey = req.headers.secretkey;
    return param;
  }
  
