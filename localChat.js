;(function(window) {

	/**
	 * Get initial nick (GuestN)
	 *
	 * @param int size Size of trailing number
	 * @return string
	 */
	var getInitialNick = function() {
		var number = '' + parseInt(Math.random() * +new Array(guestTrailingNumberSize + 1).join(9));
		while (number.length < guestTrailingNumberSize) {
			number = '0' + number;
		}
		var nick = guestPrefix + number;
		return nick;
	};

	/**
	 * Retrieve new messages for a channel
	 *
	 * @param string channel Channel to retrieve messages
	 * @return array
	 */
	var getUpdates = function(channel) {
		var lastUpdate = +localStorage.getItem(keyPrefix + 'update_' + channel),
			data = [];
		if (updated[channel] < lastUpdate) {
			// last local update differs from last global update
			var messages = JSON.parse(localStorage.getItem(keyPrefix + channel)) || [];
			for (var i = 0; i < messages.length; ++i) {
				if (updated[channel] >= messages[i].time) {
					// enough
					break;
				}
				data.push(messages[i]);
			}
			// save local update time
			updated[channel] = lastUpdate;
		}
		return data;
	};

	/**
	 * Check if valid room name
	 *
	 * @param string room Room name to check
	 * @return bool
	 */
	var isValidRoom = function(room) {
		if (!room.match(/^#[-_a-z0-9]{1,50}$/i)) {
			return false;
		}
		return true;
	};

	/**
	 * Check if valid nick name
	 *
	 * @param string nick
	 * @return bool
	 */
	var isValidNick = function(nick) {
		if (!nick.match(/^[-_a-z0-9]{1,32}$/i)) {
			return false;
		}
		return true;
	}

	/**
	 * Gets last update time for a given nickname
	 *
	 * @param string nick A valid nickname
	 * @return bool
	 */
	var ping = function(nick) {
		var lastUpdate = +localStorage.getItem(keyPrefix + nick + ':ping'),
			diff = +new Date() - lastUpdate;
		if (!lastUpdate) {
			// no such user
			return false;
		}
		return diff < timeout;
	};

	/**
	 * Starts listening to a channel
	 *
	 * @param channel Channel to listen
	 * @param callback Function to execute on new message
	 * @return bool
	 */
	var registerChannel = function(channel, callback) {
		if (intervals[channel]) {
			// already on channel
			return false;
		}
		// add check interval
		updated[channel] = +new Date;
		intervals[channel] = setInterval(function() {
			var updates = getUpdates(channel);
			for (var i = 0; i < updates.length; ++i) {
				callback(updates[i].nick, updates[i].message, updates[i].time);
			}
		}, 1000);
		return true;
	};

	/**
	 * Stops listening to a channel
	 *
	 * @param channel Channel to stop listening
	 * @return bool
	 */
	var unregisterChannel = function(channel) {
		if (!intervals[channel]) {
			// not in channel
			return false;
		}
		delete intervals[channel];
		delete updated[channel];
		clearInterval(intervals[channel]);
		return true;
	};

	/**
	 * Guest nick prefix
	 *
	 * @var string
	 */
	var guestPrefix = 'Guest';

	/**
	 * Guest nick trailing number size
	 *
	 * @var int
	 */
	var guestTrailingNumberSize = 6;

	/**
	 * Key prefix for localStorage
	 *
	 * @var string
	 */
	var keyPrefix = 'localChat_';

	/**
	 * Joined channels intervals
	 *
	 * @var object
	 */
	var intervals = {};

	/**
	 * Wether localChat is supported or not by the client
	 *
	 * @var bool
	 */
	var isSupported = !!window.localStorage && !!window.JSON;

	/**
	 * Curren client nick
	 *
	 * @var string
	 */
	var nick;

	/**
	 * When to consider a client is down, in milliseconds
	 *
	 * @var int
	 */
	var timeout = 60000;

	/**
	 * Last update times for every channel
	 *
	 * @var object
	 */
	var updated = {};

	/**
	 * localChat API
	 */
	window.localChat = {

		/**
		 * Starts listening for new messages in a channel
		 *
		 * @param string room Room name
		 * @param function callback Function to run on new messages
		 * @return bool
		 */
		join: function(room, callback) {
			if (!isSupported) {
				return false;
			}
			if (!isValidRoom(room)) {
				return false;
			}
			return registerChannel(room, callback);
		},

		/**
		 * Stop listening for updates in a room
		 *
		 * @param string room Room name
		 * @return bool
		 */
		part: function(room) {
			if (!isValidRoom(room)) {
				// only rooms can be left
				return false;
			}
			return unregisterChannel(room);
		},

		/**
		 * Adds a message to a channel
		 *
		 * @param string to A valid channel name or a online user
		 * @param mixed message Something to send
		 * @return bool
		 */
		postMessage: function(channel, message) {
			if (!isSupported) {
				return false;
			}
			if (!isValidRoom(channel) && (!isValidNick(channel) || !ping(channel))) {
				// not a valid channel name or user is not online
				return false;
			}
			var messages = JSON.parse(localStorage.getItem(keyPrefix + channel)) || [],
				now = +new Date;
			messages.unshift({ nick: nick, message: message, time: now });
			localStorage.setItem(keyPrefix + channel, JSON.stringify(messages));
			localStorage.setItem(keyPrefix + 'update_' + channel, now);
			return true;
		},

		/**
		 * Change or retrieve client's nick
		 *
		 * @param string newNick If present changes client nickname
		 * @return Current nickname
		 */
		nick: function(newNick) {
			if (!isSupported) {
				return false;
			}
			if (newNick && isValidNick(newNick) && (ping(newNick) === false || !ping(newNick))) {
				if (nick) {
					// stop updating last nick
					clearInterval(intervals[nick + ':ping']);
					localStorage.removeItem(keyPrefix + nick + ':ping');
					unregisterChannel(nick);
				}
				// change nick
				nick = newNick;
				// start updates in the new nick
				intervals[nick + ':ping'] = setInterval(function() {
					localStorage.setItem(keyPrefix + nick + ':ping', +new Date);
				}, 1000);
				registerChannel(newNick, localChat.onPrivateMessage);
			}
			return nick;
		},

		/**
		 * Override this function to handle private messages
		 *
		 * @param string nick Message sender
		 * @param string message Message data
		 * @param int time Message timestamp
		 */
		onPrivateMessage: function(nick, message, time) {
		}

	};

	if (isSupported) {

		// set initial nick
		var success = false;
		while (!success) {
			success = localChat.nick(getInitialNick());
		}

		// clean on window close
		window.onbeforeunload = function() {
			// ping key
			localStorage.removeItem(keyPrefix + localChat.nick() + ':ping');
			// private chat key
			localStorage.removeItem(keyPrefix + localChat.nick());
		};

	}

})(window);