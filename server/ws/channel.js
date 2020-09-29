'use strict';

const { findIndex } = require('lodash');
const { loggerWebsocket } = require('../config/logger');

var channels = {};

const getChannels = () => {
	return channels;
};

const addSubscriber = (channel, ws) => {
	if (!channels[channel]) {
		channels[channel] = [];
	}

	const index = findIndex(channels[channel], socket => {
		return socket.id == ws.id;
	});

	if (index === -1) {
		channels[channel].push(ws);
		loggerWebsocket.verbose('ws/channel/addSubscriber', channel, ws.id);
	} else {
		throw new Error(`Already subscribed to channel ${channel}`);
	}
};

const removeSubscriber = (channel, ws) => {
	const index = findIndex(channels[channel], socket => {
		return socket.id == ws.id;
	});

	if (index > -1) {
		channels[channel].splice(index, 1);
		loggerWebsocket.verbose('ws/channel/removeSubscriber', channel, ws.id);
	} else {
		throw new Error(`Not subscribed to channel ${channel}`);
	}
};

module.exports = {
	getChannels,
	addSubscriber,
	removeSubscriber
};