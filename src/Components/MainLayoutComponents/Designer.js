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
import { RetroButton } from '../SimpleComponents/RetroButton';
import { HomebrewDesign } from '../DesignerComponents/HomebrewDesign';

export function Designer({playerConfigs, inputChangeHandler, setCenterScreenMenu}) {

    const species = getCollection("species");
    const backgrounds = getCollection("backgrounds");
    
    const languageSelectionConfig = [
        {
            displayName: "Languages",
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

    const classSelectionConfig = [
        {
            displayName: "Class",
            pathToProperty: "name",
            componentType: "SelectList",
            options: (baseStateObject, i) => {
                const className = baseStateObject.classes[i].name;
                return GetValidClassesArray(baseStateObject, className);
            },
            isNumber: false
        },
        {
            displayName: "Class Level",
            pathToProperty: "levels",
            componentType: "SelectList",
            options: (baseStateObject, i) => {
                const className = baseStateObject.classes[i].name;
                return GetValidClassLevelsArray(baseStateObject, className);
            },
            buttonSound: "levelupaudio",
            isNumber: true
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

    var homebrewDesigns = []
    if (playerConfigs.homebrew) {
        for (let i = 0; i < playerConfigs.homebrew.length; i++) {
            homebrewDesigns.push(<>
                <div className='designerSingleHomebrewSection'>
                    <div className="label">{playerConfigs.homebrew[i].name}</div>
                    <HomebrewDesign baseStateObject={playerConfigs} inputHandler={inputChangeHandler} homebrewIndex={i}></HomebrewDesign>
                    <RetroButton text={"Remove " + playerConfigs.homebrew[i].name + " Homebrew"} onClickHandler={() => {
                        const newPlayerHomeBrew = [...playerConfigs.homebrew];
                        newPlayerHomeBrew.splice(i, 1);
                        inputChangeHandler(playerConfigs, "homebrew", newPlayerHomeBrew);    
                    }} showTriangle={true} disabled={false}></RetroButton>
                </div>
            </>);
        }
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
                    <SelectList options={Array.from({length: 20}, (_, i) => i + 1)} isNumberValue={true} baseStateObject={playerConfigs} pathToProperty={"level"} inputHandler={inputChangeHandler} buttonSound={"levelupaudio"}/>
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
                    <ArrayInput baseStateObject={playerConfigs} pathToProperty={"languages"} config={languageSelectionConfig} inputHandler={inputChangeHandler} allowAdd={false} allowRemove={false} />
                </div>
                <div>
                    <ArrayInput baseStateObject={playerConfigs} pathToProperty={"classes"} config={classSelectionConfig} inputHandler={inputChangeHandler} allowAdd={CanMulticlass(playerConfigs)} addText={playerConfigs.classes.length > 0 ? "Add Multiclass" : "Add Class"} generateAddedItem={() => GetValidMulticlassDefault(playerConfigs)} allowRemove={playerConfigs.classes.length > 1} />
                </div>
                {classDesigns}
                <div>
                    <div className="label">Homebrew</div>
                    <RetroButton text={"Add Homebrew"} onClickHandler={() => {
                        const homebrew = getCollection("homebrew");
                        const filteredHomebrew = homebrew.filter(x => !playerConfigs.homebrew || !playerConfigs.homebrew.some(y => y.name === x.name));
                        const homebrewNames = filteredHomebrew.map(x => x.name);
                        setCenterScreenMenu({ show: true, menuType: "SelectListMenu", data: { menuTitle: "Add Homebrew", menuText: "Select the homebrew to add:", options: homebrewNames, 
                            onOkClicked: (result) => {
                                const newPlayerHomeBrew = playerConfigs.homebrew ? [...playerConfigs.homebrew] : [];
                                newPlayerHomeBrew.push({ name: result });
                                inputChangeHandler(playerConfigs, "homebrew", newPlayerHomeBrew);
                            }
                        }});
                    }} showTriangle={true} disabled={false}></RetroButton>
                </div>
                {homebrewDesigns}
            </div>
        </>
    );
}