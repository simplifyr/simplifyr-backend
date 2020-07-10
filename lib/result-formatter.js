module.exports.toShort = function(tests) {
    var passed = 0;
    for(var test of tests) {
        if(test.result.passed) {
            passed++;
        }
    }

    return {
        passed,
        failed: tests.length - passed,
        total: tests.length
    }
}


module.exports.toAll = function(tests) {
    var allInfo = [];
    for(var test of tests) {
        allInfo.push({
            testTitle: test.title,
            timeTaken: ((test._et - test._st) / 1000).toFixed(2) + 's',
            status: test.result.passed ? 'Passed' : 'Failed'
        });
    }
    return allInfo;
}