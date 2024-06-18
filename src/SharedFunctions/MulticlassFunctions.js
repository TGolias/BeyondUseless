import { getCollection } from "../Collections";

export function CanMulticlass(playerConfigs) {
    const classes = getCollection("classes");
    if (playerConfigs.classes.length >= classes.length) {
        // If the player has already selected all the classes, they obviously can't multiclass anymore.
        return false;
    }

    let classLevels = 0;
    for (let i = 0; i < playerConfigs.classes.length; i++) {
        classLevels += playerConfigs.classes[i].levels;
    }
    return playerConfigs.level > classLevels;
}

export function GetValidClassesArray(playerConfigs, className) {
    const classes = getCollection("classes");

    // We want to include the class from className even if the player has it, because we want it to show in the select list where it is currently selected.
    let allClassNames = classes.map(x => x.name);
    let invalidClassNames = playerConfigs.classes.map(x => x.name).filter(x => x !== className);
    let validClassNames = allClassNames.filter(x => !invalidClassNames.includes(x));
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

    let takenClassNames = playerConfigs.classes.map(x => x.name);
    let nextClass = classes.find(x => !takenClassNames.includes(x.name));
    return {
        name: nextClass.name,
        levels: 1 // Just give them one level if they select it.
    }
}