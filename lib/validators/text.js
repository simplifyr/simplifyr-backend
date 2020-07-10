module.exports.matchText = function(_response, qry) {
    var result = {
        verb: '',
        passed:  true,
        overAll: {
            passed: 0,
            total: 1
        }
    };
    if(typeof _response != 'string') {
        _response = JSON.stringify(_response);
    }

    if(_response != qry) {
        result.verb = 'Response doesn\'t match with the expected output';
        result.passed = false;
        result.errLineNo = 1;
    } else {
        result.overAll.passed++;
    }
    return result;
}