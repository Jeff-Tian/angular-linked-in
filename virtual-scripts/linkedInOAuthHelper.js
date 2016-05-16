var $q = require('q');
var http = require('http');
var https = require('https');
var qs = require('querystring');

function composeMessageNotNull(action) {
    return 'checking ' + action + ' failed! unexpected null or undefined.';
}

function checkError(data) {
    var deferred = $q.defer();

    if (data.error) {
        console.error(data.error);
        deferred.reject(data.error_description);
    } else {
        deferred.resolve(data);
    }

    return deferred.promise;
}

function tryExtractCode(data) {
    var deferred = $q.defer();

    if (data.code) {
        deferred.resolve(data.code);
    } else {
        deferred.reject(composeMessageNotNull('code'));
    }

    return deferred.promise;
}

function delegateHandleUpstreamResponse(deferred) {
    return function (response) {
        var chunks = [];
        response.on('data', function (c) {
            chunks.push(c);
        });

        response.on('end', function () {
            chunks = Buffer.concat(chunks);

            deferred.resolve(chunks.toString());
        });
    }
}

var state = 'DCEeFWf45A53sdfKef424';
var redirectUri = 'http://localhost:14000/angular-linked-in/auth/linkedin/callback';
var apiKey = '75aumc81sapy4h';

module.exports = {
    obtainCode: function (data) {
        return checkError(data)
            .then(tryExtractCode);
    },

    obtainAccessToken: function (code) {
        var deferred = $q.defer();

        var content = qs.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            client_id: apiKey,
            client_secret: '70NEcUEVuPryLcNM'
        });

        console.log(content);

        var options = {
            hostname: 'www.linkedin.com',
            port: '443',
            path: '/uas/oauth2/accessToken',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': content.length
            }
        };

        var request = https.request(options, function (response) {
            var chunks = [];
            response.on('data', function (c) {
                chunks.push(c);
            });

            response.on('end', function () {
                chunks = Buffer.concat(chunks);

                deferred.resolve(chunks.toString());
            })
        });

        request.on('error', deferred.reject);

        request.write(content);

        request.end();

        return deferred.promise;
    },

    checkAccessTokenData: function (data) {
        var deferred = $q.defer();

        console.log('==== checking data ====');
        console.log(data);
        console.log('data.access_token = ', data.access_token);
        console.log('typeof data = ', typeof data);

        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        if (data.access_token && !data.error) {
            deferred.resolve(data);
        } else {
            deferred.reject(data);
        }

        return deferred.promise;
    },

    fetchProfile: function (data) {
        var deferred = $q.defer();

        var options = {
            hostname: 'api.linkedin.com',
            port: 443,
            path: '/v1/people/~?format=json',
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + data.access_token
            }
        };

        var request = https.request(options, delegateHandleUpstreamResponse(deferred));

        request.on('error', deferred.reject);
        request.end();

        return deferred.promise;
    }
};
