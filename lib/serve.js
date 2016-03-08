var Hogan = require('hogan.js');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var index, template;
function compileTemplate () {
	index = fs.readFileSync(path.join(__dirname, '../public/index.mustache.html')).toString();
	template = Hogan.compile(index);
}
compileTemplate();

module.exports = function (model) {
	// Remove comment to re-compile the template on every request
	// compileTemplate();

	return template.render({
		created: model.created.format('YYYY-MM-DD HH:mm'),
		lastExpiredUpdated: model.value.expired.lastUpdated,
		fronts: model.value.fronts,
		priorities: _.chain(model.value.fronts)
			.map('priority')
			.uniq()
			.value(),
		frontGroups: _.chain([
				'UK consumer',
				'UK professional',
				'US consumer',
				'US professional',
				'AU consumer',
				'AU professional',
				'Masterclasses'
			]).concat(_.chain(model.value.fronts)
				.map('group')
				.filter(Boolean)
				.value()
			)
			.uniq()
			.map(function (value) {
				return {value: value};
			})
			.value()
	});
};
