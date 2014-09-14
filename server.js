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

        var options = {
            url: 'https://api.api.ai/v1/query/?query='+req.query.message+'&subscription-key=af522130-48e4-4ab7-be5d-05426eaca8a2',
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


server.get(/^.*$/,
    function (req, res) {
        res.redirect("index.html");

    }
);

server.listen(port);
console.log("listening on port "+port);