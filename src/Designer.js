import { SelectList } from './Components/SelectList';
import { TextInput } from './Components/TextInput';
import { ArrayInput } from './Components/ArrayInput';
import './Designer.css';
import React from 'react';
import { CanMulticlass, GetValidClassLevelsArray, GetValidClassesArray, GetValidMulticlassDefault } from './SharedFunctions/MulticlassFunctions';

export function Designer({playerConfigs, inputChangeHandler}) {

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

    return (
        <>
            <div className="fieldHolder">
                <h2>Character Editor</h2>
                <div>
                    <div className="label">Name</div>
                    <TextInput isNumberValue={false} baseStateObject={playerConfigs} pathToProperty={"name"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div className="label">Level</div>
                    <SelectList options={Array.from({length: 20}, (_, i) => i + 1)} isNumberValue={true} baseStateObject={playerConfigs} pathToProperty={"level"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div className="label">Class</div>
                    <ArrayInput baseStateObject={playerConfigs} pathToProperty={"classes"} config={classSelectionConfig} inputHandler={inputChangeHandler} allowAdd={CanMulticlass(playerConfigs)} addText="Add Multiclass" generateAddedItem={() => GetValidMulticlassDefault(playerConfigs)} allowRemove={playerConfigs.classes.length > 1} />
                </div>
                <div>
                    <div className="label">Strength</div>
                    <TextInput isNumberValue={true} baseStateObject={playerConfigs} pathToProperty={"baseStats.strength"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div className="label">Dexterity</div>
                    <TextInput isNumberValue={true} baseStateObject={playerConfigs} pathToProperty={"baseStats.dexterity"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div className="label">Constitution</div>
                    <TextInput isNumberValue={true} baseStateObject={playerConfigs} pathToProperty={"baseStats.constitution"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div className="label">Intelligence</div>
                    <TextInput isNumberValue={true} baseStateObject={playerConfigs} pathToProperty={"baseStats.intelligence"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div className="label">Wisdom</div>
                    <TextInput isNumberValue={true} baseStateObject={playerConfigs} pathToProperty={"baseStats.wisdom"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div className="label">Charisma</div>
                    <TextInput isNumberValue={true} baseStateObject={playerConfigs} pathToProperty={"baseStats.charisma"} inputHandler={inputChangeHandler}/>
                </div>
            </div>
        </>
    );
}