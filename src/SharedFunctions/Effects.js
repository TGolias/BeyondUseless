export function applyEffects(newBaseStateObject, pathToProperty, newValue) {
    switch (pathToProperty) {
        case "level":
            return onLevelChangeHandler(newBaseStateObject, newValue);
    }
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