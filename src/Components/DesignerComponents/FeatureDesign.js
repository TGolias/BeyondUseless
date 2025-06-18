import React from "react";
import './FeatureDesign.css'
import { SelectList } from "../SimpleComponents/SelectList";
import { getCollection } from "../../Collections";
import { calculateAspectCollection, findResource, findResourceFromAllResources, getAllSpellcastingFeatures, getAllSpells, performBooleanCalculation, performMathCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { ChoiceDesign } from "./ChoiceDesign";
import { getCapitalizedAbilityScoreName, getValueFromObjectAndPath } from "../../SharedFunctions/ComponentFunctions";
import { convertArrayOfStringsToHashMap, convertArrayToDictionary } from "../../SharedFunctions/Utils";
import { FeatDesign } from "./FeatDesign";

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
            <div className="featureSelectList">
                <div className="selectFeatText">Select Feat:</div>
                <SelectList options={validFeatNames} isNumberValue={false} baseStateObject={baseStateObject} pathToProperty={pathToFeatureProperty + ".name"} inputHandler={inputHandler}></SelectList>
            </div>
        </>);
        
        if (selectedFeatName) {
            featureContent.push(<>
                <FeatDesign baseStateObject={baseStateObject} inputHandler={inputHandler} selectedFeatName={selectedFeatName} feats={feats} pathToFeatureProperty={pathToFeatureProperty}></FeatDesign>
            </>);
        }
    }

    if (feature.eldrichInvocations) {
        const invocations = getCollection("eldrichinvocations");

        let invocationsKnown = performMathCalculation(baseStateObject, feature.eldrichInvocations.invocationsKnown.calculation, parameters);
        if (invocationsKnown && invocationsKnown > 0) {
            for (let i = 0; i < invocationsKnown; i++) {
                const selectedInvocationNames = (playerFeatureObject && playerFeatureObject.eldrichInvocations && playerFeatureObject.eldrichInvocations.length > 0) ? playerFeatureObject.eldrichInvocations.map(x => x ? x.name : undefined) : [];
                const pathToEldrichInvocation = pathToFeatureProperty + ".eldrichInvocations[" + i + "]";
                const pathToEldrichInvocationName = pathToEldrichInvocation + ".name";
                const selectedInvocationName = getValueFromObjectAndPath(baseStateObject, pathToEldrichInvocationName);
                const validInvocations = invocations.filter(invocation => {
                    if (selectedInvocationName && selectedInvocationName === invocation.name) {
                        // This is the one we currently have selected. Keep it.
                        return true;
                    }

                    if (!invocation.repeatable && selectedInvocationNames.includes(invocation.name)) {
                        // This invocation is not repeatable and it's already selected somewhere else.
                        return false;
                    }

                    if (invocation.prerequisites) {
                        const meetsPrerequisites = performBooleanCalculation(baseStateObject, invocation.prerequisites, parameters);
                        return meetsPrerequisites;
                    }
                    return true;
                });
                const validInvocationNames = validInvocations.map(invocation => invocation.name);

                featureContent.push(<>
                    <div className="featureSelectList">
                        <SelectList options={validInvocationNames} isNumberValue={false} baseStateObject={baseStateObject} pathToProperty={pathToEldrichInvocationName} inputHandler={inputHandler}></SelectList>
                    </div>
                </>);
                
                if (selectedInvocationName) {
                    featureContent.push(<>
                        <FeatDesign baseStateObject={baseStateObject} inputHandler={inputHandler} selectedFeatName={selectedInvocationName} feats={invocations} pathToFeatureProperty={pathToEldrichInvocation}></FeatDesign>
                    </>);
                }
            }
        }
    }

    if (feature.spellcasting) {
        const spellcastingFeatures = getAllSpellcastingFeatures(baseStateObject);
        const alreadyKnownSpells = getAllSpells(baseStateObject, spellcastingFeatures);
        const spellName2AlreadyKnownSpell = convertArrayToDictionary(alreadyKnownSpells, "name");

        const spellcastingAbility = performMathCalculation(baseStateObject, feature.spellcasting.ability.calculation, parameters);
        featureContent.push(<>
            <div>Spellcasting Ability</div>
            <div>{rightTriangleUnicode}{getCapitalizedAbilityScoreName(spellcastingAbility)}</div>
        </>);

        if (feature.spellcasting.cantripsKnown) {
            let cantripsKnown = performMathCalculation(baseStateObject, feature.spellcasting.cantripsKnown.calculation, parameters);
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
                let validCantrips = getCollection("cantrips");
                if (feature.spellcasting.cantripsKnown.validSpellLists && feature.spellcasting.cantripsKnown.validSpellLists.length > 0) {
                    validCantrips = validCantrips.filter(cantrip => feature.spellcasting.cantripsKnown.validSpellLists.some(validSpellList => cantrip.spellLists.includes(validSpellList)));
                }
                const validCantripNames = validCantrips.map(cantrip => cantrip.name);
                
                for (let i = 0; i < cantripsKnown; i++) {
                    let alreadySelectedCantripName = undefined;
                    if (playerFeatureObject && playerFeatureObject.cantrips && playerFeatureObject.cantrips.length > i) {
                        alreadySelectedCantripName = playerFeatureObject.cantrips[i];
                    }
                    const filteredCantripNames = validCantripNames.filter(cantripName => (alreadySelectedCantripName === cantripName) || !spellName2AlreadyKnownSpell[cantripName]);
                    featureContent.push(<>
                        <SelectList options={filteredCantripNames} isNumberValue={false} baseStateObject={baseStateObject} pathToProperty={pathToFeatureProperty + ".cantrips[" + i + "]"} inputHandler={inputHandler}></SelectList>
                    </>);
                }
            }
        }

        if (feature.spellcasting.spellsKnown) {
            let spellsKnown = performMathCalculation(baseStateObject, feature.spellcasting.spellsKnown.calculation, parameters);
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
                let validSpells = getCollection("spells");
                if (feature.spellcasting.spellsKnown.validSpellLists && feature.spellcasting.spellsKnown.validSpellLists.length > 0) {
                    validSpells = validSpells.filter(spell => feature.spellcasting.spellsKnown.validSpellLists.some(validSpellList => spell.spellLists.includes(validSpellList)));
                }
                if (feature.spellcasting.spellsKnown.levelLimit) {
                    const spellLevelLimit = performMathCalculation(baseStateObject, feature.spellcasting.spellsKnown.levelLimit);
                    if (spellLevelLimit) {
                        validSpells = validSpells.filter(spell => spell.level && spell.level <= spellLevelLimit);
                    }
                }

                const validSpellNames = validSpells.map(cantrip => cantrip.name);

                for (let i = 0; i < spellsKnown; i++) {
                    let alreadySelectedSpellName = undefined;
                    if (playerFeatureObject && playerFeatureObject.spells && playerFeatureObject.spells.length > i) {
                        alreadySelectedSpellName = playerFeatureObject.spells[i];
                    }
                    const filteredSpellNames = validSpellNames.filter(spellName => (alreadySelectedSpellName === spellName) || !spellName2AlreadyKnownSpell[spellName]);
                    featureContent.push(<>
                        <SelectList options={filteredSpellNames} isNumberValue={false} baseStateObject={baseStateObject} pathToProperty={pathToFeatureProperty + ".spells[" + i + "]"} inputHandler={inputHandler}></SelectList>
                    </>);
                }
            }
        }
    }

    if (feature.metamagic) {
        const metamagicOptions = getCollection("metamagic");
        const alreadySelectedMetamagicOptions = calculateAspectCollection(baseStateObject, "metamagic");
        const alreadySelectedMetamagicOptionsMap = convertArrayOfStringsToHashMap(alreadySelectedMetamagicOptions);

        const optionsKnown = performMathCalculation(baseStateObject, feature.metamagic.optionsKnown.calculation, parameters);

        if (feature.metamagic.sorceryPointResource) {
            const sorceryPointResource = performMathCalculation(baseStateObject, feature.metamagic.sorceryPointResource.calculation, parameters);
            const resource = findResourceFromAllResources(baseStateObject, sorceryPointResource);
            featureContent.push(<>
                <div>{rightTriangleUnicode}Sorcery Points: +{resource.maxUses}</div>
            </>);
        }

        for (let i = 0; i < optionsKnown; i++) {
            const pathToMetamagic = pathToFeatureProperty + ".metamagic[" + i + "]";
            const selectedInvocationName = getValueFromObjectAndPath(baseStateObject, pathToMetamagic);

            const filteredMetamagicOptions = metamagicOptions.filter(x => x.name === selectedInvocationName || !alreadySelectedMetamagicOptionsMap[x.name]).map(x => x.name);
            featureContent.push(<>
                <SelectList options={filteredMetamagicOptions} isNumberValue={false} baseStateObject={baseStateObject} pathToProperty={pathToFeatureProperty + ".metamagic[" + i + "]"} inputHandler={inputHandler}></SelectList>
            </>);
        }  
    }

    if (feature.choices) {
        featureContent.push(<>
            <ChoiceDesign baseStateObject={baseStateObject} choiceObject={feature} pathToPlayerConfigObjectForChoices={pathToFeatureProperty} inputHandler={inputHandler}></ChoiceDesign>
        </>);
    }

    if (feature.actions) {
        for (let action of feature.actions) {
            featureContent.push(<>
                <div>{rightTriangleUnicode}{action.name}</div>
            </>);
        }
    }

    if (feature.subclass) {
        const subclasses = getCollection("subclasses");
        const subclassesForClassNames = subclasses.filter(subclass => subclass.class === feature.subclass.class).map(subclass => subclass.name);

        featureContent.push(<>
            <div className="featureSelectList">
                <SelectList options={subclassesForClassNames} isNumberValue={false} baseStateObject={baseStateObject} pathToProperty={pathToFeatureProperty + ".name"} inputHandler={inputHandler}></SelectList>
            </div>
        </>);
    }

    return (<>
        <div className="featureHolder">{featureContent}</div>
    </>)
}