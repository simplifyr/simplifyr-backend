var express = require('express');
var PromisedRequest = require('../lib/promisify-req');
var Util = require('../lib/util');
var fs = require('fs');

var router = express.Router();

router.post('/post-test', async function (req, res) {
  var data = await PromisedRequest.post(Util.toRequest(req.body));
  res.json(data);
});

router.post('/s3-file-list', async function (req, res) {
  var resposnse  = await PromisedRequest.getS3FileList(req.body);
  res.json(resposnse);
});

router.post('/s3-file', async function(req, res) {
  var resposnse  = await PromisedRequest.getS3File(req.body);
  res.send(resposnse);
});

router.post('/add-new-cert', function(req, res) {
  var key = req.body.key;
  var dir = process.env.CERT_PATH + req.body.team + '/';
  var redisKey = 'cert::' + req.body.team + '::' + key;
  var envKey = req.body.team + '_' + key.replace(/[-]/g, '_');

  try {
    fs.mkdirSync(dir);
  } catch(ee) {}

  if(req.files) {
    req.files.cert.mv(dir + key, function(err) {
      if(!err) {
        var envExportStmt = 'export ' + envKey + '=' + req.body.pass + '\n';
        fs.appendFile(process.env.ENV_FILE, envExportStmt, function(e) {
          if(e) {
            res.json({'err': 'EENV'});
          } else {
            process.env[envKey] = req.body.pass;
            global.REDIS_CLIENT.set(redisKey, '[SimplifyR]', (error) => {
              if(!error) {
                res.json({'status': 'OK'});
              } else {
                res.json({'err': 'ERDS'});
              }
            });
          }
        });
      } else {
        res.json({'err': 'EMV'});
      }
    });
  } else {
    res.json({'err': 'ENF'});
  }
  
});



module.exports = router;


/***
 *
 * Humme mushkil pasandi zindagi ke samt le aayi
 * Boht asaan tha marna hum asani se marr jaate
 *
 */