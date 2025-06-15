import { getNameDictionaryForCollection } from "../Collections";
import { calculateHPMax } from "./TabletopMathFunctions";
import { convertArrayOfStringsToHashMap } from "./Utils";

export function applyEffectsBeforeValueChange(newBaseStateObject, pathToProperty, newValue) {
    switch (pathToProperty) {
        case "level":
            return onLevelChangeHandler(newBaseStateObject, newValue);
        case "species.name":
            return onSpeciesNameChangeHandler(newBaseStateObject, newValue);
        case "background.name":
            return onBackgroundNameChangeHandler(newBaseStateObject, newValue);
    }

    for (let i = 0; i < newBaseStateObject.classes.length; i++) {
        const propertyToMatch = "classes[" + i + "].name";
        if (pathToProperty === propertyToMatch) {
            return onClassNameChangeHandler(newBaseStateObject, i, newValue)
        }
    }
}

export function applyEffectsAfterValueChange(newBaseStateObject) {
    checkIfMaxHPChanged(newBaseStateObject);
}

function onLevelChangeHandler(newBaseStateObject, newLevelValue) {
    // We need to do some custom shit here. If they drop their level below what their classes are at, we will need to adjust by removing levels in classes and potentially classes themselves.
    let levelsToDistribute = newLevelValue;

    // We may or may not even need the copies here depending on if we remove things. It doesn't hurt to do it anyway.
    const newClasses = [...newBaseStateObject.classes];

    for (let i = 0; i < newClasses.length; i++) {
        const playerClass = newClasses[i];
        levelsToDistribute -= playerClass.levels;
        if (levelsToDistribute <= 0) {
            // Alright, we're done counting. Clone the class, drop the level of the current class by whatever we are into the negatives, then set the copy in the array.
            const newPlayerClass = Object.assign({}, playerClass);
            newPlayerClass.levels += levelsToDistribute;
            newClasses[i] = newPlayerClass;

            // Check if there are any classes in the array after this.
            let nextClassIndex = i + 1;
            if (nextClassIndex < newClasses.length) {
                // There are classes after this in the array, so we want to clear all of them.
                newClasses.splice(nextClassIndex, newClasses.length - nextClassIndex);
            }
            break;
        }
    }

    newBaseStateObject.classes = newClasses;
}

function onSpeciesNameChangeHandler(newBaseStateObject, newSpeciesNameValue) {
    // Remove all choises from the previous species.
    if (newBaseStateObject.species.name !== newSpeciesNameValue) {
        newBaseStateObject.species.choices = {};
        newBaseStateObject.species.features = {};
    }
}

function onBackgroundNameChangeHandler(newBaseStateObject, newBackgroundValue) {
    // Remove all ability score increases that the new background does not have access to.
    const backgroundMap = getNameDictionaryForCollection("backgrounds");
    const dndbackground = backgroundMap[newBackgroundValue];

    // Clone the ability scores first in case things get removed, that way undo functionality still works.
    newBaseStateObject.background.abilityScores = {...newBaseStateObject.background.abilityScores};

    const newBackgroundAbilityScores = convertArrayOfStringsToHashMap(dndbackground.abilityScores);
    for (const abilityScoreKey of Object.keys(newBaseStateObject.background.abilityScores)) {
        if (!newBackgroundAbilityScores[abilityScoreKey]) {
            // This ability score is not contained in the new background, therefore the increase would be illegal. Remove it.
            delete newBaseStateObject.background.abilityScores[abilityScoreKey];
        }
    }
}

function onClassNameChangeHandler(newBaseStateObject, index, newClassNameValue) {
    // Remove all choises from the previous species.
    if (newBaseStateObject.classes[index].name !== newClassNameValue) {
        newBaseStateObject.classes[index].choices = {};
        newBaseStateObject.classes[index].features = {};
    }
}

function checkIfMaxHPChanged(newBaseStateObject) {
    if (newBaseStateObject.currentStatus.remainingHp) {
        const maxHp = calculateHPMax(newBaseStateObject);
        if (newBaseStateObject.currentStatus.remainingHp > maxHp) {
            // Make a clone of currentStatus since we will be making a change.
            newBaseStateObject.currentStatus = {...newBaseStateObject.currentStatus}
            newBaseStateObject.currentStatus.remainingHp = maxHp;
        }
    }
    
}