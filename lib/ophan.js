var Promise = require('bluebird');
var request = require('./request');
var _ = require('lodash');
var numeral = require('numeral');
var log = require('./log');

module.exports = function (list) {
	var groupSize = 20,
		parallelRequests = 5;

	if (!process.env.OPHAN_BASE) {
		return Promise.reject(new Error('Missing environment variable OPHAN_BASE'));
	}
	if (!process.env.OPHAN_API_KEY) {
		return Promise.reject(new Error('Missing environment variable OPHAN_API_KEY'));
	}

	log('Grouping ophan request in batches of ' + groupSize + ' with ' + parallelRequests + ' parallel requests');
	return Promise.map(_.chunk(list, groupSize), getOphanData, { concurrency: parallelRequests });
};

function getOphanData (fronts) {
	var url = process.env.OPHAN_BASE,
		key = process.env.OPHAN_API_KEY,
		mapFronts = {},
		params = [
			'key=' + key,
			'days=' + 14,
			'interval=' + (20 * 24 * 60) // in minutes
		];

	fronts.forEach(function (front) {
		params.push('path=/' + front.id);
		mapFronts[front.id] = front;
	});

	url += '?' + params.join('&');

	return request(url).then(function (json) {
		json.forEach(function (front) {
			mapFronts[front.path.substring(1)].hits = front.totalHits;
			mapFronts[front.path.substring(1)].traffic = numeral(front.totalHits).format('0[.]0a');
		});
	});
}
