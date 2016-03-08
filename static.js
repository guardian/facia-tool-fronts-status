var moment = require('moment');
var generate = require('./lib/generate');
var serve = require('./lib/serve');
var AWS = require('aws-sdk');
var inliner = require('html-inline');
var stream = require('stream');
var path = require('path');

generate().then(function (updates) {
	var body = serve({
		created: moment(),
		value: updates
	});

	var BodyStream = chain(body)
		.pipe(inliner({
			basedir: path.join(__dirname, 'public')
		}));

	extract(BodyStream, function (inlined) {
		var s3 = new AWS.S3();
		s3.upload({
			Bucket: 'auditing-store',
			Key: 'front-stats/index.html',
			Body: inlined,
			ContentType: 'text/html; charset=UTF-8',
			ACL: 'public-read'
		}, function (err) {
			if (err) {
				console.error('Something went wrong');
				console.error(err);
			} else {
				console.log((new Date()).toString());
				console.log('OK');
			}
		});
	});
});

function chain (text) {
	var s = new stream.Readable();
	s._read = function noop () {}; // redundant? see update below
	s.push(text);
	s.push(null);
	return s;
}

function extract (st, cb) {
	var partial = '';
	st.on('data', function (chunk) {
		partial += chunk.toString('utf8');
	});
	st.on('end', function () {
		cb(partial);
	});
}
