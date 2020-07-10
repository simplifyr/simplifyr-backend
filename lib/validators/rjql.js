(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.rjql = {}));
}(this, (function (exports) { 'use strict';

    var validateRegex = function(valueToBeTested, QVE) {
        var regexPattern = QVE.replace(/\$regex{\/?/, '').replace(/\/?}$/, '');
        var regex = new RegExp(regexPattern);
        var result = regex.test(valueToBeTested);
        return {
            result,
            verb: !result ? '<b>' + valueToBeTested + '</b> doesn\'t match the regex pattern specified' : ''
        }
    };

    var regex = {
    	validateRegex: validateRegex
    };

    var validateSort = function(resultArray, QVE) {
        var clonedArray = resultArray.slice(0);
        var propertyToSort = /^\$[ad]sort({(\w+)})?$/.exec(QVE)[1];
        var ascendingOrder = /asort/.test(QVE);

        if(!clonedArray) {
            return {
                result: false,
                verb: 'Expected an array, found ' + clonedArray 
            };
        } else if(clonedArray.length <= 1) {
            return {
                result: clonedArray.length == 0 ? false : true,
                verb: clonedArray.length == 0 ? 'Empty array found' : ''
            }
        }

        if(propertyToSort) {
            if (typeof (clonedArray[0][propertyToSort]) === 'string') {
                clonedArray.sort(function (a, b) {
                    if(a[propertyToSort] < b[propertyToSort]) {
                        return ascendingOrder ? -1 : 1;
                    } else if(a[propertyToSort] > b[propertyToSort])  {
                        return ascendingOrder ? 1 : -1;
                    } else {
                        return 0;
                    }
                });
            } else {
                clonedArray.sort(function (a, b) {
                    return ascendingOrder ? 
                        (a[propertyToSort] - b[propertyToSort]) :
                         (b[propertyToSort] - a[propertyToSort]);
                });
            }

        } else {
            //write for array of primitives
            if(typeof(clonedArray[0])==='string') {
    			ascendingOrder? clonedArray.sort(): clonedArray.reverse();
    	    }
    		else {
    			clonedArray.sort(function(a,b) {
    				return ascendingOrder ? a - b : b - a;
    		    });
    		}
        }
       
        var result = isEqual(resultArray, clonedArray, propertyToSort);
        return {
            result,
            verb: !result ? ('Expected the array to be sorted in <b>' + 
                    (ascendingOrder ? 'ascending' : 'descending') + '</b> order ' +
                     (propertyToSort ? ' based on property <b>"' + propertyToSort + '"</b>' : '')) : ''
        }
    };

    function isEqual(resultArray, clonedArray, propertyToSort) {
        var equal = true;
        if(propertyToSort) {
            for (var i = 0; i < resultArray.length; i++) {
                if (resultArray[i][propertyToSort] != clonedArray[i][propertyToSort]) {
                    equal = false;
                    break;
                }
            }
        } else {
            for (var i = 0; i < resultArray.length; i++) {
                if (resultArray[i] != clonedArray[i]) {
                    equal = false;
                    break;
                }
            }
        }   
        return equal;
    }

    var sort = {
    	validateSort: validateSort
    };

    var uuidPattern = /^[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}$/;

    var validateUUID = function(valueTobeTested) {
        var result = uuidPattern.test(valueTobeTested);
        return  {
            result,
            verb: !result ? 'Expected UUID, found ' + valueTobeTested : ''
        }
    };

    var uuid = {
    	validateUUID: validateUUID
    };

    //something = "$in{'abc', 'def', 'xyz'}"

    var validateIn = function(resultArray, QVE) {
        var values = QVE.replace(/^\$in{/, '').replace(/}$/, '');
        var map = toValueMap(values.split(/,\s*/));
        var result = true;
        if(!resultArray[Symbol.iterator] || typeof resultArray == 'string') {
            resultArray = [resultArray];
        }
        for(var o of resultArray) {
            if(!map[o]) {
                result = false;
                break;
            }
        }
        return {
            result,
            verb: !result ? '<b>' + o + '</b> wasn\'t expected in {' + values + '}' : ''
        }
    };

    function toValueMap(values) {
        var map = {};
        var DEF = '_';
        for(var val of values) {
            val = val.replace(/^'/, '').replace(/'$/, '');
            map[val] = DEF;
        }
        return map;
    }

    var _in = {
    	validateIn: validateIn
    };

    var ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    var validateIP = function(valueTobeTested) {
        var result = ipPattern.test(valueTobeTested);
        return  {
            result,
            verb: !result ? 'Expected IP Address, found ' + valueTobeTested : ''
        }
    };

    var ip = {
    	validateIP: validateIP
    };

    var evaluate_1 = function(result, operator, targetValue) {
        targetValue = toTarget(targetValue);
        if (operator === '=') {
            return result == targetValue;
        } else if (operator === '<>') {
            return result != targetValue;
        } else if (operator === '~') {
            return result.indexOf(targetValue) >= 0;
        } else {
            targetValue = Number(targetValue);
            result = Number(result);
            switch (operator) {
                case '>':
                    return result > targetValue;
                case '>=':
                    return result >= targetValue;
                case '<':
                    return result < targetValue;
                case '<=':
                    return result <= targetValue;
            }
        }

        function toTarget(v) {
            return v[0] === '"' && v[v.length - 1] === '"' ?
                    v.replace(/^"/, '').replace(/"$/, '') : v;
        }
    };

    var evaluate = {
    	evaluate: evaluate_1
    };

    const evaluate$1 = evaluate.evaluate;

    var count_1 = function(qry, arr) {
        var _count = 0;
        var opts = /^\$(count|max|min|avg|sum)\{(.+)\}\s(=|<|>|<=|>=)\s(.+)/.exec(qry);
        var propToCount = opts[2];
        var forValue;
        var i = propToCount.indexOf(':');
        if(i >= 0) {
            var temp = propToCount.substr(0, i).trim();
            var exp = propToCount.substr(i + 1).trim().replace(/^\//, '').replace(/\/$/, '');
            forValue = new RegExp(exp);
            propToCount = temp;
        }
       
        for(var o of arr) {
            var propValue = o[propToCount];
            if(propValue) {
                if(forValue) {
                    if(forValue.test(propValue)) {
                        _count++;
                    }
                } else {
                    _count++;
                }
            }  
        }
        var status = evaluate$1(_count, opts[3], opts[4]);
        
        return {
            value: _count,
            status,
            verb: (status ? '' : 'Count ' + _count + ' didn\'t match the expected count ' + opts[4])
        };
    };

    var count = {
    	count: count_1
    };

    const evaluate$2 = evaluate.evaluate;

    var sum_1 = function(qry, arr) {
        var opts = /^\$(count|max|min|avg|sum)\{(.+)\}\s(=|<|>|<=|>=)\s(.+)/.exec(qry);
        var propToAdd = opts[2];
        var _sum = 0;

        for(var o of arr) {
            var _v = o[propToAdd];
            if(_v) {
                try {
                _v = Number(_v);
                } catch(e) {}
                _sum += _v;
            }
        }

        var status = evaluate$2(_sum, opts[3], opts[4]);

        return {
            value: _sum,
            status,
            verb: (status ? '' : 'Sum ' + _sum + ' didn\'t match the expected sum ' + opts[4])
        };
        
    };

    var sum = {
    	sum: sum_1
    };

    const evaluate$3 = evaluate.evaluate;
    const sum$1 = sum.sum;

    var avg_1 = function(qry, arr) {

        var opts = /^\$(count|max|min|avg|sum)\{(.+)\}\s(=|<|>|<=|>=)\s(.+)/.exec(qry);
        var _sum = sum$1(qry, arr);
        
        debugger;
        var _avg = _sum.value / arr.length;

        var status = evaluate$3(_avg, opts[3], opts[4]);

        return {
            value: _avg,
            status,
            verb: (status ? '' : 'Avg ' + _avg + ' didn\'t match the expected avg ' + opts[4])
        };
    };

    var avg = {
    	avg: avg_1
    };

    const evaluate$4 = evaluate.evaluate;

    var min_1 = function(qry, arr) {
        
        var opts = /^\$(count|max|min|avg|sum)\{(.+)\}\s(=|<|>|<=|>=)\s(.+)/.exec(qry);
        var propToAdd = opts[2];
        var _min = Number.MAX_SAFE_INTEGER;

        for(var o of arr) {
            var _v = o[propToAdd];
            if(_v) {
                try {
                _v = Number(_v);
                } catch(e) {}
                if(_min > _v) {
                    _min = _v;
                }
            }
        }

        var status = evaluate$4(_min, opts[3], opts[4]);

        return {
            value: _min,
            status,
            verb: (status ? '' : 'Minimum value ' + _min + ' didn\'t match the expected min ' + opts[4])
        };
        
    };

    var min = {
    	min: min_1
    };

    const evaluate$5 = evaluate.evaluate;

    var max_1 = function(qry, arr) {
        
        var opts = /^\$(count|max|min|avg|sum)\{(.+)\}\s(=|<|>|<=|>=)\s(.+)/.exec(qry);
        var propToAdd = opts[2];
        var _max = Number.MIN_SAFE_INTEGER;

        for(var o of arr) {
            var _v = o[propToAdd];
            if(_v) {
                try {
                _v = Number(_v);
                } catch(e) {}
                if(_max < _v) {
                    _max = _v;
                }
            }
        }

        var status = evaluate$5(_max, opts[3], opts[4]);

        return {
            value: _max,
            status,
            verb: (status ? '' : 'Maximum value ' + _max + ' didn\'t match the expected max ' + opts[4])
        };
        
    };

    var max = {
    	max: max_1
    };

    const validateRegex$1 = regex.validateRegex;
    const validateSort$1 = sort.validateSort;
    const validateUUID$1 = uuid.validateUUID;
    const validateIn$1 = _in.validateIn;
    const validateIP$1 = ip.validateIP;

    const count$1 = count.count;
    const avg$1 = avg.avg;
    const min$1 = min.min;
    const max$1 = max.max;
    const sum$2 = sum.sum;



    var getQEValidator = function(QVE) {
        var qvePattern = /^(\$[a-z]+){?/;
        if(qvePattern.test(QVE)) {
            var VE = qvePattern.exec(QVE)[1];
            switch(VE) {
                case '$uuid': 
                    return validateUUID$1;
                case '$asort': 
                    return validateSort$1;
                case '$dsort': 
                    return validateSort$1;
                case '$regex':
                    return validateRegex$1;
                case '$in':
                    return validateIn$1;
                case '$ip':
                    return validateIP$1;
                default:
                    return null;
            }
        } else {
            return null;
        }
        
    };


    var getAggregationFunction = function(qry) {
        var opts = /^\$(count|max|min|avg|sum)/.exec(qry);
        if(opts == null) {
            return null;
        } else {
            switch(opts[1]) {
                case 'count':
                    return count$1;
                case 'avg':
                    return avg$1;
                case 'min':
                    return min$1;
                case 'max':
                    return max$1;
                case 'sum':
                    return sum$2;
                default:
                    return null;
            }
        }
    };

    var getEmptyResult = function() {
        return {
            errLineNo: -1,
            verb: '', //verbose
            passed: true,
            next: '', //operator
            target: undefined
        };
    }; 

    var traverse = function(target, props) {
        try {
            for (var prop of props) {
                if(prop) {
                    var arrayType = /\[(\d+)?\]$/.exec(prop);
                    if (arrayType == null) {
                        target = target[prop];
                    } else {
                        prop = prop.replace(arrayType[0], '');
                        target = target[prop];
                        if (arrayType[1] != undefined) {
                            var index = parseInt(arrayType[1]);
                            target = target[index];
                        }
                    }
                }
            }
            return target;
        } catch(e) {
            return undefined;
        }
    };

    var rjqlUtil = {
    	getQEValidator: getQEValidator,
    	getAggregationFunction: getAggregationFunction,
    	getEmptyResult: getEmptyResult,
    	traverse: traverse
    };

    const evaluate$6 = evaluate.evaluate;
    const getQEValidator$1 = rjqlUtil.getQEValidator;
    const traverse$1 = rjqlUtil.traverse;

    var evaluateExpression =  function(type, target, result, qp) {
        /***
        * parts[0] property to check
        * parts[1] target value
        */
        var operator = /\s+([=~<>]+)\s+/.exec(type.q)[1];
        var parts = type.q.split(/\s+[=~<>]+\s+/);
        var value = traverse$1(target, parts[0].split('>'));
        var rhs = toTarget(parts[1]);
        var QEValidator = getQEValidator$1(rhs);
        var temp = QEValidator ? QEValidator(value, rhs) : evaluate$6(value, operator, rhs);
        var status = typeof temp === 'boolean' ? temp : temp.result;
        if (!status) {
            if (value) { //temp fix
                result.verb = typeof temp != 'boolean' ? temp.verb : toVerbose(type.q, parts[0], rhs, value, operator);
            } else {
                status = false;
                result.verb = 'Property <b>' + parts[0] + '</b> doesn\'t exist.'; 

            }
            result.errLineNo = qp.getLineNo();
        }
        result.operator = operator;
        result.passed = status;
        if(status || operator === '<>') {
            var t = target;
            var p = parts[0].split('>');
            for (var i = 0; i < p.length - 1; i++) {
                t = t[p[i]];
            }    
            result.target = t;
            result.errLineNo = qp.getLineNo();
        }
        return status;

        function toTarget(v) {
            return v.replace(/^"/, '').replace(/"$/, '');
        }
    };

    function toVerbose(q, lhs, rhs, v, operator) {
        switch(operator) {
            case '=':
                return 'Expected <i>' + lhs + '</i> to be <b>' + rhs + '</b> found <u>' + v + '</u>';
            case '~': 
                return 'Value <b>' + rhs + '</b> was not found in array <i>' + lhs + '</i>[' + v + ']';
            case '<>': 
                return 'Found <i>' + lhs + '</i> with value <b>' + rhs + '</b>, while not expecting it.';
            default: 
                return 'Query <b>' + q + '</b> failed for value <u>' + v + '</u>';
        }
    }

    var expressionEvaluator = {
    	evaluateExpression: evaluateExpression
    };

    const evaluateExpression$1 = expressionEvaluator.evaluateExpression;


    function executeTests(response, tests) {
        var result = {};
        var results = [];
        if (response) {
            if (typeof response === 'string') {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    setInvalidJSON(result);
                    return result;
                }
            } 
            if(typeof response === 'object') {
                for(var i = 0; i < tests.length; i++) {
                    var _result = rjqlUtil.getEmptyResult();
                    results.push(_result);
                    if(tests[i].qType != 'C') {
                        executeTest(response, tests[i], _result);
                        //In case of failed test generating verbose again
                        //because in most cases verbose would be relaced 
                        //by sub sequent query results.
                        if(_result.target && !_result.passed) {
                            var __result = rjqlUtil.getEmptyResult();
                            for(var c of tests[i].children) {
                                    executeTest(_result.target, c, __result);
                            }
                            _result.verb = __result.verb;
                        } else if(_result.passed) {
                            _result.verb = 'OK';
                        }

                    } else {
                        results[i - 1].next = tests[i].query;
                    }
                }
            } else {
                setInvalidJSON(result);
                return result;
            }
        }
        return results;
    }


    function executeTest(json, test, _result) {
        test.query  = test.query.replace(/(\[\])?:$/, '');
        if(test.qType === 'E') {
            _evaluateExp(test, json, _result);
        } else {
            var target = rjqlUtil.traverse(json, test.query.split('>'));
            if(test.qType === 'N') {
                for(var child of test.children) {
                    executeTest(target, child, _result);
                    if(_result.passed) {
                        break;
                    }
                }
            } else { //A
                var hasAggregator = false;
                for(var _t of target) {
                    var forceBreak = false;
                    for(var child of test.children) {
                        var aggregator = rjqlUtil.getAggregationFunction(child.query);
                        if (!aggregator) {
                            executeTest(_t, child, _result);
                            if(!_result.passed) {
                                forceBreak = true;
                                break;
                            }
                        } else {
                            runAggregatorFunction(aggregator, child, target, _result);
                            hasAggregator = true;
                            forceBreak = true;
                            break;
                        }
                    }
                    //reassgining target as parent in place of individual child node as target 
                    if(!forceBreak && _result.passed) {
                        _result.target = _t;
                    }
                    if(hasAggregator) {
                        if(hasAggregator && test.children.length > 1) {
                            _result.warn = 'Ignoring rest of the queries after Aggregation function.'; 
                        }
                        break;
                    }
                    if(!forceBreak && _result.operator != '<>') {
                        break;
                    }
                    if(_result.operator == '<>' && forceBreak) {
                        break;
                    }
                }
               
            }

        }
    }


    function _evaluateExp (test, target, result) {
        test.q = test.query;
        test.getLineNo = function() {
            return this.start;
        };
        return evaluateExpression$1(test, target, result, test);
    }

    function runAggregatorFunction(aggregator, test, target, result) {
        var aggregatedResult = aggregator(test.query, target);
        if (aggregatedResult.status) {
            result.target = target;
        } else {
            result.passed = aggregatedResult.status;
            result.verb = aggregatedResult.verb;
            result.errLineNo =test.start;
        }
    }


    function setInvalidJSON(result) {
        result.verb = 'The response is not a valid JSON. <b>RJQL</b> works only for JSON. ';
        result.passed = false;
    }

    var executeTests_1 = executeTests;

    var executor = {
    	executeTests: executeTests_1
    };

    function parse(src) {
        try {
            var lines = src.split('\n');
            var QUERY_BLOCKS = populateQueryBlocks(lines);
            for (var qb of QUERY_BLOCKS) {
                if (qb.qType != 'C') {
                    parseChildren(qb, lines, qb.start++, qb.end);
                }
            }
            return {
                err: undefined,
                qbs: QUERY_BLOCKS
            };
        } catch(e) {
            console.log(e);
            return {
                err: e,
                qbs: undefined
            };
        }
    }

    /**
     * Parse children of Query Blocks
     * @param {*} parent Current query block
     * @param {*} lines all lines in source
     * @param {*} index query block start index
     * @param {*} till  query block ends at 
     */

    function parseChildren(parent, lines, index, till) {
        if(index == till) {
            return;
        }
        var qry = lines[index];
        var type = getQType(qry);
        var tabCount = getTabCount(qry);
        var node = getNode(index, qry, parent);
        if(!node.query || tabCount > parent.tabCount) {
            if(node.query) { parent.children.push(node); }
            if(/(A|N)/.test(type)) {
                parseChildren(node, lines, index + 1, till);
            } else {
                parseChildren(parent, lines, index + 1, till);
            }
        } else {
            parseChildren(parent.parent, lines, index, till);
        }
    }



    /***
     * Divide the source into query blocks
     * 
     * 
     * Employees[]:
     *  employeeCode = "E1"
     *  prop[]:
     *      hello = "boom"
     * &&
     * Employees[]:
     *  employeeCode = "E1"
     *  region = "CA2"
     * 
     * The above source will be divided into
     * 3 blocks where lines start with no space or tab
     * in the beginning.
     * 
     *  @param {*} lines
     */
    function populateQueryBlocks(lines) {
        var queryBlocks = []; 
        var current = undefined;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i]) {
                if (getTabCount(lines[i]) === 0) { //!/^\t/.test(lines[i])
                    var qb = getQueryBlock(i, lines[i], undefined);
                    queryBlocks.push(qb);
                    if (current) {
                        current.end = i;
                    }
                    current = qb;
                }
            }
        }
        current.end = i;
        return queryBlocks;
    }

    function getNode(i, qry, p) {
        return getQueryBlock(i, qry, p);
    }

    function getQueryBlock(i, qry, p) {
        return {
            start: i + 1,
            query: qry.trim(),
            end: -1,
            qType: getQType(qry),
            children: [],
            tabCount: getTabCount(qry),
            parent: p

        }
    }


    /**
     * Count no of tabs in the beginning of the
     * line.
     * @param {*} line 
     */
    function getTabCount(line) {
        var p = line.split('\t');
        var c = parseInt(getSpaceCount(line) / 4);
        /*for(var i = 0; i < p.length; i++) {
            if(!p[i]) {
                c++;
            } else {
                break;
            }
        }
        return c;*/
        return c;

        function getSpaceCount(line) {
            var space = 0;
            for(var k = 0; k < line.length; k++) {
                if(line[k] != ' ') {
                    break;
                }
                space++;
            }

            return space;
        }
    }

    /**
     * Get Query type.
     * 
     * @param {*} q 
     * @returns {type} :
     *  N: for nested objets
     *  A: for arrays
     *  E: for expressions
     *  C: for conjunction
     */
    function getQType(q) {
        q = q.trim();
        var type = '';
        if (/:$/.test(q)) {
            type = 'N';
            if (/\[\]:$/.test(q)) {
                type = 'A';
            }
        } else if (q === '&&' || q === '||') {
            type = 'C';
        } else {
            type = 'E';
        }
        return type;
    }     


    var parse_1 = parse;

    var parser = {
    	parse: parse_1
    };

    const getEmptyResult$1 = rjqlUtil.getEmptyResult;

    var consolidateResults = function(results, _response) {
        var c_verbose = [];
        var overAll = {
            total: results.length,
            passed: 0
        };
        var highlights = [];
        var result = results[0];
        var i = 0;
        for (var r of results) {
            var qb = to_c_verbose(r, i, overAll);
            c_verbose.push(qb);
            highlights.push({
                start: qb.linesToHighlight.start,
                end: qb.linesToHighlight.end,
                passed: qb.status
            });
            result = __compare(result, r);
            i++;
        }
        
        result.qbs = c_verbose;
        result.overAll = overAll;
        result.highlights = highlights;

        return result;

        function __compare(r1, r2) {
            var result = getEmptyResult$1();
            if (r1.next == '&&') {
                result.passed = r1.passed && r2.passed;
                result.verb = r1.passed ? r2.verb : r1.verb;
                result.errLineNo = r1.passed ? r2.errLineNo : r1.errLineNo;
                result.next = r2.next;
            } else if (r1.next == '||') {
                result.passed = r1.passed || r2.passed;
                result.verb = r1.passed ? r2.verb : r1.verb;
                result.errLineNo = r1.passed ? r2.errLineNo : r1.errLineNo;
                result.next = r2.next;
            } else {
                return r1;
            }
            return result;
        }

        function to_c_verbose(r, i, o) {

            if (r.passed) {
                o.passed++;
            }
            return {
                queryBlock: i + 1,
                status: r.passed,
                verb: r.verb,
                line: r.errLineNo,
                linesToHighlight: getIPLineNo(r.target)
            }

            function getIPLineNo(t) {
                if (!t) {
                    return {
                        start: -1,
                        end: -1
                    }
                }
                var match = JSON.stringify(t, null, ' ').replace(/\n\s+/g, '\n');
                var rs = JSON.stringify(_response, null, ' ').replace(/\n\s+/g, '\n');
                var index = rs.indexOf(match);
                var start = rs.substr(0, index).split('\n').length;
                var end = start - 1 + match.split('\n').length;
                return { start, end }
            }
        }
    };

    var resultConsolidator = {
    	consolidateResults: consolidateResults
    };

    var executeTests$1 = executor.executeTests;

    const consolidateResults$1 = resultConsolidator.consolidateResults;

    var validate = function(res, qry) {
        var tests = parser.parse(qry).qbs;
        return executeTests$1(res, tests);
    };

    var consolidated = function(res, qry) {
        var tests = parser.parse(qry).qbs;
        return consolidateResults$1(executeTests$1(res, tests), res);
    };

    var sahir = {
    	validate: validate,
    	consolidated: consolidated
    };

    exports.consolidated = consolidated;
    exports.default = sahir;
    exports.validate = validate;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
