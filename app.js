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

//AWS.config.loadFromPath(process.env.AWS_CONFIG_PATH);

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
app.use(express.static(process.env.NODE_ENV ? './public' : '../simplifyr/public'));

app.use(fileUpload());

app.use('/api', indexRouter);
app.use('/api', redisRouter);
app.use('/run', autorun);
app.use('/result', resultRouter);

app.use('/ping', (req, res) => {
    res.json({
        msg: 'PONG'
    });
});

app.post('/token', function (req, res) {
  res.json({
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZDY1ODRiN2Y5YzU1Y2JjMDAyZGM0MzYiLCJ1c2VybmFtZSI6ImtyeXB0b24iLCJuYW1lIjoiSmFtZXMgR29zbGluZyIsInVzZXJUeXBlIjoiZmMiLCJpbnN0aXR1dGUiOnsiY29kZSI6ImRyYWMiLCJ0eXBlIjoiY2xnIiwibmFtZSI6IkRSQSBDb2xsZWdlIn0sInNob3J0TmFtZSI6IktSIiwiYWNjZXNzIjp0cnVlLCJsYXN0TG9naW4iOjE2MjQwMjg1ODkyMzUsImlhdCI6MTYyNDM1ODIyMywiZXhwIjoxNjI0MzY5MDIzLCJzdWIiOiJjem4tYXV0aCJ9.F-EAZ4Hz56x4E4YWxCHX1Um3Uio7-cfCjv1OUyUhFek',
    expires_in: 7199,
    scope: 'read write',
    token_type: 'bearer'
  });
});


module.exports = app;