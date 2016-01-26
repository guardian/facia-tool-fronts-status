var FaciaTool = require('aws-s3-facia-tool');
var Promise = require('bluebird');
var moment = require('moment');
var config = require('../config');
var log = require('./log');

var tool = new FaciaTool({
    'bucket': 'aws-frontend-store',
    'env': 'PROD',
    'configKey': 'frontsapi/config/config.json',
    'collectionsPrefix': 'frontsapi/collection',
    'pressedPrefix': 'frontsapi/pressed',
    'maxParallelRequests': 6
});
var PARALLEL_REQUESTS = 4;

module.exports = function (location) {
    location = location === 'draft' ? 'draft' : 'live';

    log('Getting fronts list');
    return tool.fetchConfig()
    .then(function (config) {
        return config.listFrontsIds().map(function (frontId) {
            return {
                id: frontId,
                priority: config.front(frontId).priority()
            };
        })
        .filter(function (front) {
            return front.priority !== 'training';
        });
    })
    .then(function (frontsList) {
        log('Fetching last modified date for ' + frontsList.length + ' ' + location + ' fronts');
        return Promise.map(frontsList, getLastModified.bind(null, location), { concurrency: PARALLEL_REQUESTS });
    })
    .then(function (frontsList) {
        return frontsList.filter(function (front) {
            if (!front.lastModified) {
                // Never pressed
                return true;
            } else {
                if (config.networkFrontIds.indexOf(front.id)) {
                    return front.lastModified.isBefore(config.staleNetworkFront[0], config.staleNetworkFront[1]);
                } else if (front.priority === 'editorial') {
                    return front.lastModified.isBefore(config.staleEditorialFront[0], config.staleEditorialFront[1]);
                } else {
                    return front.lastModified.isBefore(config.staleCommercialFront[0], config.staleCommercialFront[1]);
                }
            }
        });
    });
};

function getLastModified (location, front) {
    return tool.press.getLastModified(front.id, location)
    .then(function (time) {
        front.lastModified = time ? moment(new Date(time)) : null;
        return front;
    });
}
