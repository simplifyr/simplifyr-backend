var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var AWS = require('aws-sdk');
var redis = require("redis");
const fileUpload = require('express-fileupload');

var REDIS_CLIENT = redis.createClient({
    host: process.env['redis.host'],
    port: process.env['redis.port']
});

REDIS_CLIENT.on("connect", function () {});

AWS.config.loadFromPath(process.env.AWS_CONFIG_PATH);

global.AWS = AWS;
global.REDIS_CLIENT = REDIS_CLIENT;

var indexRouter = require('./routes/index');
var redisRouter = require('./routes/redis-route');
var autorun = require('./routes/autorun')
var resultRouter = require('./routes/result-route')

var app = express();

app.use(logger('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.text({limit: '50mb'}));
app.use(express.static(process.env.NODE_ENV ? './public' : '../simplifier/public'));

app.use(fileUpload());

app.use('/api', indexRouter);
app.use('/api', redisRouter);
app.use('/run', autorun);
app.use('/result', resultRouter);


module.exports = app;