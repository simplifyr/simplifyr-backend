var express = require('express');

var router = express.Router();

const redisScan = require('node-redis-scan');
const scanner = new redisScan(global.REDIS_CLIENT);

router.post('/teams/', function (req, res) {
    global.REDIS_CLIENT.get(process.env.ADMIN_PASS_KEY, function (err, pass) {
        if (pass == req.body.adminPass) {
            global.REDIS_CLIENT.set('team::' + req.body.teamName,
                'another team', function (err, result) {
                    if (!err) {
                        global.REDIS_CLIENT.set('auth::' + req.body.teamName,
                            req.body.pass, function (err) {
                                res.json({ status: 'OK' });
                        });
                    } else {
                        res.json({ err: 'Something went wrong!' });
                    }
                });
        } else {
            res.json({ err: 'You are not admin!' });
        }
    })
});

//Get all test suites for a team
router.get('/teams/:team/testsuites/', function (req, res) {
    scanner.scan(req.params.team + '::*', (err, keys) => {
        res.json({ keys });
    });
});

//Get test suite for a test suite id
router.get('/teams/:team/testsuites/:testsuiteId', function (req, res) {
    global.REDIS_CLIENT.get(req.params.testsuiteId, (err, testsuite) => {
        res.json({ testsuite });
    });
});

router.get('/key/:key', function (req, res) {
    global.REDIS_CLIENT.get(req.params.key, (err, value) => {
        res.json({ value });
    });
});

router.post('/key/:key', function (req, res) {
    global.REDIS_CLIENT.set(req.params.key, req.body, (err, status) => {
        res.json({ status });
    });
});

//save test suite for a test suite id
router.post('/teams/:team/testsuites/:testsuiteId', function (req, res) {
    var key = req.params.testsuiteId;
    global.REDIS_CLIENT.set(key, req.body, (err, status) => {
        res.json({ status });
        if (!/1$/.test(key)) { // delete the keys @see toOldKey()
            global.REDIS_CLIENT.del(toOldKey(key, -1), function (err, r) {
                console.log(err, r);
            });
            global.REDIS_CLIENT.del(toOldKey(key, +1), function (err, r) {
                console.log(err, r);
            });
        }

    });

    /**
     * 
     * For a key => tcu2k::TS-2309-RS1579196389197::3 
     * it returns tcu2k::TS-2309-RS1579196389197::2 for offset -1 
     * and tcu2k::TS-2309-RS1579196389197::4 for offset +1
     */
    function toOldKey(key, offset) {
        var n = /(::\d+)/.exec(key)[0];
        var oKey = key.replace(n, '');
        n = parseInt(n.replace('::', '')) + offset;
        console.log(oKey + '::' + n);
        return oKey + '::' + n;
    }
});


router.post('/teams/:team/automation/:testsuiteId', function (req, res) {
    var key = req.params.testsuiteId;
    global.REDIS_CLIENT.set(key, req.body, (err, status) => {
        res.json({ status });
    });
});

router.get('/teams/:team/automation/:testsuiteId', function (req, res) {
    global.REDIS_CLIENT.get(req.params.testsuiteId, (err, testsuite) => {
        res.json(JSON.parse(testsuite));
    });
});


router.get('/teams/', function (req, res) {
    scanner.scan('team::*', (err, keys) => {
        res.json(keys);
    });
});

router.get('/sys/info', function (req, res) {
    scanner.scan('access::ip::*', (err, keys) => {
        keys = keys.map((key) => {
            return key
                .replace(/^access::ip::/, 'mem')
                .replace(/\./, 'fdc-')
                .replace(/\./, 'dab-')
                .replace(/\./, 'eda-')
                .replace(/2/g, '-')
                .replace(/8/g, '3z')
                .replace(/5/g, 'OZ');

        });
        res.json(keys);
    });
});

router.get('/certs/:team', function (req, res) {
    scanner.scan('cert::' + req.params.team + '::*', (err, keys) => {
        res.json(keys);
    });
});

router.post('/verify', function (req, res) {
    global.REDIS_CLIENT.get('auth::' + req.body.team, (err, pass) => {
        res.json({
            status: pass === req.body.pass
        });
    });
});



router.get('/access/grant/:ip/:desc', function(req, res) {
    global.REDIS_CLIENT.set('access::ip::' + req.params.ip, req.params.desc, function(err, st) {
        res.json({err, st});
    });
});

router.get('/access/revoke/:ip/', function(req, res) {
    global.REDIS_CLIENT.del('access::ip::' + req.params.ip, function(err, st) {
        res.json({err, st});
    });
});





module.exports = router;