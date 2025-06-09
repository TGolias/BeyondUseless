import { getCollection } from "../Collections";
import { performBooleanCalculation } from "./TabletopMathFunctions";
import { convertArrayOfStringsToHashMap, convertArrayToDictionary } from "./Utils";

export function CanMulticlass(playerConfigs) {
    if (playerConfigs.classes.length === 0) {
        // If they don't have any classes, they can pick anything with no restrictions.
        return true;
    }

    const classes = getCollection("classes");
    const possibleClassesDictionary = convertArrayToDictionary(classes, "name");
    if (playerConfigs.classes.length >= classes.length) {
        // If the player has already selected all the classes, they obviously can't multiclass anymore.
        return false;
    }

    let classLevels = 0;
    for (let i = 0; i < playerConfigs.classes.length; i++) {
        const dndClass = possibleClassesDictionary[playerConfigs.classes[i].name];
        if (dndClass.multiClassConditions && !performBooleanCalculation(playerConfigs, dndClass.multiClassConditions)) {
            // This character failed a multiclassing condition of one of their existing classes, so they cannot multiclass.
            return false;
        }

        // remove it from our list of possible classes.
        delete possibleClassesDictionary[playerConfigs.classes[i].name];

        classLevels += playerConfigs.classes[i].levels;
    }

    if (playerConfigs.level <= classLevels) {
        // They don't have any new levels to allocate so they can't multiclass
        return false;
    }

    for (let dndClass of Object.values(possibleClassesDictionary)) {
        if (!dndClass.multiClassConditions || performBooleanCalculation(playerConfigs, dndClass.multiClassConditions)) {
            // There is at least one class that we meet the conditions for (or it doesn't have any multiclass conditions).
            return true;
        }
    }

    // We couldn't find any clases, therefore we can't multiclass.
    return false;
}

export function GetValidClassesArray(playerConfigs, className) {
    const classes = getCollection("classes");

    const playerHasNoClasses = playerConfigs.classes.length <= 1;

    // We want to include the class from className even if the player has it, because we want it to show in the select list where it is currently selected.
    let alreadyChosenClassNames = playerConfigs.classes.map(x => x.name).filter(x => x !== className);
    let alreadyChosenClassNamesMap = convertArrayOfStringsToHashMap(alreadyChosenClassNames);
    let validClasses = classes.filter(x => x.name === className || (!alreadyChosenClassNamesMap[x.name] && (playerHasNoClasses || !x.multiClassConditions || performBooleanCalculation(playerConfigs, x.multiClassConditions))));
    let validClassNames = validClasses.map(x => x.name);
    return validClassNames;
}

export function GetValidClassLevelsArray(playerConfigs, className) {
    let levelsToGiveToClasses = playerConfigs.level;
    for (let i = 0; i < playerConfigs.classes.length; i++) {
        const dndclass = playerConfigs.classes[i];
        if (dndclass.name !== className) {
            // We don't want the levels for this class to count against itself.
            levelsToGiveToClasses -= dndclass.levels;
        }
    }
    // Generate an array from 1 to whatever we ended up with.
    return Array.from({length: levelsToGiveToClasses}, (_, i) => i + 1);
}

export function GetValidMulticlassDefault(playerConfigs) {
    const classes = getCollection("classes");

    const playerHasNoClasses = playerConfigs.classes.length <= 1;

    let takenClassNames = playerConfigs.classes.map(x => x.name);
    let nextClass = classes.find(x => !takenClassNames.includes(x.name) && (playerHasNoClasses || !x.multiClassConditions || performBooleanCalculation(playerConfigs, x.multiClassConditions)));
    return {
        name: nextClass.name,
        levels: 1 // Just give them one level if they select it.
    }
}