var awsReqGenerator = require('../lib/aws-req');
var fs = require('fs');

module.exports.toRequest = function (req) {
    if (req.ssl == 0) {
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
    } else {
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 1;
    }

    if(req._cert != 'none') {
        var caPath =  process.env.CERT_PATH + req._cert;
        req.agentOptions = {
            pfx: fs.readFileSync(caPath),
            passphrase: getPassphrase(req._cert)
        }
    }
    
    var auth = req.auth;
    removeInfoProps(req);
    return auth == 1 ? awsReqGenerator.toAwsReq(req) : req;
}

function removeInfoProps(req) {
    ['ssl', 'auth', '_cert'].forEach(function(prop) {
      delete req[prop];
    });
}


function getPassphrase(cert) {
    return process.env[cert.replace(/\//, '_')] || process.env.DEFAULT_PASSPHRASE;
}

