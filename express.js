const express = require('express');
const path = require('path');
const electronApp = require('./index');

const app = express();

let server;
let remotePagePath;

const changeState = (port, pagePath, turnOn) => {
    remotePagePath = pagePath;
    if(turnOn) {
        server = app.listen(port, ()=> {console.log(`Listening on port ${port}`)});
    } else {
        try {
            server.close();
        }
        catch {

        }        
    }
}
module.exports = changeState;

//Express
app.use(express.json());

app.get('/', (req, res)=> {
    res.sendFile(remotePagePath);
    //res.send('hello, app!');
})

app.post('/play', (req,res) => {
    electronApp.pauseVideo();
    res.status('200').send('ok');
});

app.post('/volumeUp', (req,res)=> {
    electronApp.changeVolume(true);
    res.status('200').send('ok');
});
app.post('/volumeDown', (req,res)=> {
    electronApp.changeVolume(false);
    res.status('200').send('ok');
})

app.get('/icons/play.png', (req,res)=> {
    res.sendFile(path.join(__dirname, '/icons/play.png'));
})
app.get('/icons/volumeUp.png', (req,res)=> {
    res.sendFile(path.join(__dirname, '/icons/volumeUp.png'));
})
app.get('/icons/volumeDown.png', (req,res)=> {
    res.sendFile(path.join(__dirname, '/icons/volumeDown.png'));
})