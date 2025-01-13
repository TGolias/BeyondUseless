import './Designer.css';
import React from 'react';
import { CanMulticlass, GetValidClassLevelsArray, GetValidClassesArray, GetValidMulticlassDefault } from '../../SharedFunctions/MulticlassFunctions';
import { RaceDesign } from '../DesignerComponents/RaceDesign';
import { ArrayInput } from '../SimpleComponents/ArrayInput';
import { TextInput } from '../SimpleComponents/TextInput';
import { SelectList } from '../SimpleComponents/SelectList';
import { getCollection } from '../../Collections';
import { BackgroundDesign } from '../DesignerComponents/BackgroundDesign';
import { PointBuyDesign } from '../DesignerComponents/PointBuyDesign';

export function Designer({playerConfigs, inputChangeHandler}) {

    const races = getCollection("races");
    const backgrounds = getCollection("backgrounds");
    
    const classSelectionConfig = [
        {
            pathToProperty: "name",
            componentType: "SelectList",
            options: (baseStateObject, i) => {
                const className = baseStateObject.classes[i].name;
                return GetValidClassesArray(baseStateObject, className);
            },
            isNumber: false
        },
        {
            pathToProperty: "levels",
            componentType: "SelectList",
            options: (baseStateObject, i) => {
                const className = baseStateObject.classes[i].name;
                return GetValidClassLevelsArray(baseStateObject, className);
            },
            isNumber: true
        }
    ]

    // NEXT TIME: Make point buy work with + and - buttons
    return (
        <>
            <div className="fieldHolder">
                <div className="title">Character Editor</div>
                <div>
                    <div className="label">Name</div>
                    <TextInput isNumberValue={false} baseStateObject={playerConfigs} pathToProperty={"name"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <PointBuyDesign baseStateObject={playerConfigs} inputHandler={inputChangeHandler}></PointBuyDesign>
                </div>
                <div>
                    <div className="label">Background</div>
                    <SelectList options={backgrounds.map(x => x.name)} isNumberValue={false} baseStateObject={playerConfigs} pathToProperty={"background.name"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <BackgroundDesign baseStateObject={playerConfigs} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div className="label">Race</div>
                    <SelectList options={races.map(x => x.name)} isNumberValue={false} baseStateObject={playerConfigs} pathToProperty={"race.name"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <RaceDesign baseStateObject={playerConfigs} inputHandler={inputChangeHandler}></RaceDesign>
                </div>
                <div>
                    <div className="label">Languages</div>
                </div>
                <div>
                    <div className="label">Level</div>
                    <SelectList options={Array.from({length: 20}, (_, i) => i + 1)} isNumberValue={true} baseStateObject={playerConfigs} pathToProperty={"level"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div className="label">Class</div>
                    <ArrayInput baseStateObject={playerConfigs} pathToProperty={"classes"} config={classSelectionConfig} inputHandler={inputChangeHandler} allowAdd={CanMulticlass(playerConfigs)} addText="Add Multiclass" generateAddedItem={() => GetValidMulticlassDefault(playerConfigs)} allowRemove={playerConfigs.classes.length > 1} />
                </div>
            </div>
        </>
    );
}