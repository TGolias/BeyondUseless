import React from "react";
import './SpeciesDesign.css'
import { ChoiceDesign } from "./ChoiceDesign";
import { getNameDictionaryForCollection } from "../../Collections";
import { GetFeaturePropertyNameFromFeature } from "../../SharedFunctions/FeatureFunctions";
import { FeatureDesign } from "./FeatureDesign";

const rightTriangleUnicode = '\u25B6';

export function SpeciesDesign({baseStateObject, inputHandler}) {
    const speciesMap = getNameDictionaryForCollection("species");
    const dndspecies = speciesMap[baseStateObject.species.name];
    if (!dndspecies) {
        return (<><div></div></>);
    } 

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

    const speciesFeatureRows = [];
    if (dndspecies.features) {
        const speciesFeatures = dndspecies.features;

        for (let i = 0; i < speciesFeatures.length; i++) {
            const speciesFeature = speciesFeatures[i];
            if (speciesFeature.level && baseStateObject.level >= speciesFeature.level) {
                const featurePropertyName = GetFeaturePropertyNameFromFeature(baseStateObject, speciesFeature);
                const pathToSpeciesFeatureProperty = "species.features." + featurePropertyName;
                const playerClassFeatureObject = baseStateObject.species?.features ? baseStateObject.species.features[featurePropertyName] : undefined;

                speciesFeatureRows.push(<>
                    <div className="classFeatureHolder">
                        <div className="classAttributeLabel">Level {speciesFeature.level} - {speciesFeature.name}</div>
                        <FeatureDesign baseStateObject={baseStateObject} inputHandler={inputHandler} feature={speciesFeature} playerFeatureObject={playerClassFeatureObject} pathToFeatureProperty={pathToSpeciesFeatureProperty}></FeatureDesign>
                    </div>
                </>);
            }
        } 
    }

    return (<>
        <div className="speciesDisplayer">
            <div className="speciesAttributeLabel">Base Speed: {dndspecies.speed}</div>
            <div style={{display: (dndspecies.size ? "block" : "none")}}>
                <div className="speciesAttributeLabel">Size: {dndspecies.size}</div>
            </div>
            <div style={{display: (dndspecies.darkvision ? "block" : "none")}}>
                <div className="speciesAttributeLabel">Darkvision: {dndspecies.darkvision}</div>
            </div>
            <div style={{display: (resistanceRows.length ? "block" : "none")}}>
                <div className="speciesAttributeLabel">Resistances:</div>
                <div className="speciesCollectionWrapper">
                    <div>{resistanceRows}</div>
                </div>
            </div>
            <div style={{display: (skillProficienciesRows.length ? "block" : "none")}}>
                <div className="speciesAttributeLabel">Skills:</div>
                <div className="speciesCollectionWrapper">
                    <div>{skillProficienciesRows}</div>
                </div>
            </div>
            <div style={{display: (speciesFeatureRows.length ? "block" : "none")}}>{speciesFeatureRows}</div>
            <div style={{display: (dndspecies.choices ? "block" : "none")}}>
                <ChoiceDesign baseStateObject={baseStateObject} choiceObject={dndspecies} pathToPlayerConfigObjectForChoices={"species"} inputHandler={inputHandler}></ChoiceDesign>
            </div>
        </div>
    </>)
}