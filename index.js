const electron = require('electron');
const {app, BrowserWindow, session, ipcMain, Menu, nativeImage} = electron;
const api = require('./api/api');
const path = require('path');
const appExpress = require('./express');

const port = 3005;
const remotePagePath = path.join(__dirname, '/view/remote.html');
let expressAppTurnOn = false;

let settings = require('./api/settings');

const hdouttvDefaultPage = 'https://hdout.tv/';
const hdouttvLogoffPage = 'https://hdout.tv/?logout=1';

let mainWindow = null;
let hdouttvWindow = null;
let settingsWindow = null;

let login;
let password;
let lastPauseTime = 0;
let currentVideoInfo = {};
let volume = 1;

app.on('ready', async () => {
    await getSettingsValues();
    const mainMenu = Menu.buildFromTemplate(await buildMainWindowMenuTemplate());
    Menu.setApplicationMenu(mainMenu);
    
    if(login === undefined || password === undefined) {
        await CreateHdouttvWindow(hdouttvLogoffPage);
    }
    else if(currentVideoInfo === undefined) {
        await CreateHdouttvWindow();
    }
    else {
        await CreateMainWindow();
    }
    runExpressApp();
});

const runExpressApp = () => {
    appExpress(port, remotePagePath, expressAppTurnOn);
}

app.on('quit', async () => {
    await saveSettingsValues();
});

ipcMain.on('main:getEpisodeId', async (event, episodeId) => {
    eventGetEpisodeId(episodeId);    
});

ipcMain.on('main:saveLastPauseTime', async (event, pauseTime) => {
    lastPauseTime = pauseTime;
});

ipcMain.on('main:restartCurrentEpisode', async (event) => {
    getVideoUrl(currentVideoInfo.videoId);
});

ipcMain.on('main:fullScreenChange', async(event, isFullScreen) => {
        //mainWindow.setFullScreen(isFullScreen)
        mainWindow.setMenuBarVisibility(!isFullScreen);
});

ipcMain.on('main:markEpisode', async(event, episodeId) => {
    //mainWindow.setFullScreen(isFullScreen)
    const res = await api.markEpisode(episodeId);
});

ipcMain.on('main:saveCurrentVolume', async(event, currentVolume) => {
    volume = currentVolume;
})

ipcMain.on('hdouttv:getEpisodeId', async (event, episodeId) => {
    eventGetEpisodeId(episodeId);    
});

ipcMain.on('hdouttv:getLoginInfo', async () => {
    hdouttvWindow.webContents.send('hdouttv:sendLoginInfo', login, password);
});
ipcMain.on('hdouttv:setLoginInfo', async (event, newLogin, newPassword) => {
    login = newLogin;
    password = newPassword;
    saveSettingsValues();
});

ipcMain.on('settings:getSavedValues', async () => {
    settingsWindow.webContents.send('settings:setSavedValues', login, password);
});

ipcMain.on('settings:save', async (event, newLogin, newPassword)=> {
    login = newLogin;
    password = newPassword;
    saveSettingsValues();
    settingsWindow.close();
})

async function getSettingsValues() {
    let currentSettings = await  settings.getSettings();
    if (currentSettings === null) {
        return;
    } 
    login = currentSettings.login;
    password = currentSettings.password;
    currentVideoInfo = currentSettings.currentVideoInfo;
    lastPauseTime = currentSettings.lastPauseTime;
    volume = currentSettings.volume;
    expressAppTurnOn = currentSettings.expressAppTurnOn;
}

async function saveSettingsValues() {
    let settingsToSave = {} 
    settingsToSave.login = login;
    settingsToSave.password = password;
    settingsToSave.currentVideoInfo = currentVideoInfo;
    settingsToSave.lastPauseTime = lastPauseTime;
    settingsToSave.volume = volume;
    settingsToSave.expressAppTurnOn = expressAppTurnOn;

    await settings.saveSettings(settingsToSave);
}

async function eventGetEpisodeId(episodeId) {
    lastPauseTime = 0;
    getVideoUrl(episodeId); 
}

async function getVideoUrl(episodeId) {
    if(episodeId === undefined && currentVideoInfo.videoId === undefined) {
        CreateHdouttvWindow();
        mainWindow.close();
        return;
    }        

    if(currentVideoInfo.videoId === undefined || currentVideoInfo.videoId === null) {
        currentVideoInfo.videoId = episodeId;
    }
    if(mainWindow === null) {
        CreateMainWindow();
        hdouttvWindow.close();
    }
    else {
        currentVideoInfo = await api.authAndGetSerialJson(episodeId, login, password);
        sendVideoToMainWindow();
    }
}

async function sendVideoToMainWindow() {
    if(mainWindow === null) {
        return false;
    }
    mainWindow.webContents.send('main:sendVideoUrl', 
        currentVideoInfo.videoUrl, 
        currentVideoInfo.videoName,
        currentVideoInfo.videoId,
        currentVideoInfo.nextEpisodeId,
        lastPauseTime,
        volume
    );
    saveSettingsValues();
}

async function CheckCloseApp() {
    if(mainWindow === null && settingsWindow === null && hdouttvWindow === null) {
        await app.quit();
    }
}

async function pauseVideo() {
    mainWindow.webContents.send('main:pause');
}
module.exports.pauseVideo = pauseVideo;

async function changeVolume(isMakeHigher) {
    mainWindow.webContents.send('main:changeVolume', isMakeHigher);
}
module.exports.changeVolume = changeVolume;

async function CreateMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height:800,
        icon: nativeImage.createFromPath(path.join(__dirname, '/icons/icon-linux.png'))
        //autoHideMenuBar: true
    });

    mainWindow.on('close', async ()=> {
        //CreateHdouttvWindow();
        mainWindow = null;
        await saveSettingsValues();
        CheckCloseApp();
        // session.defaultSession.clearStorageData([], (data) => {});
        // app.quit();
    });

    mainWindow.webContents.on('did-stop-loading', () => {
        //sendVideoToMainWindow();
        getVideoUrl(currentVideoInfo.videoId);
    });

    mainWindow.loadFile('view/main.html');
    //mainWindow.webContents.openDevTools();
}

async function CreateHdouttvWindow(urlValue) {
    let url = hdouttvDefaultPage;
    if(urlValue !== undefined) {
        url = urlValue;
    }

    hdouttvWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: nativeImage.createFromPath(path.join(__dirname, '/icons/icon-linux.png'))     
    });

    hdouttvWindow.on('close', ()=> {
        hdouttvWindow = null;
        CheckCloseApp()
        // session.defaultSession.clearStorageData([], (data) => {});
        // app.quit();
    });

    hdouttvWindow.loadURL(url);
    //hdouttvWindow.webContents.openDevTools();
}

//НЕ ИСПОЛЬЗУЕТСЯ
async function CreateSettingsWindow() {
    settingsWindow = new BrowserWindow();
    
    settingsWindow.on('close', ()=> {
        settingsWindow = null;
        CheckCloseApp()
    });

    settingsWindow.loadFile('./view/settings.html');
    settingsWindow.focus();
    //settingsWindow.webContents.openDevTools();
}

async function buildMainWindowMenuTemplate() {
    const template = [
        {
            label: 'Файл',
            submenu: [
                {
                    label: 'Удаленное управление',
                    type: 'checkbox',
                    checked: expressAppTurnOn,
                    click() {
                        expressAppTurnOn = !expressAppTurnOn;
                        runExpressApp();
                    }
                },
                {
                    label: 'Выход',
                    click() { 
                        app.quit() 
                }
            }]
        },
        {
            label:'Видео',
            submenu: [
                {
                    label : 'Перезапустить серию',
                    click() {
                        if(mainWindow !== null) {
                            sendVideoToMainWindow();
                        }
                    }
                },
                {
                    label : 'Следующая серия',
                    click() {
                        if(mainWindow !== null) {
                            lastPauseTime = 0;
                            getVideoUrl(currentVideoInfo.nextEpisodeId);
                        }
                    }
                },
                {
                    label: 'К списку сериалов',
                    click() {
                        if(mainWindow !== null) {
                            CreateHdouttvWindow();
                            mainWindow.close();
                            currentVideoInfo.videoId = null;
                        }
                    }
                }]

        }
    ];

    return template;
}