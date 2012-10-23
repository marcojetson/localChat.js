# localChat.js
Communication between tabs (or windows) using localStorage

## Demo
Here is a playground http://marcojetson.github.com/localChat.js

## API

### localChat.join(room, callback)
Start listening to a room, when someone post a message to that room callback function is fired

### localChat.part(room)
Stops listening to a room

### localChat.postMessage(channel, message)
Sends a message to a specified channel (a room or a user). You do not need to join a channel to send a message.

### localChat.nick()
Retrieves current nick

### localChat.nick(newNick)
Changes current nick

### localChat.onPrivateMessage(nick, message, time)
Override this function to add a callback for private messages (where channel equals window nick)

## Terminology
Heavily inspired on IRC :)

### Channel
Communication unit

### Room
A channel where many people can listen, must start with numeral (#) and have between 1 and 50 characters (-_a-z0-9)

### Nick
Unique window identifier must have between 1 and 32 characters (-_a-z0-9)

## Warning
Not yet production ready