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

export function isNumeric(stringValue) {
    try {
        parseInt(stringValue);
        return true;
    } catch {
        return false;
    }
}
