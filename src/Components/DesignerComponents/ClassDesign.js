import React from "react";
import './ClassDesign.css'
import { ChoiceDesign } from "./ChoiceDesign";
import { getCollection } from "../../Collections";
import { getCapitalizedAbilityScoreName } from "../../SharedFunctions/ComponentFunctions";

const rightTriangleUnicode = '\u25B6';

export function ClassDesign({baseStateObject, inputHandler, classIndex}) {
    const classes = getCollection("classes");
    const dndclass = classes.find(x => x.name === baseStateObject.classes[classIndex].name);

    const savingThrowProficienciesRows = [];
    if (dndclass.savingThrowProficiencies) {
        for (let i = 0; i < dndclass.savingThrowProficiencies.length; i++) {
            const abilityScoreName = getCapitalizedAbilityScoreName(dndclass.savingThrowProficiencies[i]);
            savingThrowProficienciesRows.push(<>
                <div>{rightTriangleUnicode + abilityScoreName}</div>
            </>)
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
        </div>
    </>)
}