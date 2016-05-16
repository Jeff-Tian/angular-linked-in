var express = require('express');
var app = express();

app.set('view engine', 'pug');

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.use('/angular-linked-in', express.static(__dirname));

app.use('/bower_components', express.static(__dirname + '/bower_components'));

app.use('/angular-linked-in/auth/linkedin/callback', function (req, res) {
    console.log(req.query);

    var helper = require('./virtual-scripts/linkedInOAuthHelper');

    helper.obtainCode(req.query)
        .then(helper.obtainAccessToken)
        .then(helper.checkAccessTokenData)
        .then(helper.fetchProfile)
        .then(function (json) {
            console.log(json);
            //res.send(json);
            res.render(__dirname + '/callback.jade', {
                result: JSON.parse(json),
                resultString: json
            });
        })
        .then(null, function (err) {
            console.error('======= error =====');
            console.error(err);
            res.send(err);
        });

    // res.sendFile(__dirname + '/callback.html');
});

app.listen(14000, function () {
    console.log('Example app listening on port 14000!');
});