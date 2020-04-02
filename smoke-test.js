var zookeeper = require('./index.js');

var client = zookeeper.createClient('localhost:2181');

client.once('connected', function () {
    console.log('Connected to the server.');

    setTimeout(function () {
        client.getData("/foo", undefined, function (error, data, stat) {
            console.log({ x: "getData", error, data, stat });
            if (data)
                console.log({ dataAsString: data.toString() });
            client.close();
        });
    }, 500);
});

client.connect();
