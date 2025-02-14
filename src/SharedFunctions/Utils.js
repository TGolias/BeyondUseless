export function convertArrayOfStringsToHashMap(arrayOfStrings) {
    const hashMap = {};
    for (let i = 0; i < arrayOfStrings.length; i++) {
        const arrayItem = arrayOfStrings[i];
        hashMap[arrayItem] = true;
    }
    return hashMap;
}

export function convertHashMapToArrayOfStrings(hashMap) {
    const array = [];
    for (const [key, value] of Object.entries(hashMap)) {
        if (value) {
            array.push(key);
        }
    }
    return array;
}

export function convertArrayToDictionary(arrayOfObjects, key) {
    const dict = {};
    for (let i = 0; i < arrayOfObjects.length; i++) {
        const object = arrayOfObjects[i];
        const objectKey = key === "$VALUE" ? key : object[key];
        dict[objectKey] = object;
    }
    return dict;
}

export function isObject(value) {
    return value instanceof Object;
}

export function isNumeric(stringValue) {
    try {
        return !isNaN(parseInt(stringValue));
    } catch {
        return false;
    }
}

export function playAudio(audioFileName) {
    const audioFile = document.getElementById(audioFileName);
    if (audioFile) {
        // @ts-ignore
        audioFile.currentTime = 0;
        // @ts-ignore
        audioFile.play();
    }
}

export function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

export function getHomePageUrl() {
    const indexOfQuery = window.location.href.indexOf('?');
    const windowLocationWithoutQueryParams = indexOfQuery === -1 ? window.location.href : window.location.href.substring(0, indexOfQuery);
    return windowLocationWithoutQueryParams;
}
