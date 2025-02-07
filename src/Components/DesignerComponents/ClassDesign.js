import React from "react";
import './ClassDesign.css'
import { ChoiceDesign } from "./ChoiceDesign";
import { getCollection } from "../../Collections";
import { getCapitalizedAbilityScoreName } from "../../SharedFunctions/ComponentFunctions";
import { SelectList } from "../SimpleComponents/SelectList";

const rightTriangleUnicode = '\u25B6';

export function ClassDesign({baseStateObject, inputHandler, classIndex}) {
    const classes = getCollection("classes");
    const playerClassObject = baseStateObject.classes[classIndex];
    const dndclass = classes.find(x => x.name === playerClassObject.name);
    const classLevel = playerClassObject.levels;

    const feats = getCollection("feats");
    const featNames = feats.map(x => x.name);

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
                const classFeatureContent = [];
                if (classFeature.feat) {
                    const featurePropertyName = classFeature.name + classFeature.classLevel;
                    const pathToClassFeatureProperty = "classes[" + classIndex + "].features." + featurePropertyName
                    classFeatureContent.push(<>
                        <div className="classFeatSelector">
                            <div className="classAttributeLabel">Level {classFeature.classLevel} - {classFeature.name}</div>
                            <SelectList options={featNames} isNumberValue={false} baseStateObject={baseStateObject} pathToProperty={pathToClassFeatureProperty + ".name"} inputHandler={inputHandler}></SelectList>
                        </div>
                    </>);

                    const selectedFeatName = playerClassObject.features && playerClassObject.features[featurePropertyName] ? playerClassObject.features[featurePropertyName].name : undefined;
                    if (selectedFeatName) {
                        const selectedFeat = feats.find(x => x.name === selectedFeatName);
                        classFeatureContent.push(<>
                            <ChoiceDesign baseStateObject={baseStateObject} choiceObject={selectedFeat} pathToPlayerChoices={pathToClassFeatureProperty + ".choices."} inputHandler={inputHandler}></ChoiceDesign>
                        </>);
                    }
                }
                classFeatureRows.push(<>
                    <div className="classFeatureHolder">{classFeatureContent}</div>
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