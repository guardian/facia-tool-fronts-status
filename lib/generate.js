var FaciaTool = require('aws-s3-facia-tool');
var _ = require('lodash');
var Promise = require('bluebird');
var ophan = require('./ophan');
var expiredContent = require('./expired');
var log = require('./log');

var tool = new FaciaTool({
	'bucket': 'facia-tool-store',
	'env': 'PROD',
	'configKey': 'frontsapi/config/config.json',
	'collectionsPrefix': 'frontsapi/collection',
	'maxParallelRequests': 6
});

module.exports = function (filter) {
	log('Fetching all fronts configuration');
	return Promise.all([
		tool.fetchFronts(filter),
		expiredContent()
	])
	.then(function (res) {
		var fronts = res[0], expired = res[1],
			measures = fronts.map(function (front) {
				return measure(front, expired);
			});

		return ophan(measures).then(function () {
			return {
				expired: expired,
				fronts: measures
			};
		});
	});
};

function measure (front, expired) {
	var collections = front.allCollections().map(function (id) {
		return front.collection(id);
	}), lastUpdated = front.lastUpdated();

	return {
		id: front.id,
		priority: front.config.priority || 'editorial',
		lastUpdated: lastUpdated ? lastUpdated.format('X') : '0',
		lastUpdatedHuman: lastUpdated ? lastUpdated.fromNow() : '-never-',
		expired: _.includes(expired.fronts, front.id) ? 'yes' : 'no',
		collectionsCount: collections.length,
		trailsCount: collections.reduce(function (total, collection) {
			var collenctionContent = collection.toJSON().collection;
			if (collenctionContent) {
				return total + collenctionContent.live.length;
			} else {
				return total;
			}
		}, 0),
		backfilled: collections.filter(function (collection) {
			return collection.isBackfilled();
		}).length > 0 ? 'yes' : 'no',
		group: front.config.group || '',
		hits: 0
	};
}
