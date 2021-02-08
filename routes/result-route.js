var express = require('express');

var router = express.Router();
const redisScan = require('node-redis-scan');
const scanner = new redisScan(global.REDIS_CLIENT);

router.get('/teams/:team/automation/:testsuiteId', function(req, res) {
    var whichOne = Object.keys(req.query)[0];
    var keyPrefix =  'result::' + req.params.team + '::' + req.params.testsuiteId + '::';
    global.REDIS_CLIENT.get(keyPrefix + whichOne, function(err, data) {
        scanner.scan(keyPrefix + '*', (err, keys) => {
            res.send(
				index.replace('__DATA__', 
				    JSON.stringify({
						keys,
						data
					})
				).replace(
					'__TITLE__', 
					req.params.testsuiteId.replace(/-/g, ' ')
				)
			);
        });
    });
});

router.get('/teams/:team/automation/:testsuiteId/sfs/:keys', function(req, res) {
	var keys = req.params.keys.split(',');
	global.REDIS_CLIENT.mget(...keys, function(err, result) {
		var index = 0;
		var sfs = result
					.map((r) => JSON.parse(r))
					.map((r1) =>  {
						var sf;
						r1 = typeof r1 != 'string' ? r1 : JSON.parse(r1);
						if(r1.sf) {
							sf = r1.sf;
						} else {
							sf = {
								passed: 0,
								failed: 0,
								total: 0
							};
						}
						sf.key = /(\d+)$/.exec(keys[index])[0];
						return sf;
					});
		res.json({sfs});
	});
    
});





const index = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset='utf-8'>
	<meta name='viewport' content='width=device-width,initial-scale=1'>


	<title>SimplifyR: __TITLE__</title>

	<link rel='icon' id="site-icon" type='image/png' href='/favicon.png'>
	<link rel='stylesheet' href='/global.css'>
	<link rel='stylesheet' href='/build/bundle.css'>
	<link href="https://fonts.googleapis.com/css?family=Fira+Code&display=swap" rel="stylesheet">
	<link href="https://fonts.googleapis.com/css?family=Open+Sans&display=swap" rel="stylesheet">
	<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.0.13/css/all.css">
	<script src='/moment.min.js'></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.7/ace.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.7/ext-language_tools.js"></script>
	<script defer src="https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.4/clipboard.min.js"></script>
	<link rel="stylesheet" href="//cdn.jsdelivr.net/chartist.js/latest/chartist.min.css">
	<script src="//cdn.jsdelivr.net/chartist.js/latest/chartist.min.js"></script>
	<script defer src='/build/bundle.js'></script>
</head>
<body style="padding: 0px; background-color: #fbfbfb">

    <p style="display: none;" id="cdata">__DATA__</p>
</body>
</html>
`

module.exports = router;