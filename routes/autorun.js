var express = require('express');

var PromisedRequest = require('../lib/promisify-req');

var router = express.Router();


router.get('/teams/:team/automation/:testsuiteId/', function(req, res) {
    var now = new Date().getTime();
    var resultURL = process.env.SIMPLIFYR_ROOT + '/result' + req.path.replace(/\/$/, '') + '/?' + now;
    var redisId = 'auto::' + req.params.team + '::' + req.params.testsuiteId.replace(/\s+/g, '-');
    global.REDIS_CLIENT.get(redisId, (err, testsuite) => {
        //console.log(testsuite);
        if(err) {
            res.json('failed')
        } else {
            var sync = req.query.mode && req.query.mode === 'sync';
            var op = req.query.op || 'all';
            testsuite = JSON.parse(testsuite);
            var authRedisId = 'auth-' + redisId;
            global.REDIS_CLIENT.get(authRedisId, async (err, auth) => {
                if (auth) {
                    const req = JSON.parse(auth);
                    const authData = await PromisedRequest.post(req);
                    testsuite = testsuite.map(t => {
                        t.authData = JSON.parse(authData.body);
                        return t;
                    });
                    run();
                } else {
                    run();
                }

                function run() {
                    require('../lib/testsuite-runner')
                        .runner()
                        .init(
                            testsuite, 
                            now, 
                            sync ? res : undefined, 
                            op,
                            resultURL,
                            redisId
                        );
                }

            });

            if(!sync) {
                res.json({'status': 'running', resultURL});
            }
        }   

    });
});


module.exports = router;
