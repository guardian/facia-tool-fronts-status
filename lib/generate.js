var FaciaTool = require('aws-s3-facia-tool');
var _ = require('lodash');
var Promise = require('native-promise-only');
var ophan = require('./ophan');
var expiredContent = require('./expired');
var log = require('./log');

var tool = new FaciaTool({
    'bucket': 'aws-frontend-store',
    'env': 'PROD',
    'configKey': 'frontsapi/config/config.json',
    'collectionsPrefix': 'frontsapi/collection',
    'maxParallelRequests': 6
});

module.exports = function () {
	log('Fetching all fronts configuration');
	return Promise.all([
		tool.fetchFronts(),
		expiredContent()
	])
	.then(function (res) {
		var fronts = res[0], expired = res[1];

		return ophan(fronts.map(function (front) {
			return measure(front, expired);
		})).then(function (data) {
			return {
				expired: expired,
				fronts: data
			};
		});
	});
};

function measure (front, expired) {
	var collections = front.allCollections().map(function (id) {
		return front.collection(id);
	});

	return {
		id: front.id,
		priority: front.config.priority || 'editorial',
		lastUpdated: front.lastUpdated().format('YYYY-MM-DD HH:mm'),
		expired: _.contains(expired.fronts, front.id) ? 'yes' : 'no',
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
		hits: 0
	};
}
