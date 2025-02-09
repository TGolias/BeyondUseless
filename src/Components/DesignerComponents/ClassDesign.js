import React from "react";
import './ClassDesign.css'
import { ChoiceDesign } from "./ChoiceDesign";
import { getCollection } from "../../Collections";
import { getCapitalizedAbilityScoreName } from "../../SharedFunctions/ComponentFunctions";
import { FeatureDesign } from "./FeatureDesign";

const rightTriangleUnicode = '\u25B6';

export function ClassDesign({baseStateObject, inputHandler, classIndex}) {
    const classes = getCollection("classes");
    const playerClassObject = baseStateObject.classes[classIndex];
    const dndclass = classes.find(x => x.name === playerClassObject.name);
    const classLevel = playerClassObject.levels;

    const savingThrowProficienciesRows = [];
    if (dndclass.savingThrowProficiencies) {
        for (let i = 0; i < dndclass.savingThrowProficiencies.length; i++) {
            const abilityScoreName = getCapitalizedAbilityScoreName(dndclass.savingThrowProficiencies[i]);
            savingThrowProficienciesRows.push(<>
                <div>{rightTriangleUnicode + abilityScoreName}</div>
            </>)
        }
    }

    const classFeatureRows = [];
    if (dndclass.features) {
        for (let i = 0; i < dndclass.features.length; i++) {
            const classFeature = dndclass.features[i];
            if (classLevel >= classFeature.classLevel) {
                const featurePropertyName = classFeature.name.replace(/\s/g, "") + classFeature.classLevel;
                const pathToClassFeatureProperty = "classes[" + classIndex + "].features." + featurePropertyName + ".";
                const playerClassFeatureObject = playerClassObject.features ? playerClassObject.features[featurePropertyName] : undefined;

                const resourcesForThisLevel = dndclass.resourcesPerLevel ? dndclass.resourcesPerLevel[classLevel] : {};

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
            <div>
                <div className="classAttributeLabel">Saving Throw Proficiencies:</div>
                <div className="classCollectionWrapper">
                    <div>{savingThrowProficienciesRows}</div>
                </div>
            </div>
            <div style={{display: (dndclass.choices ? "block" : "none")}}>
                <ChoiceDesign baseStateObject={baseStateObject} choiceObject={dndclass} pathToPlayerChoices={"classes[" + classIndex + "].choices."} inputHandler={inputHandler}></ChoiceDesign>
            </div>
            <div style={{display: (classFeatureRows.length ? "block" : "none")}}>{classFeatureRows}</div>
        </div>
    </>)
}