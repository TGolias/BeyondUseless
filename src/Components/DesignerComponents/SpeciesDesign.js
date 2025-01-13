import React from "react";
import './SpeciesDesign.css'
import { ChoiceDesign } from "./ChoiceDesign";
import { getCollection } from "../../Collections";

const rightTriangleUnicode = '\u25B6';

export function SpeciesDesign({baseStateObject, inputHandler}) {
    const species = getCollection("species");
    const dndspecies = species.find(x => x.name === baseStateObject.species.name);

    const resistanceRows = [];
    if (dndspecies.resistances) {
        for (let i = 0; i < dndspecies.resistances.length; i++) {
            resistanceRows.push(<>
                <div>{rightTriangleUnicode + dndspecies.resistances[i]}</div>
            </>)
        }
    }

    const skillProficienciesRows = [];
    if (dndspecies.skillProficiencies) {
        for (let i = 0; i < dndspecies.skillProficiencies.length; i++) {
            skillProficienciesRows.push(<>
                <div>{rightTriangleUnicode + dndspecies.skillProficiencies[i]}</div>
            </>)
        }
    }

    return (<>
        <div className="speciesDisplayer">
            <div>Speed: {dndspecies.speed}</div>
            <div>Size: {dndspecies.size}</div>
            <div style={{display: (resistanceRows.length ? "block" : "none")}}>
                <div className="speciesAttributeLabel">Resistances:</div>
                <div>{resistanceRows}</div>
            </div>
            <div style={{display: (skillProficienciesRows.length ? "block" : "none")}}>
                <div className="speciesAttributeLabel">Skills:</div>
                <div>{skillProficienciesRows}</div>
            </div>
            <div style={{display: (dndspecies.choices ? "block" : "none")}}>
                <ChoiceDesign baseStateObject={baseStateObject} choiceObject={dndspecies} pathToPlayerChoices={"species.choices."} inputHandler={inputHandler}></ChoiceDesign>
            </div>
        </div>
    </>)
}