const fs = require('fs');
const path = require('path');
const auth = require('./auth');

const settingsPath= path.join(__dirname, '../settings/settings.json')

let settings = {};

async function getSettings() {
    try {
        let settingsFile = fs.readFileSync(settingsPath,'utf8');
        settings = JSON.parse(settingsFile);  
        settings.password = await auth.passwordDecrypt(settings.password);
        if(settings.currentVideoInfo === undefined) {
            settings.currentVideoInfo = {};
        }
        return settings;
       
    }
    catch(ex) {
        return null;
    }
}

async function saveSettings(settingsToSave) {
    if(settingsToSave !== null) {
        settings = settingsToSave;
        settings.password = await auth.passwordCrypt(settings.password);
    }
    let settingsString = JSON.stringify(settings);
    fs.writeFileSync(settingsPath, settingsString);
}

module.exports = {settings, getSettings, saveSettings}
/*
let jsonString = "{    
    'login': 'kiras',
    'password': 'w2ksp3r1',
    'lastPauseTime':'0',
    'volume':1,
    'expressAppTurnOn': true,
    'currentVideoInfo': {
        'videoUrl':'',
        'videoName': '',
        'videoId': '',
        'nextEpisodeId': ''
    }}";
*/