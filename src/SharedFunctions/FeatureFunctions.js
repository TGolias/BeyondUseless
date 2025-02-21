export function GetFeaturePropertyNameFromFeature(playerConfigs, feature) {
    const featureNameWithoutSpaces = feature.name.replace(/\s/g, "");
    if (feature.classLevel) {
        return featureNameWithoutSpaces + feature.classLevel;
    } else {
        return featureNameWithoutSpaces + playerConfigs.level;
    }
}