var Util = require('./util');
var PromisedRequest = require('./promisify-req');
var validator = require('./validator');
var moment = require('moment');
var ResultFormatter = require('./result-formatter');

var log = false;

module.exports.runner = function () {

    var tests = null;
    var currentTest = 0;
    var httpResponse;
    var opFormat;
    var resultURL;
    var redisId;

    function init(t, now, res, op, url, key) {
        tests = t;
        httpResponse = res;
        id = now;
        opFormat = op;
        resultURL = url;
        redisId = key.replace(/^auto/, 'result') + '::' + now;
        currentTest = 0;
        run();
    };


    function hasNext() {
        return currentTest < tests.length;
    }

    async function run() {
        var test = tests[currentTest];
        if (test) {
            test._st = new Date().getTime();
            saveStateInRedis({
                done: false,
                currentTest,
                total: tests.length
            });
            currentTest++;
            test.attempts = 0;
            test.apiErr = false;
            var _req = Util.toRequest(test.req);
            __logit(redisId + '   Sending API request');
            test._apiResponse = await PromisedRequest.post(_req);
            __logit(redisId + '   API Responded, has error ? ' + (test._apiResponse.status.code === 600));
            test._response = test._apiResponse;
            if (test._apiResponse.status.code === 600) {
                test.apiErr = true;
            }
            if (!test.apiErr && test.output.type === 's3') {
                __logit(redisId + '   Going to sync with s3');
                syncS3(test);
            } else {
                __logit(redisId + '   API Response is final response, no s3 involved');
                setFinalResponse(test);
            }
        } else {
            __logit(redisId + '   Test is undefined');
            __logit(redisId + '   Tests size' + tests.length + ' currentTest: ' + currentTest);

        }
    }


    function setFinalResponse(test) {
        if (test) {
            __logit(redisId + '   Validating test');
            validator.validate(test);
            delete test.req;
            delete test.output;
            test._et = new Date().getTime();
        }
        if (hasNext()) {
            __logit(redisId + '   Have more tests to run.\n\n');
            run();
        } else {
            var sf = ResultFormatter.toShort(tests);
            saveStateInRedis({
                done: true,
                result: tests,
                sf
            })
            if (httpResponse) {
                httpResponse.json(formattedOP(tests, sf));
                __logit(redisId + '   Sent sync mode response.');
            }
        }
    }

    async function syncS3(test) {
        test.attempts++;
        __logit(redisId + '   Getting files from s3');
        var files = await getS3Files(test);
        __logit(redisId + '   Got ' + (files ? files.length : 0) + ' files from s3');
        if (files && files.length > 0) {
            __logit(redisId + '    Looking for appropriate file');
            var awsApiDate = new Date(test._apiResponse.headers.date).getTime();
            __logit(redisId + '    API response date:' + awsApiDate);
            var found = false;
            for (var f of files) {
                var lastModified = new Date(f.cd).getTime();
                if (isTargetFile(awsApiDate, lastModified)) {
                    __logit(redisId + '   Found target file ' + f.Key);
                    delete f.cd;
                    __logit(redisId + '   Reading file ' + f.Key);
                    test._response = await PromisedRequest.getS3File(f);
                    __logit(redisId + '   Reading file ' + f.Key + ' [DONE]');
                    try {
                        test._response = JSON.parse(test._response);
                    } catch (e) { }
                    setFinalResponse(test);
                    found = true;
                    break;
                }
            }
            if (!found) {
                syncS3Again(test);
            }
            __logit(redisId + '   Sync s3 completed');
        } else {
            syncS3Again(test)
        }
    }

    function syncS3Again(test) {
        if (test.attempts < 50) {
            syncS3(test);
        } else {
            setFinalResponse(test);
        }
    }


    async function getS3Files(test) {
        var reqBody = interpolateVariables(test.output);
        delete reqBody["type"];
        return toS3FileMap(await PromisedRequest.getS3FileList(reqBody));
    }


    function interpolateVariables(s3Param) {
        var trgt = Object.assign({}, s3Param);
        var varPattern = /(\$(\w+){([A-Za-z-]+)})/;
        if (varPattern.test(trgt.Prefix)) {
            var parts = varPattern.exec(trgt.Prefix);
            if (parts[2] === 'date') {
                trgt.Prefix = trgt.Prefix.replace(parts[0], moment().format(parts[3].toUpperCase()));
            }
        }
        return trgt;
    }

    function toS3FileMap(res) {
        var newFiles = [];
        var files = res.Contents;
        __logit(files.length, ' in contents');
        if (s3Files.size != files.length) {
            for (var i = 0; i < files.length; i++) {
                var f = files[i];
                if (!s3Files[f.Key]) {
                    s3Files[f.Key] = '0xcafebabe';
                    s3Files.size++;
                    newFiles.push({
                        Bucket: res.Name,
                        Key: f.Key,
                        cd: f.LastModified
                    });
                }
            }   
        }
        return newFiles;
    }

    var s3Files = {
        size: 0
    };

    function isTargetFile(aws, lm) {
        return lm - aws <= 80000;
    }


    function formattedOP(tests, shortForm) {
        var _op;
        switch (opFormat) {
            case 'short':
                _op = shortForm;
                break;
            case 'all':
                shortForm.result = ResultFormatter.toAll(tests);
                _op = shortForm;
                break;
        }
        _op.resultURL = resultURL;
        return _op;
    }


    function saveStateInRedis(state) {
        global.REDIS_CLIENT.set(redisId, JSON.stringify(state), (err, status) => {
            if (!err) { __logit(redisId + '   state saved!'); }
        });
    }

    function __logit(msg) {
        if (log) {
            console.log(msg);
        }
    }

    return {
        init
    };
};
