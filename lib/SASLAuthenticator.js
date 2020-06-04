var util = require('util');
var events = require('events');

var jute = require('./jute');

/*
 * This class holds the SASL authentication logic, and delegates the
 * SASL operations to a provided "sasl client" implementation with the
 * following methods:
 *
 *     interface SASLClient {
 *         start(
 *             socket: Socket,
 *             callback: (error: any, mech: string, token: Buffer) => void
 *         );
 *         step(
 *             token: Buffer,
 *             callback: (error: any, isComplete: boolean, token?: Buffer) => void
 *         );
 *     }
 */

function SASLAuthenticator(saslClient) {
    events.EventEmitter.call(this);

    this.saslClient = saslClient;
    this.hasLastPacket = undefined;
    this.isLastPacket = false;
}

util.inherits(SASLAuthenticator, events.EventEmitter);

SASLAuthenticator.prototype.start = function(socket) {
    this.hasLastPacket = undefined;
    this.isLastPacket = false;

    this.saslClient.start(socket, this.onStart.bind(this));
};

function makeRequest(token) {
    var header = new jute.protocol.RequestHeader();
    var payload = new jute.protocol.GetSASLRequest();

    header.type = jute.OP_CODES.SASL;

    payload.token = token;

    return new jute.Request(header, payload);
}

SASLAuthenticator.prototype.onStart = function(error, mech, token) {
    if (error) {
        this.emit('error', 'client start', error);
        return;
    }

    this.hasLastPacket = mech === 'GSSAPI';
    this.isLastPacket = false;

    this.emit('request', makeRequest(token), this.onResponse.bind(this));
};

SASLAuthenticator.prototype.onResponse = function(error, response) {
    if (error) {
        this.emit('error', 'server response', error);
        return;
    }

    if (this.isLastPacket) {
        this.emit('complete');
        return;
    }

    this.saslClient.step(response.payload.token, this.onContinue.bind(this));
};

SASLAuthenticator.prototype.onContinue = function(error, isComplete, token) {
    if (error) {
        this.emit('error', 'client step', error);
        return;
    }

    if (isComplete) {
        if (this.hasLastPacket) {
            this.isLastPacket = true;
        } else {
            this.emit('complete');
            return;
        }
    }

    this.emit('request', makeRequest(token), this.onResponse.bind(this));
};

module.exports = SASLAuthenticator;
