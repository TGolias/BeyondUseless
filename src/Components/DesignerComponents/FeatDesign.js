import React from "react";
import './FeatDesign.css'
import { ChoiceDesign } from "./ChoiceDesign";
import { FeatureDesign } from "./FeatureDesign";
import { getValueFromObjectAndPath } from "../../SharedFunctions/ComponentFunctions";

export function FeatDesign({baseStateObject, inputHandler, selectedFeatName, feats, pathToFeatureProperty, parameters = {}}) {
    const featContent = [];

    const selectedFeat = feats.find(x => x.name === selectedFeatName);
    if (selectedFeat) {
        if (selectedFeat.choices) {
            featContent.push(<>
                <ChoiceDesign baseStateObject={baseStateObject} choiceObject={selectedFeat} pathToPlayerConfigObjectForChoices={pathToFeatureProperty} inputHandler={inputHandler}></ChoiceDesign>
            </>);
        }

        if (selectedFeat?.aspects?.features && selectedFeat.aspects.features.length > 0) {
            for (let i = 0; i < selectedFeat.aspects.features.length; i++) {
                const featFeature = selectedFeat.aspects.features[i];
                const featFeatureName = featFeature.name.replace(/\s/g, "");
                const pathToFeatFeature = pathToFeatureProperty + ".features." + featFeatureName;
                const playerFeatFeatureObject = getValueFromObjectAndPath(baseStateObject, pathToFeatFeature);
                featContent.push(<>
                    <FeatureDesign baseStateObject={baseStateObject} feature={featFeature} playerFeatureObject={playerFeatFeatureObject} pathToFeatureProperty={pathToFeatFeature} inputHandler={inputHandler} parameters={parameters}></FeatureDesign>
                </>);
            }
        }
    }

    return featContent;
}