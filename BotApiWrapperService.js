const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const fetch = require('node-fetch');

const WeatherAPIKey = 'b7a4421d208d94fca2500185e4af319f';
const token = '5459775904:AAHS61W1O8jrD_OYjBaspDs1CR634hCIqB8';
const bot = new TelegramBot(token, {polling: true});


let usersArray = [];
const usersDataPath = 'users/users.json';


fs.exists(usersDataPath, (exists) => {
    if (exists) {
        fs.readFile(usersDataPath, 'utf8', (err, usersData) => {
            usersArray = JSON.parse(usersData);
        });
    }
});

bot.on('message', (msg) => {
    if (msg.chat.type === 'private') {
        const userID = msg.from.id;
        if (!usersArray.includes(userID)) {
            usersArray.push(userID);
            fs.writeFile(usersDataPath, JSON.stringify(usersArray), err => {
                if (err) {
                    console.error(err);
                }
            });
        }
        
        if (
            msg.text.includes('/start') ||
            msg.text.includes('/forecastweather') ||
            msg.text.includes('/currentweather')
        ) {
            return;
        }

        const chatId = msg.chat.id;

        bot.sendMessage(chatId, 'Unrecognised command.', {
            reply_markup: {
                'keyboard': [['/currentweather', '/forecastweather']],
                'resize_keyboard': true
            }
        });
    }
});


function sendCurrentWeather(chatId, replyMessage) {
    fetch('https://api.openweathermap.org/data/2.5/weather?q=Lviv,ua&APPID=' + WeatherAPIKey)
        .then(resp => resp.json())
        .then(weather => {
            let responseString = '🏙 ' + weather.name + '\r\n\r\n';
            responseString += '🌤 ' + weather.weather[0].main + '\r\n\r\n'; 
            responseString += '🌡️ ' + (weather.main.temp - 273.15).toFixed(2) + ' °C\r\n\r\n';

            const clockOptions = {
                timeZone: 'UTC',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            };

            const currentDate = new Date();
            currentDate.setUTCSeconds(currentDate.getUTCSeconds() + weather.timezone);

            responseString += '⏰ ' + currentDate.toLocaleTimeString([], clockOptions) + '\r\n\r\n';
            responseString += '📅 ' + currentDate.toISOString().slice(0, 10) + '\r\n\r\n';

            if (chatId != -1)
                bot.sendMessage(chatId, responseString, { reply_to_message_id: replyMessage });
            else
                BoardCastMessage(responseString);
        })
}

function sendForecastWeather(chatId, replyMessage) {
    fetch('https://api.openweathermap.org/data/2.5/forecast?q=Lviv,UA&appid=' + WeatherAPIKey)
        .then(resp => resp.json())
        .then(weather => {

            let currentDate = new Date();
            currentDate.setHours(currentDate.getHours() + 24);
            const targetTimeStamp = currentDate.getTime() / 1000;


            let weatherIndex = -1;
            for (let i = 0; i < weather.list.length; i++) {
                if (weather.list[i].dt >= targetTimeStamp) {
                    weatherIndex = i;
                    break;
                }
            }

            if (weatherIndex != -1) {
                let responseString = '🏙 ' + weather.city.name + '\r\n\r\n';
                responseString += '🌤 ' + weather.list[weatherIndex].weather[0].main + '\r\n\r\n';
                responseString += '🌡️ ' + (weather.list[weatherIndex].main.temp - 273.15).toFixed(2) + ' °C\r\n\r\n'; 

                currentDate = new Date();
                const year = currentDate.getFullYear(),
                month = ('0' + ((new Date()).getMonth() + 1)).slice(-2),
                day = ('0' + ((new Date()).getDate() + 1)).slice(-2),
                fullDate = [year, month, day].join('-');

                currentDate.setUTCSeconds(currentDate.getUTCSeconds() + weather.city.timezone + (24 * 60 * 60));

                const clockOptions = {
                    timeZone: 'UTC',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                };

                responseString += `⏰ ${currentDate.toLocaleTimeString([], clockOptions)}` + '\r\n\r\n';
                responseString += '📅 ' + fullDate + '\r\n\r\n';
                

                if (chatId != -1) 
                    bot.sendMessage(chatId, responseString, { reply_to_message_id: replyMessage });
                else
                    BoardCastMessage(responseString);
            }
            else {
                if (chatId != -1)
                    bot.sendMessage(chatId, 'ERROR: Unknown problem occurred.', { reply_to_message_id: replyMessage });
                else
                    console.error('ERROR: Unknown problem occurred while forcasting weather.');
            }
        })
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, '🌤 Welcome To Lviv Weather Boardcast Bot ☀️🌦☔️\r\n\n🟢 Pick your desired command from the bottom keyboard to start using the bot.', {
        reply_markup: {
            'keyboard': [['/currentweather', '/forecastweather']],
            'resize_keyboard': true
        }
    });
})

bot.onText(/\/currentweather/, (msg) => { 
    const messageID = msg.message_id, chatID = msg.chat.id;
    if (msg.text.includes('556218')) {
        sendCurrentWeather(-1, -1);
    }
    else {
        sendCurrentWeather(chatID, messageID);
    }
});

bot.onText(/\/forecastweather/, (msg) => {
    const messageID = msg.message_id, chatID = msg.chat.id;
    if (msg.text.includes('556218')) {
        sendForecastWeather(-1, -1);
    }
    else {
        sendForecastWeather(chatID, messageID);
    }
});

function BoardCastMessage(message) {
    for (let i = 0; i < usersArray.length; i++) {
        bot.sendMessage(usersArray[i], message);
    }
}

module.exports = {
    CurrentWeather: function () {
        sendCurrentWeather(-1, -1);
    },
    ForecastWeather: function () {
        sendForecastWeather(-1, -1);
    }
};