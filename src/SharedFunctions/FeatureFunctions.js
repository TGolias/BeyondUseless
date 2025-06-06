export function GetFeaturePropertyNameFromFeature(playerConfigs, feature) {
    const featureNameWithoutSpaces = feature.name.replace(/\s/g, "");
    if (feature.classLevel) {
        return featureNameWithoutSpaces + feature.classLevel;
    } else if (feature.level) {
        return featureNameWithoutSpaces + feature.level;
    } else {
        return featureNameWithoutSpaces;
    }
}

export function GetAllPossibleFeaturesFromObject(object) {
    let allFeatures = []
    if (object.aspects) {
        const featuresFromAspects = GetAllPossibleFeaturesFromObject(object.aspects);
        allFeatures = [...allFeatures, ...featuresFromAspects];
    }
    if (object.features) {
        allFeatures = [...allFeatures, ...object.features];
    }
    if (object.choices) {
        for (let choice of object.choices) {
            const featuresFromChoice = GetFeaturesFromChoice(choice);
            allFeatures = [...allFeatures, ...featuresFromChoice];
        }
    }
    return allFeatures;
}

function GetFeaturesFromChoice(choice) {
    let allFeaturesFromChoice = [];
    if (choice.options && choice.options.length > 0) {
        for (let option of choice.options) {
            if (choice.choiceToAttributesMapping && choice.choiceToAttributesMapping.features) {
                const featuresFromChoice = option[choice.choiceToAttributesMapping.features];
                if (featuresFromChoice) {
                    allFeaturesFromChoice = [...allFeaturesFromChoice, ...featuresFromChoice];
                }
            }

            if (option.choices) {
                const featuresFromInnerChoice = GetFeaturesFromChoice(choice);
                allFeaturesFromChoice = [...allFeaturesFromChoice, ...featuresFromInnerChoice];
            }
        }
    }
    return allFeaturesFromChoice;
}