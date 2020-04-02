var zookeeper = require('./index.js');

var saslClient = undefined;
var useSasl = true;

if (useSasl) {
    var SASLClient = require('./lib/SASLClient.js');

    saslClient = new SASLClient('GSSAPI', {
        service: 'zookeeper',
        prompt_supp: {
            user: 'zkuser',
            realm: 'REALM.COM'
        }
    });
}

var client = zookeeper.createClient('192.168.8.42:2181', {
    saslClient
});

client.once('connected', function() {
    console.log('Connected to the server.');

    var loop = true;
    var count = 0;

    function testGetData() {
        count++;

        console.log({ x: 'get', ts: new Date().toISOString(), count });

        client.getData('/krb', undefined, function(error, data, stat) {
            var ts = new Date().toISOString();

            console.log({ x: 'res', ts, count, error, data, stat });

            if (data) {
                console.log({ x: 'str', ts, count, s: data.toString() });
            }

            if (loop) {
                setTimeout(testGetData, 1000);
            } else {
                client.close();
            }
        });
    }

    setTimeout(testGetData, 1000);
});

client.on('state', function(state) {
    console.log({ x: 'state', state });
});

client.connect();
