var Hogan = require('hogan.js');
var fs = require('fs');
var path = require('path');

var index = fs.readFileSync(path.join(__dirname, '../public/index.mustache.html')).toString();
var template = Hogan.compile(index);

module.exports = function (model) {
	return template.render({
		created: model.created,
		lastExpiredUpdated: model.value.expired.lastUpdated,
		fronts: model.value.fronts
	});
};
