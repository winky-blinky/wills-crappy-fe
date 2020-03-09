var express = require('express');
var app = express();
var http = require('http');
const httpServer = http.Server(app)
var io = require('socket.io')(httpServer);
const bodyParser = require('body-parser');
const request = require('request');

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

var port = 3000;

app.get('/boards', function (req, res) {
	request('http://localhost:5000/winky_blinky', (error, response, body) => {
		res.send(body);
	});
});

app.put('/pixel/:id', function (req, res) {
	console.log(`/pixel/${req.params.id} `  + JSON.stringify(req.body))
	const request = http.request({
		  hostname: 'localhost',
		  port: 5000,
		  path: `/lights/${req.params.id}`,
		  method: 'PUT',
		  headers: {
		    'Content-Type': 'application/json',
		  }
		});
	request.write(JSON.stringify(req.body));
	request.end();
});

httpServer.listen(port, function() {
	console.log('Server running on port ' + port);
});

io.on('connection', function (socket) {
	socket.on('drop', function (data) {
		socket.broadcast.emit('drop', data);
	});
});
