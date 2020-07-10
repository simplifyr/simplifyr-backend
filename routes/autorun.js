var express = require('express');

var router = express.Router();


router.get('/teams/:team/automation/:testsuiteId/', function(req, res) {
    var now = new Date().getTime();
    var resultURL = (req.protocol + '://' + req.get('host') + '/result' + req.path.replace(/\/$/, '') + '/?' + now);
    var redisId = 'auto::' + req.params.team + '::' + req.params.testsuiteId.replace(/\s+/g, '-');
    global.REDIS_CLIENT.get(redisId, (err, testsuite) => {
        //console.log(testsuite);
        if(err) {
            res.json('failed')
        } else {
            var sync = req.query.mode && req.query.mode === 'sync';
            var op = req.query.op || 'all';

            require('../lib/testsuite-runner').runner().init(
                JSON.parse(testsuite), 
                now, 
                sync ? res : undefined, 
                op,
                resultURL,
                redisId);

            if(!sync) {
                res.json({'status': 'running', resultURL});
            }
        }   

    });
});


module.exports = router;
