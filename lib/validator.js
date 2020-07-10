var RJQL = require('./validators/rjql');
var TextMatcher = require('./validators/text');
var Regex = require('./validators/regex');


module.exports.validate = function(test) {
    var validationFunction = getAlgo(test);
    try {
        test.result = {
            overAll: {
                total: 1,
                passed: 0
            }
        };
        if(test.apiErr) {
            test.result.passed = false;
            test.result.verb = 'There was an API error';
        } else {
            if(!test._response) {
                test.result.verb = 'Output file was not found on S3';
                if (test.query != '__NA__') {
                    test.result.passed = false;
                } else {
                    test.result.passed = true;
                    test.result.overAll.passed++;
                }
            } else {
                test.result = validationFunction(test._response, test.query);
            }
        }
    } catch(e) {
        console.log(e);
        test.result = {
            passed: false,
            verb: e,
            overAll: {
                total: 1,
                passed: 0
            }
        }
    }
}

function getAlgo(test) {
    switch(parseInt(test.validator)) {
        case 0:
            return RJQL.consolidated;
        case 1:
            return TextMatcher.matchText;
        case 2:
            return Regex.validateRegex;
    }
}
