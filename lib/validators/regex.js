module.exports.validateRegex = function(_response, qry) {
    var result = {
        verb: '',
        passed:  true,
        overAll: {
            passed: 0,
            total: 1
        }
    };
    var r = _response;
    if(typeof r != 'string') {
        r = JSON.stringify(r);
    }
    try {
        var re = new RegExp('^' + qry + '$');
        if(!re.test(r)) {
            result.passed = false;
            result.verb = 'The RegEx pattern <b>' + qry + '</b> was not found in the response';
            result.errLineNo = 1;
        } else {
            result.overAll.passed++;
        }
    } catch(e) {
        result.verb = 'Regular Express in the query is not valid';
        result.errLineNo = 1;
    }

    return result;

}