import React from "react";
import "./BackgroundDesign.css";
import { getCollection } from "../../Collections";
import { ChoiceDesign } from "./ChoiceDesign";
import { getCapitalizedAbilityScoreName, onInputChangeHandler } from "../../SharedFunctions/ComponentFunctions";
import { CircleButton } from "../SimpleComponents/CircleButton";
import { calculateBackgroundPointsBought } from "../../SharedFunctions/TabletopMathFunctions";
import { FeatureDesign } from "./FeatureDesign";
import { FeatDesign } from "./FeatDesign";

const rightTriangleUnicode = '\u25B6';

export function BackgroundDesign({baseStateObject, inputHandler}) {
    const backgrounds = getCollection("backgrounds");
    const dndbackground = backgrounds.find(x => x.name === baseStateObject.background.name);
    if (!dndbackground) {
        return (<><div></div></>);
    } 


    const backgroundAbilityScoreMax = 2;
    const backgroundAbilityScoreMin = 0;
    const maxAbilityScorePoints = 3;
    const abilityScorePointsBought = calculateBackgroundPointsBought(baseStateObject);

    const backgroundAbilityScores = [];
    for (const abilityScoreKey of dndbackground.abilityScores) {
        const abilityScoreName = getCapitalizedAbilityScoreName(abilityScoreKey);
        const abilityScoreValue = baseStateObject.background.abilityScores[abilityScoreKey] ?? 0;

        const pathToProperty = "background.abilityScores." + abilityScoreKey;

        const disableMinusButton = abilityScoreValue <= backgroundAbilityScoreMin;
        const disablePlusButton = abilityScoreValue >= backgroundAbilityScoreMax || (abilityScorePointsBought >= maxAbilityScorePoints)

        backgroundAbilityScores.push(<>
            <div className="backgroundNewSection">{abilityScoreName}</div>
            <div className='backgroundStatChanger'>
                <CircleButton text={"-"} onClickHandler={() => {
                    return onInputChangeHandler(baseStateObject, pathToProperty, abilityScoreValue - 1, inputHandler);
                }} disabled={disableMinusButton}></CircleButton>
                <div className="backgroundStatValue">{abilityScoreValue}</div>
                <CircleButton text={"+"} onClickHandler={() => {
                    return onInputChangeHandler(baseStateObject, pathToProperty, abilityScoreValue + 1, inputHandler);
                }} disabled={disablePlusButton}></CircleButton>
            </div>
        </>);
    }

    const skillProficienciesRows = [];
    if (dndbackground.skillProficiencies) {
        for (let i = 0; i < dndbackground.skillProficiencies.length; i++) {
            skillProficienciesRows.push(<>
                <div>{rightTriangleUnicode + dndbackground.skillProficiencies[i]}</div>
            </>)
        }
    }

    const toolProficienciesRows = [];
    if (dndbackground.toolProficiencies) {
        for (let i = 0; i < dndbackground.toolProficiencies.length; i++) {
            toolProficienciesRows.push(<>
                <div>{rightTriangleUnicode + dndbackground.toolProficiencies[i]}</div>
            </>)
        }
    }

    const feats = getCollection("feats");

    return (<>
        <div className="backgroundDisplayer">
            <div className="backgroundAttributeLabel">{"Ability Scores Total: " + abilityScorePointsBought + "/" + maxAbilityScorePoints}</div>
            <div className="backgroundIndent backgroundEndOfSection">
                <>
                    {backgroundAbilityScores}
                </>
            </div>
            <div className="backgroundAttributeLabel">Skill Proficiencies</div>
            <div className="backgroundEndOfSection">{skillProficienciesRows}</div>
            <div className="backgroundAttributeLabel">Tool Proficiencies</div>
            <div className="backgroundEndOfSection">{toolProficienciesRows}</div>
            <div style={{display: (dndbackground.choices ? "block" : "none")}}>
                <ChoiceDesign baseStateObject={baseStateObject} choiceObject={dndbackground} pathToPlayerConfigObjectForChoices={"background"} inputHandler={inputHandler}></ChoiceDesign>
            </div>
            <div className="backgroundAttributeLabel">Feat</div>
            <div className="backgroundEndOfSection">
                <FeatDesign baseStateObject={baseStateObject} inputHandler={inputHandler} selectedFeatName={dndbackground.feat} feats={feats} pathToFeatureProperty={"background"}></FeatDesign>
            </div>
        </div>
    </>)
}