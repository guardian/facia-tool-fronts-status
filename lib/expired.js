var request = require('./request');
var moment = require('moment');

module.exports = function () {
	var dfpPath = process.env.DFP_AD_FEATURES;
	if (!dfpPath) {
		throw new Error('Missing environment variable DFP_AD_FEATURES');
	}

	return request(dfpPath).then(function (json) {
		return {
			lastUpdated: json.updatedTimeStamp,
			fronts: json.paidForTags.filter(function (feature) {
				return feature.lineItems.filter(isLive).length === 0;
			}).map(function (feature) {
				return feature.targetedName;
			})
		};
	});
};

function isLive (item) {
	var endTime = moment(item.endTime);
	return (item.status === 'READY' || item.status === 'DELIVERING') && endTime.isAfter(moment());
}
