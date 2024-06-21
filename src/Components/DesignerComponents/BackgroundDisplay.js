import React from "react";
import "./BackgroundDisplay.css";
import { getCollection } from "../../Collections";
import { ChoiceDisplay } from "./ChoiceDisplay";

const rightTriangleUnicode = '\u25B6';

export function BackgroundDisplay({baseStateObject, inputHandler}) {
    const backgrounds = getCollection("backgrounds");
    const dndbackground = backgrounds.find(x => x.name === baseStateObject.background.name);

    const languageRows = [];
    if (dndbackground.languages) {
        for (let i = 0; i < dndbackground.languages.length; i++) {
            languageRows.push(<>
                <div>{rightTriangleUnicode + dndbackground.languages[i]}</div>
            </>)
        }
    }

    const skillProficienciesRows = [];
    if (dndbackground.skillProficiencies) {
        for (let i = 0; i < dndbackground.skillProficiencies.length; i++) {
            skillProficienciesRows.push(<>
                <div>{rightTriangleUnicode + dndbackground.skillProficiencies[i]}</div>
            </>)
        }
    }

    return (<>
        <div className="backgroundDisplayer">
            <div style={{display: (languageRows.length ? "block" : "none")}}>
                <div className="backgroundAttributeLabel">Languages:</div>
                <div>{languageRows}</div>
            </div>
            <div style={{display: (skillProficienciesRows.length ? "block" : "none")}}>
                <div className="backgroundAttributeLabel">Skills:</div>
                <div>{skillProficienciesRows}</div>
            </div>
            <div style={{display: (dndbackground.choices ? "block" : "none")}}>
                <ChoiceDisplay baseStateObject={baseStateObject} choiceObject={dndbackground} pathToPlayerChoices={"background.choices."} inputHandler={inputHandler}></ChoiceDisplay>
            </div>
        </div>
    </>)
}