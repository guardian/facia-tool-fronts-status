var FaciaTool = require('aws-s3-facia-tool');
var config = require('../config');
var _ = require('lodash');

var tool = new FaciaTool({
    'bucket': 'aws-frontend-store',
    'env': 'CODE',
    'configKey': 'frontsapi/config/config.json',
    'collectionsPrefix': 'frontsapi/collection',
    'pressedPrefix': 'frontsapi/pressed/live',
    'maxParallelRequests': 6
});

function run () {
    return tool.press.getFrontsWithPressedDates()
    .then(function (frontsWithDates) {
        var staleFronts = _.reduce(frontsWithDates, function(staleFronts, frontWithDate) {

            var pressedAgo = Date.now() - Date.parse(frontWithDate.lastModified),
            pressedLimit;

            if (frontWithDate.lastModified) {
                if ( _.some(config.newtworkFrontIds, function(networkFrontId) {
                    return frontWithDate.id === networkFrontId;
                }) ) {
                    pressedLimit = config.staleNetworkFront;
                } else if (frontWithDate.priority === 'commercial') {
                    pressedLimit = config.staleCommercialFront;
                } else if (!frontWithDate.priority) {
                    pressedLimit = config.staleEditorialFront;
                }

            }
            if (!frontWithDate.lastModified || (pressedLimit && pressedAgo > pressedLimit)) {
                delete frontWithDate.priority;
                staleFronts.push(frontWithDate);
            }

            return staleFronts;
        }, []);
        return staleFronts;
    })
    .catch(function (err) {
        console.log(err);
    });
}

run();
