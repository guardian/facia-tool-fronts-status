var async = require('async');
var Promise = require('native-promise-only');
var request = require('request');
var _ = require('lodash');
var numeral = require('numeral');
var log = require('./log');

module.exports = function (list) {
	return new Promise(function (resolve, reject) {
		var groupSize = 20,
			parallelRequests = 5;
		log('Grouping ophan request in batches of ' + groupSize + ' with ' + parallelRequests + ' parallel requests');
		async.parallelLimit(_.chunk(list, groupSize).map(getOphanData), parallelRequests, function (err) {
			if (err) {
				reject(err);
			} else {
				resolve(list);
			}
		});
	});
};

function getOphanData (fronts) {
	var url = process.env.OPHAN_BASE,
		key = process.env.OPHAN_API_KEY,
		mapFronts = {};

	if (!url) {
		throw new Error('Missing environment variable OPHAN_BASE');
	}
	if (!key) {
		throw new Error('Missing environment variable OPHAN_API_KEY');
	}
	var params = [
		'key=' + key,
		'days=' + 14,
		'interval=' + (20 * 24 * 60) // in minutes
	];
	fronts.forEach(function (front) {
		params.push('path=/' + front.id);
		mapFronts[front.id] = front;
	});

	url += '?' + params.join('&');

	return function (callback) {
		log('request:', url);
		request(url, function (err, response, body) {
			if (err) {
				callback(err);
			} else {
				try {
					var json = JSON.parse(body);
					json.forEach(function (front) {
						mapFronts[front.path.substring(1)].hits = front.totalHits;
						mapFronts[front.path.substring(1)].traffic = numeral(front.totalHits).format('0[.]0a');
					});
					callback(null);
				} catch (ex) {
					callback(ex);
				}
			}
		});
	};
}
