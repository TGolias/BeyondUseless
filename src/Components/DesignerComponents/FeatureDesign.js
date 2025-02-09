import React from "react";
import './FeatureDesign.css'
import { SelectList } from "../SimpleComponents/SelectList";
import { getCollection } from "../../Collections";
import { calculateAspectCollection, performBooleanCalculation, performMathCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { ChoiceDesign } from "./ChoiceDesign";
import { getCapitalizedAbilityScoreName } from "../../SharedFunctions/ComponentFunctions";

const rightTriangleUnicode = '\u25B6';

export function FeatureDesign({baseStateObject, inputHandler, feature, playerFeatureObject, pathToFeatureProperty, parameters = {}}) {
    const featureContent = [];
    if (feature.feat) {
        const selectedFeatName = playerFeatureObject?.name;

        const feats = getCollection("feats");
        const alreadySelectedFeats = calculateAspectCollection(baseStateObject, "feat");
        const validFeats = feats.filter(feat => {
            if (feat.name === selectedFeatName) {
                // This is the one we currently have selected. Keep it.
                return true;
            }

            if (!feat.repeatable && alreadySelectedFeats.includes(feat.name)) {
                // This feat is not repeatable and it's already selected somewhere else.
                return false;
            }

            if (feature.feat.restrictedTypes && feature.feat.restrictedTypes.length > 0 && !feature.feat.restrictedTypes.includes(feat.type)) {
                // This feat's type is not part of the restrited types.
                return false;
            }

            if (feat.prerequisites) {
                const meetsPrerequisites = performBooleanCalculation(baseStateObject, feat.prerequisites, parameters);
                return meetsPrerequisites;
            }
            return true;
        });
        const validFeatNames = validFeats.map(feat => feat.name);

        featureContent.push(<>
            <div className="featSelector">
                <SelectList options={validFeatNames} isNumberValue={false} baseStateObject={baseStateObject} pathToProperty={pathToFeatureProperty + "name"} inputHandler={inputHandler}></SelectList>
            </div>
        </>);
        
        if (selectedFeatName) {
            const selectedFeat = feats.find(x => x.name === selectedFeatName);
            featureContent.push(<>
                <ChoiceDesign baseStateObject={baseStateObject} choiceObject={selectedFeat} pathToPlayerChoices={pathToFeatureProperty + "choices."} inputHandler={inputHandler}></ChoiceDesign>
            </>);
        }
    }

    if (feature.spellcasting) {
        const spellcastingAbility = performMathCalculation(baseStateObject, feature.spellcasting.ability.calcuation, parameters);
        featureContent.push(<>
            <div>Spellcasting Ability</div>
            <div>{rightTriangleUnicode}{getCapitalizedAbilityScoreName(spellcastingAbility)}</div>
        </>);

        if (feature.spellcasting.cantripsKnown) {
            let cantripsKnown = performMathCalculation(baseStateObject, feature.spellcasting.cantripsKnown.calcuation, parameters);
            featureContent.push(<>
                <div>{cantripsKnown} Cantrip{(cantripsKnown > 1 ? "s" : "")} Known</div>
            </>);

            const predeterminedSelections = feature.spellcasting.cantripsKnown.predeterminedSelections ?? [];
            for (let predeterminedSelection of predeterminedSelections) {
                featureContent.push(<>
                    <div>{rightTriangleUnicode}{predeterminedSelection.spellName}</div>
                </>);
            }

            cantripsKnown -= predeterminedSelections.length;
            if (cantripsKnown > 0) {
                const allCantrips = getCollection("cantrips");
                const validCantripNames = allCantrips.map(cantrip => cantrip.name);
                
                for (let i = 0; i < cantripsKnown; i++) {
                    featureContent.push(<>
                        <SelectList options={validCantripNames} isNumberValue={false} baseStateObject={baseStateObject} pathToProperty={pathToFeatureProperty + "cantrips[" + i + "]"} inputHandler={inputHandler}></SelectList>
                    </>);
                }
            }
        }

        if (feature.spellcasting.spellsKnown) {
            let spellsKnown = performMathCalculation(baseStateObject, feature.spellcasting.spellsKnown.calcuation, parameters);
            featureContent.push(<>
                <div>{spellsKnown} Spell{(spellsKnown > 1 ? "s" : "")} Known</div>
            </>);

            const predeterminedSelections = feature.spellcasting.spellsKnown.predeterminedSelections ?? [];
            for (let predeterminedSelection of predeterminedSelections) {
                featureContent.push(<>
                    <div>{rightTriangleUnicode}{predeterminedSelection.spellName}</div>
                </>);
            }

            spellsKnown -= predeterminedSelections.length;
            if (spellsKnown > 0) {
                const allSpells = getCollection("spells");
                const validSpellNames = allSpells.map(cantrip => cantrip.name);

                for (let i = 0; i < spellsKnown; i++) {
                    featureContent.push(<>
                        <SelectList options={validSpellNames} isNumberValue={false} baseStateObject={baseStateObject} pathToProperty={pathToFeatureProperty + "spells[" + i + "]"} inputHandler={inputHandler}></SelectList>
                    </>);
                }
            }
        }
    }

    return (<>
        <div className="featureHolder">{featureContent}</div>
    </>)
}