var express = require('express');
var app = express();
var http = require('http');
const httpServer = http.Server(app)
const bodyParser = require('body-parser');
const rp = require('request-promise');
const errors = require('request-promise/errors');


app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

var PORT = 3000;
const DOMAIN = process.env.SIM ? 'localhost:5000' : '10.0.0.154'

app.get('/boards/:id', function (req, res) {
	rp({
			uri: `http://${DOMAIN}/winky_blinkies/${req.params.id}`,
			json: true,
			method: 'GET',
	})
	.then(function (response) {
		res.status(200).send(response);
	})
	.catch(function (err) {
		console.log(err);
		res.status(404).send();
	});

});

app.put('/pixel/:id', function (req, res) {
	console.log(`/pixel/${req.params.id} `  + JSON.stringify(req.body))

	// const { id, color } = {...req.body};
	const light = {id: req.body.lightId, color: req.body.color}
	rp({
			uri: `http://${DOMAIN}/lights/${req.params.id}`,
			json: true,
			method: 'PUT',
			body: light
	})
	.then(function (response) {
		res.status(200).send(response);
	})
	.catch( err => {
			console.log(err);
			res.status(404).send();
	});
});

httpServer.listen(PORT, function() {
	console.log('Server running on port ' + PORT);
	if( process.env.SIM ) {
		console.log("Simulating to localhost:5000");
	}
});

httpServer.on('error', err => {
	console.log(err);
})
