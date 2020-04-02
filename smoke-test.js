var zookeeper = require('./index.js');
var SaslClient = require('./lib/SaslClient.js');

var client = zookeeper.createClient('192.168.8.42:2181', {
    saslClient: new SaslClient('GSSAPI', {
        service: 'zookeeper',
        prompt_supp: {
            user: "zkuser",
            realm: "REALM.COM"
        }
    })
});

client.once('connected', function () {
    console.log('Connected to the server.');

    var loop = true;
    var count = 0;

    function testGetData() {
        client.getData("/krb", undefined, function (error, data, stat) {
            count++;
            console.log({ x: "getData", count, error, data, stat });
            if (data)
                console.log({ dataAsString: data.toString() });

            if (loop)
                setTimeout(testGetData, 1000);
            else
                client.close();
        });
    };

    setTimeout(testGetData, 1000);
});

client.connect();
