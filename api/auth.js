const getMac = require('getmac');
const jws = require('jsonwebtoken');

let macAdress;
const defaultMac = 'e5:ce:7f:4b:a6:fc';

const passwordCrypt = async (password) => {
    const mac = await getMacForHash();
    return await cryptJwsToken(password, mac);
}
module.exports.passwordCrypt = passwordCrypt;

const passwordDecrypt = async (password) => {
    const mac = await getMacForHash();
    return await decryptJwsToken(password, mac);
}
module.exports.passwordDecrypt = passwordDecrypt;

const getMacForHash = async () => {
    if(macAdress === null || macAdress === undefined) {
        macAdress = await getMacFromOSForHash();
        return macAdress;
    } else {
        return macAdress;
    }
}
const getMacFromOSForHash = () => {
    return new Promise( (resolve, reject) => {
        getMac.getMac((err, mac) => {
            if(err || mac === undefined || mac === null || mac.length === 0) {
                resolve(defaultMac);
            }
            resolve(mac);
        });
    }); 
    
}
const cryptJwsToken = async (password, mac) => {
    if(mac === null || mac === undefined) {
        mac = defaultMac;
    }
    return await jws.sign(password, mac);
}
const decryptJwsToken = async (password, mac) => {
    try {
        return await jws.verify(password, mac);
    } catch (ex) {
        return undefined;
    }
}