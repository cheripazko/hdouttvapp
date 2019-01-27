//document.getElementById('url').innerHTML = document.getElementById('webview').getAttribute("src");
const electron = require('electron');
const {ipcRenderer} = electron;

const episodeUrl = 'https:\/\/hdout.tv\/Episode\/';    
const regexpString = new RegExp(episodeUrl, 'i');

document.addEventListener('DOMContentLoaded', () => {
    console.log('loaded');
    console.log(document.URL);

    let url = document.URL;
    let isEpisodeUrl = url.search(regexpString);// /episodeUrl/i ); 
    
    //Для заполнения логина и пароля
    if(url === 'https://hdout.tv/' || url === 'https://hdout.tv/?logout=1') {
        console.log('try to get login info');
        ipcRenderer.send('hdouttv:getLoginInfo');

        const loginForm = document.getElementById('i_login');
        const passwordForm = document.getElementById('i_password');

        const submitButton = document.querySelector('input[type="submit"]');
        submitButton.addEventListener('click', () => {
            ipcRenderer.send('hdouttv:setLoginInfo', loginForm.value, passwordForm.value);
        });
    }
    //Для получения серии
    else if(isEpisodeUrl !== -1) {
        console.log('Find episode url');
        let episodeJsonUrl = url.split(episodeUrl)[1].split('/')[0];
        ipcRenderer.send('hdouttv:getEpisodeId', episodeJsonUrl);
    }
});

ipcRenderer.on('hdouttv:sendLoginInfo', async (event, login, password) => {
    console.log('get login, try to fill');
    const loginForm =document.getElementById('i_login');
    const passwordForm = document.getElementById('i_password');

    loginForm.value = login;
    passwordForm.value = password;
})