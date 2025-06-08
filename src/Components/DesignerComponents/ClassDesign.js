import React from "react";
import './ClassDesign.css'
import { ChoiceDesign } from "./ChoiceDesign";
import { getCollection } from "../../Collections";
import { getCapitalizedAbilityScoreName } from "../../SharedFunctions/ComponentFunctions";
import { FeatureDesign } from "./FeatureDesign";
import { GetFeaturePropertyNameFromFeature } from "../../SharedFunctions/FeatureFunctions";
import { TransformDndClassBasedOnMainOrMulticlass } from "../../SharedFunctions/ClassFunctions";

const rightTriangleUnicode = '\u25B6';

export function ClassDesign({baseStateObject, inputHandler, classIndex}) {
    const classes = getCollection("classes");
    const playerClassObject = baseStateObject.classes[classIndex];
    const dndclass = TransformDndClassBasedOnMainOrMulticlass(baseStateObject, classes.find(x => x.name === playerClassObject.name));
    const classLevel = playerClassObject.levels;

    const savingThrowProficienciesRows = [];
    if (dndclass.savingThrowProficiencies) {
        for (let i = 0; i < dndclass.savingThrowProficiencies.length; i++) {
            const abilityScoreName = getCapitalizedAbilityScoreName(dndclass.savingThrowProficiencies[i]);
            savingThrowProficienciesRows.push(<>
                <div>{rightTriangleUnicode + abilityScoreName}</div>
            </>);
        }
    }

    const weaponProficienciesRows = [];
    if (dndclass.weaponProficiencies) {
        for (let i = 0; i < dndclass.weaponProficiencies.length; i++) {
            weaponProficienciesRows.push(<>
                <div>{rightTriangleUnicode + dndclass.weaponProficiencies[i]}</div>
            </>);
        }
    }

    const armorTrainingRows = [];
    if (dndclass.armorTraining) {
        for (let i = 0; i < dndclass.armorTraining.length; i++) {
            armorTrainingRows.push(<>
                <div>{rightTriangleUnicode + dndclass.armorTraining[i]}</div>
            </>);
        }
    }

    const toolProficienciesRows = [];
    if (dndclass.toolProficiencies) {
        for (let i = 0; i < dndclass.toolProficiencies.length; i++) {
            toolProficienciesRows.push(<>
                <div>{rightTriangleUnicode + dndclass.toolProficiencies[i]}</div>
            </>);
        }
    }

    const classFeatureRows = [];
    if (dndclass.features) {
        const classFeatures = dndclass.features;
        
        // Get Subclass Features here first
        const subclassFeatures = dndclass.features.filter(feature => feature.subclass);
        let featuresFromSubclasses = [];
        if (subclassFeatures) {
            const subclasses = getCollection("subclasses");
            for (let subclassFeature of subclassFeatures) {
                const subclassFeaturePropertyName = GetFeaturePropertyNameFromFeature(baseStateObject, subclassFeature);
                const subclassName = playerClassObject.features && playerClassObject.features[subclassFeaturePropertyName] ? playerClassObject.features[subclassFeaturePropertyName].name : undefined
                if (subclassName) {
                    const subclass = subclasses.find(subclass => subclass.name === subclassName);
                    featuresFromSubclasses = [...featuresFromSubclasses, ...subclass.features];
                }
            }
        }

        const allFeatures = [...classFeatures, ...featuresFromSubclasses];
        const allFeaturesSorted = allFeatures.sort((feature1, feature2) => feature1.classLevel - feature2.classLevel);

        // Show all class and subclass features in order now.
        for (let i = 0; i < allFeaturesSorted.length; i++) {
            const classFeature = allFeaturesSorted[i];
            if (classLevel >= classFeature.classLevel) {
                const featurePropertyName = GetFeaturePropertyNameFromFeature(baseStateObject, classFeature);
                const pathToClassFeatureProperty = "classes[" + classIndex + "].features." + featurePropertyName;
                const playerClassFeatureObject = playerClassObject.features ? playerClassObject.features[featurePropertyName] : undefined;

                const resourcesForThisLevel = dndclass.resourcesPerLevel ? dndclass.resourcesPerLevel[classLevel - 1] : {};

                classFeatureRows.push(<>
                    <div className="classFeatureHolder">
                        <div className="classAttributeLabel">Level {classFeature.classLevel} - {classFeature.name}</div>
                        <FeatureDesign baseStateObject={baseStateObject} inputHandler={inputHandler} feature={classFeature} playerFeatureObject={playerClassFeatureObject} pathToFeatureProperty={pathToClassFeatureProperty} parameters={resourcesForThisLevel}></FeatureDesign>
                    </div>
                </>);
            }
        }
    }

    return (<>
        <div className="classDisplayer">
            <div style={{display: (savingThrowProficienciesRows.length ? "block" : "none")}}>
                <div className="classAttributeLabel">Saving Throw Proficiencies:</div>
                <div className="classCollectionWrapper">
                    <div>{savingThrowProficienciesRows}</div>
                </div>
            </div>
            <div style={{display: (weaponProficienciesRows.length ? "block" : "none")}}>
                <div className="classAttributeLabel">Weapon Proficiencies:</div>
                <div className="classCollectionWrapper">
                    <div>{weaponProficienciesRows}</div>
                </div>
            </div>
            <div style={{display: (armorTrainingRows.length ? "block" : "none")}}>
                <div className="classAttributeLabel">Armor Training:</div>
                <div className="classCollectionWrapper">
                    <div>{armorTrainingRows}</div>
                </div>
            </div>
            <div style={{display: (toolProficienciesRows.length ? "block" : "none")}}>
                <div className="classAttributeLabel">Tool Proficiencies:</div>
                <div className="classCollectionWrapper">
                    <div>{toolProficienciesRows}</div>
                </div>
            </div>
            <div style={{display: (dndclass.choices ? "block" : "none")}}>
                <ChoiceDesign baseStateObject={baseStateObject} choiceObject={dndclass} pathToPlayerConfigObjectForChoices={"classes[" + classIndex + "]"} inputHandler={inputHandler}></ChoiceDesign>
            </div>
            <div style={{display: (classFeatureRows.length ? "block" : "none")}}>{classFeatureRows}</div>
        </div>
    </>)
}