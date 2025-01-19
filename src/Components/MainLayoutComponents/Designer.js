import './Designer.css';
import React from 'react';
import { CanMulticlass, GetValidClassLevelsArray, GetValidClassesArray, GetValidMulticlassDefault } from '../../SharedFunctions/MulticlassFunctions';
import { ArrayInput } from '../SimpleComponents/ArrayInput';
import { TextInput } from '../SimpleComponents/TextInput';
import { SelectList } from '../SimpleComponents/SelectList';
import { getCollection } from '../../Collections';
import { BackgroundDesign } from '../DesignerComponents/BackgroundDesign';
import { PointBuyDesign } from '../DesignerComponents/PointBuyDesign';
import { SpeciesDesign } from '../DesignerComponents/SpeciesDesign';
import { calculateAspectCollection, getAllAspectOptions } from '../../SharedFunctions/TabletopMathFunctions';
import { convertArrayOfStringsToHashMap } from '../../SharedFunctions/Utils';
import { ClassDesign } from '../DesignerComponents/ClassDesign';

export function Designer({playerConfigs, inputChangeHandler}) {

    const species = getCollection("species");
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

    const languagesSelectionConfig = [
        {
            pathToProperty: "$VALUE",
            componentType: "SelectList",
            options: (baseStateObject, i) => {
                if (i === 0) {
                    return ["Common"];
                }
                let allLanguages = getAllAspectOptions("languages");
                const alreadySelectedLanguages = calculateAspectCollection(baseStateObject, "languages");
                const alreadySelectedLanguagesHashMap = convertArrayOfStringsToHashMap(alreadySelectedLanguages);

                const languageOptions = [];
                for (const language of allLanguages) {
                    // Only include a language if it's not already selected OR if it's selected in this exact slot.
                    if (!alreadySelectedLanguagesHashMap[language] || baseStateObject.languages[i] === language) {
                        languageOptions.push(language);
                    }
                }
                return languageOptions;
            },
            isNumber: false
        }
    ];

    var classDesigns = [];
    for (let i = 0; i < playerConfigs.classes.length; i++) {
        classDesigns.push(<>
            <div>
                <div className="label">{playerConfigs.classes[i].name}</div>
                <br></br>
                <ClassDesign baseStateObject={playerConfigs} inputHandler={inputChangeHandler} classIndex={i}></ClassDesign>
            </div>
        </>);
    }

    const rightTriangleUnicode = '\u25B6';
    var items = [];
    for (let item of playerConfigs.items) {
        items.push(<div>{rightTriangleUnicode + item.name}</div>);
    }

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
                    <div className="label">Level</div>
                    <SelectList options={Array.from({length: 20}, (_, i) => i + 1)} isNumberValue={true} baseStateObject={playerConfigs} pathToProperty={"level"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div className='label'>Base Ability Scores</div>
                    <br></br>
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
                    <div className="label">Species</div>
                    <SelectList options={species.map(x => x.name)} isNumberValue={false} baseStateObject={playerConfigs} pathToProperty={"species.name"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <SpeciesDesign baseStateObject={playerConfigs} inputHandler={inputChangeHandler}></SpeciesDesign>
                </div>
                <div>
                    <div className="label">Languages</div>
                    <ArrayInput baseStateObject={playerConfigs} pathToProperty={"languages"} config={languagesSelectionConfig} inputHandler={inputChangeHandler} allowAdd={false} allowRemove={false} />
                </div>
                <div>
                    <div className="label">Class</div>
                    <ArrayInput baseStateObject={playerConfigs} pathToProperty={"classes"} config={classSelectionConfig} inputHandler={inputChangeHandler} allowAdd={CanMulticlass(playerConfigs)} addText="Add Multiclass" generateAddedItem={() => GetValidMulticlassDefault(playerConfigs)} allowRemove={playerConfigs.classes.length > 1} />
                </div>
                {classDesigns}
                <div>
                    <div className="label">Items</div>
                    {items}
                </div>
                <br/>
            </div>
        </>
    );
}