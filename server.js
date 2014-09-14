var express = require('express');

var authorize = function (username, password) {
    //UNCOMMENT THIS LINE IF YOU WANT A PASSWORD PROTECTED SITE
    //return 'someone' === username & 'password' === password;
    return true;
};

var configureServer = function() {
    var server = express.createServer(    );

    server.configure(
        function() {
            //any static file from the static directory, just return it to user if requested
            server.use(express.static(__dirname + '/public/'));
        }
    );
    return server;
};

var port = process.env.PORT || 9999;
var server = configureServer();

//Catch every url call and redirect to index.html
server.get("/action",
    function (req, res) {
        var request = require('request');
        console.log(encodeURIComponent(req.query.message));
        var options = {
            url: 'https://api.api.ai/v1/query/?query=' + encodeURIComponent(req.query.message) + '&subscription-key=af522130-48e4-4ab7-be5d-05426eaca8a2',
            headers: {
                'Authorization': 'Bearer 323196e330aa406a8e0c00db315f8f22'
            }
        };

        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.send(body);
            }
            else {
                res.send(body);
            }
        }

        request(options, callback);
    }
);

server.get("/assess",
    function (req, res) {
        var request = require('request');

        var options = {
            url: 'https://unps7ahk5oqhl5bdgua6lso3rp:datahack@api-sandbox.traitify.com/v1/assessments',
            method: 'POST',
            json: {"deck_id": "career-deck"}
        };

        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.send(body);
            }
            else {
                res.send(body);
            }
        }

        request(options, callback);
    }
);


server.get("/gdc/account/login",
    function (req, res) {
        var request = require('request');
        var postData = JSON.stringify({
            "postUserLogin": {
                "login": "dan.treiman@gmail.com",
                "password": "pAic2Aph2eF2od4v",
                "remember": 1
            }
        });
        var options = {
            url: 'https://secure.gooddata.com/gdc/account/login',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Content-Length': postData.length  // GoodData requires Content-Length header
            }
        };
        var postRequest = request(options, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var cookies = response.headers['set-cookie'];
                    var SSTCookie = cookies[1];
                    var SST = SSTCookie.substring(11, 27);
                    console.log('SST =' + SST);
                    res.send(SST);
                }
                else {
                    res.send(body);
                }
            }
        );
        postRequest.write(postData);
        postRequest.end();
    }
);


server.get("/gdc/account/token",
    function (req, res) {
        var request = require('request');
        var SST = req.query.SST;
        var options = {
            url: 'https://secure.gooddata.com/gdc/account/token',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Cookie': '$Version=0; GDCAuthSST=' + SST + '; $Path=/gdc/account'
            }
        };
        request(options, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var cookies = response.headers['set-cookie'];
                    var TT = cookies[0];
                    res.send(TT); // This must be included in the header of every subsequent request.
                }
                else {
                    res.send(body);
                }
            }
        );
    }
);

server.get(/^.*$/,
    function (req, res) {
        res.redirect("index.html");

    }
);

server.listen(port);
console.log("listening on port "+port);