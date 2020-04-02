var dns = require('dns');
var saslLibrary = require('node-sasl-wrapper');

/*
 * This is a first implementation of the SaslClient "interface" used
 * by the ConnectionManager class which is backed by the Cyrus SASL
 * wrapper.
 *
 * It should be factored out of node-zookeeper-client and into its own
 * module, and used via "dependency injection."
 */

function SaslClient(mechlist, options) {
    this.mechlist = mechlist;
    this.options = options;

    this.handle = new saslLibrary.SaslWrapper();
}

SaslClient.prototype.start = function (socket, cb) {
    var self = this,
        options = self.options,
        remoteAddress = socket.remoteAddress,
        tcpParams = {
            iplocalport: socket.localAddress + ";" + socket.localPort,
            ipremoteport: remoteAddress + ";" + socket.remotePort
        };

    function k(connectParams) {
        var connectResult = self.handle.connect(connectParams);

        if (connectResult.error) {
            cb(connectResult.error);
            return;
        }

        var startResult = self.handle.clientStart({
            mechlist: self.mechlist
        });

        cb(startResult.error, startResult.mech, startResult.clientout);
    }

    if (options.serverFQDN) {
        k(Object.assign({ }, options, tcpParams));
    } else {
        dns.reverse(remoteAddress, function (error, results) {
            if (error) {
                cb(error);
                return;
            }

            k(Object.assign({ serverFQDN: results[0] }, options, tcpParams));
        });
    }
}

SaslClient.prototype.step = function (token, cb) {
    var stepResult = this.handle.clientStep({
        serverin: token
    });

    cb(stepResult.error, stepResult.isComplete, stepResult.clientout);
}

module.exports = SaslClient;
