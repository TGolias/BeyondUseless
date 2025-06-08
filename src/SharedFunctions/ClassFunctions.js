export function TransformDndClassBasedOnMainOrMulticlass(playerConfigs, dndClass) {
    const transformedDndClass = {...dndClass}
    delete transformedDndClass.mainClass;
    delete transformedDndClass.multiClass;

    if (!playerConfigs.classes || playerConfigs.classes.length < 0 || playerConfigs.classes[0].name === dndClass.name) {
        if (dndClass.mainClass) {
            for (const key of Object.keys(dndClass.mainClass)) {
                transformedDndClass[key] = dndClass.mainClass[key];
            }
        }
    } else {
        if (dndClass.mainClass) {
            for (const key of Object.keys(dndClass.multiClass)) {
                transformedDndClass[key] = dndClass.multiClass[key];
            }
        }
    }

    return transformedDndClass;
}