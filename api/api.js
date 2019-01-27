const request = require('request-promise-native');
const mainUri = 'https://hdout.tv/';
const markEpisodeUrl = 'https://hdout.tv/?usecase=MarkEpisode&id=';

let jar = null;

async function authAndGetSerialJson(episodeId, login, password) {
    if(jar === null) {
        jar = request.jar();
        await sendAuth(login, password);
    }
    //console.log(`${new Date()} - after post auth`);
    try {
        return await getSerialJson(episodeId)
    } catch (ex) {
        jar = null;
        return await authAndGetSerialJson(episodeId, login, password);
    }
    
}
module.exports.authAndGetSerialJson = authAndGetSerialJson;


const sendAuth = async (login, password) => {
    jar = request.jar();
    let reqOptions = {
        method: 'GET',
        uri: mainUri,
        jar,
        simple: true
    }
    //console.log(`${new Date()} - before get main page`);
    let res = await request(reqOptions);
    //console.log(`${new Date()} - after get main page`);
    reqOptions = {
        method: 'POST',
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        uri: mainUri,
        jar,
        form: {
            login,
            password,
            button: 'submit'
        },
        followAllRedirects: true,
        simple: true,
        resolveWithFullResponse: false
    }
    //console.log(`${new Date()} - before post auth`);
    res = await request(reqOptions);
    return true;
}

async function getSerialJson(episodeId) {
    const uri = `${mainUri}EpisodeLink/${episodeId}/JSON/`;
    const requestOptions = {
        method:'GET',
        uri,
        jar,
        headers: {
            'User-Agent': 'application/json',
        },
        followAllRedirects: true,
        json: true,
        resolveWithFullResponse: false,
        simple: true
    }

    //console.log(`${new Date()} - before get episode`);
    const res = await request(requestOptions);
    //console.log(`${new Date()} - after get episode`);

    //console.log(res.flashdocument.item);
    const item = res.flashdocument.item
    const videoName='Сезон ' + item.snum +  ", эпизод " + item.enum;
    let nextEpisodeId = null;
    
    if(item.next !== undefined)
        nextEpisodeId = item.next.id_episodes;
    let result = {videoUrl: item.videourl,videoName, videoId: item.id_episodes, nextEpisodeId};
    
    //console.log(`${new Date()} - before return episode`);
    return result;
}
module.exports.getSerialJson = getSerialJson;

async function markEpisode(episodeId) {
    let reqOptions = {
        method: 'GET',
        uri: markEpisodeUrl + episodeId,
        jar: cookieJar,
        simple: true
    }
    let res = await request(reqOptions);
    return res;
}

module.exports.markEpisode = markEpisode;