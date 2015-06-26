var Promise = require('native-promise-only');
var request = require('request');
var log = require('./log');

module.exports = function (url) {
	return new Promise(function (resolve, reject) {
		log('request:', url);
		request(url, function (error, response, body) {
			if (error) {
				reject(error);
			} else {
				var json = JSON.parse(body);
				resolve(json);
			}
		});
	});
};
