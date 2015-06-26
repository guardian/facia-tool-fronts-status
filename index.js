var express = require('express');
var app = express();
var Promise = require('native-promise-only');
var moment = require('moment');
var generate = require('./lib/generate');
var serve = require('./lib/serve');

Promise.resolve()
.then(generate)
.then(startServer)
.then(function (server) {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);
})
.catch(console.trace);

function startServer (table) {
	var store = table,
		pageCreated = new Date();

	return new Promise(function (resolve) {
		app.get('/', function (req, res) {
			res.send(serve({
				created: moment(pageCreated).format('YYYY-MM-DD HH:mm'),
				value: store
			}));
		});
		app.use(express.static('public'));
		app.get('/reload', function (req, res) {
			generate().then(function (updates) {
				store = updates;
				pageCreated = new Date();
			});
			res.redirect('/');
		});

		var server = app.listen(process.env.PORT || 3000, function () {
			resolve(server);
		});
	});
}
