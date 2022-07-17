const http = require('http');
const url = require('url');
const fs = require('fs');

const telegramWrapper = require('./BotApiWrapperService');
const port = 7274;
http.createServer(function (req, res) {
    const queryObject = url.parse(req.url, true, true); 

    let targetPathName = queryObject.pathname;
    if (targetPathName.endsWith('/'))
        targetPathName = targetPathName.substr(0, targetPathName.length - 1);

    if (targetPathName === '/weather/current') {
        telegramWrapper.CurrentWeather();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ Result: 'OK' }));
        res.end();
    }
    else if (targetPathName === '/weather/forecast/24h') {
        telegramWrapper.ForecastWeather();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ Result: 'OK' }));
        res.end();
    }
    else if (targetPathName === '/data/get') {
        fs.readdir('HTTPRequest', (error, files) => {
            if (error) {
                console.error(error);
            }
            else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                let firstTime = true;
                let filesCount = 0;

                if (files.length > 0)
                    res.write('[');

                filesCount = files.length;

                files.forEach(file => {
                    fs.readFile('HTTPRequest/' + file, 'utf8', (err, requestData) => {
                        if (err) {
                            console.error(err);
                        }
                        else {
                            if (firstTime) {
                                firstTime = false;
                                res.write(requestData); 
                            }
                            else {
                                res.write(',' + requestData);
                            }
                        }
                        filesCount--;
                        if (filesCount === 0)
                            res.end(']');
                    });
                });

                if (files.length === 0)
                    res.end('{Result: \'No Data Available\'}');
            }

        });
    }

    if (targetPathName != '/data/get') {
        if (!res.writableEnded) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ Result: 'Request Stored' }));
        }

        const timestamp = Date.now(),
              dateOfFile = new Date().toLocaleString();

        const fileContent =
        {
                FileCreation: dateOfFile,
                Protocol: 'HTTP',
                Method: req.method,
                Domain: req.headers.host,
                QueryString: queryObject.query,
                Resource: req.url
        };

        fs.writeFile('HTTPRequest/' + `${timestamp}.txt`, JSON.stringify(fileContent), error => {
            if (error) {
                console.error(error);
            }
        });

        res.end();
    }
}).listen(port);

fs.exists('HTTPRequest', (exists) => {
    if (!exists) {
        fs.mkdir('HTTPRequest', error => {
            if (error) {
                console.error(error);
            }
        });
    }
});

console.log(`Server running on port ${port}`);