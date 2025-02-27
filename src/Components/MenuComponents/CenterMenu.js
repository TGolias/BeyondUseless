import React, { useState } from "react";
import './CenterMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { HealthMenu } from "./HealthMenu";
import { getTotalPath } from "../../SharedFunctions/ComponentFunctions";
import { calculateHPMax } from "../../SharedFunctions/TabletopMathFunctions";
import { ConfirmationMenu } from "./ConfirmationMenu";
import { HitDiceMenu } from "./HitDiceMenu";
import { SpellMenu } from "./SpellMenu";
import { ItemMenu } from "./ItemMenu";
import { PropertyMenu } from "./PropertyMenu";
import { MasteryMenu } from "./MasteryMenu";
import { ActionMenu } from "./ActionMenu";
import { FeatureActionMenu } from "./FeatureActionMenu";
import { ConditionMenu } from "./ConditionMenu";
import { SelectListMenu } from "./SelectListMenu";
import { SaveMenu } from "./SaveMenu";
import { LoadMenu } from "./LoadMenu";
import { UnarmedStrikeMenu } from "./UnarmedStrikeMenu";
import { ManageHeldEquipmentMenu } from "./ManageHeldEquipmentMenu";
import { ArmorMenu } from "./ArmorMenu";
import { AspectMenu } from "./AspectMenu";
import { ViewMenu } from "./ViewMenu";

const menuCollection = {
    HealthMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            const playerFirstName = playerConfigs.name.split(' ')[0];
            const titleName = "Manage " + playerFirstName + "'s HP";
            return (<>
                <div className="menuTitleBarTitle">{titleName}</div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newHealthMenuConfig = {};
            newHealthMenuConfig.newTempHp = playerConfigs.currentStatus.tempHp ?? 0;
            newHealthMenuConfig.newMaxHpModifier = playerConfigs.currentStatus.maxHpModifier ?? 0; 
            newHealthMenuConfig.newRemainingHp = playerConfigs.currentStatus.remainingHp ?? calculateHPMax(playerConfigs); 
            newHealthMenuConfig.changeHpAmount = 0;
            newHealthMenuConfig.newConditions = playerConfigs.currentStatus.conditions ?? [];
            return newHealthMenuConfig;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><HealthMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} addToMenuStack={addToMenuStack} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler} inputChangeHandler={inputChangeHandler} showDeathScreen={showDeathScreen}></HealthMenu></>);
        }
    },
    HitDiceMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            return (<>
                <div className="menuTitleBarTitle">{data.menuTitle}</div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newHitDiceMenuConfig = {};
            newHitDiceMenuConfig.menuText = data.menuText;
            newHitDiceMenuConfig.onBeforeConfirm = data.onBeforeConfirm;
            newHitDiceMenuConfig.soundOnHitDiceExpend = data.soundOnHitDiceExpend;
            newHitDiceMenuConfig.soundOnNoHitDiceExpend = data.soundOnNoHitDiceExpend;
            newHitDiceMenuConfig.remainingHitDice = playerConfigs.currentStatus.remainingHitDice ?? {};
            newHitDiceMenuConfig.healAmount = 0;
            return newHitDiceMenuConfig;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><HitDiceMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler} inputChangeHandler={inputChangeHandler}></HitDiceMenu></>);
        }
    },
    ConfirmationMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            return (<>
                <div className="menuTitleBarTitle">{data.menuTitle}</div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newConfirmationMenuConfig = {};
            newConfirmationMenuConfig.menuText = data.menuText;
            newConfirmationMenuConfig.buttons = data.buttons;
            return newConfirmationMenuConfig;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><ConfirmationMenu menuConfig={menuConfig}></ConfirmationMenu></>);
        }
    },
    SpellMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            return (<>
                <div className="menuTitleBarTitle">
                    <RetroButton text={data.menuTitle} onClickHandler={() => {
                        if (menuConfig.copyLinkToSpell && menuConfig.copyLinkToSpell.onExecute) {
                            menuConfig.copyLinkToSpell.onExecute();
                        }
                    }} showTriangle={false} disabled={false}></RetroButton>
                </div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newSpellMenu = {};
            newSpellMenu.spell = data.spell;
            newSpellMenu.useSpellSlotLevel = data.spell.level;
            newSpellMenu.userInput = {};
            newSpellMenu.useFreeUse = false;
            newSpellMenu.useRitual = false;
            newSpellMenu.hpIsChanging = false;
            newSpellMenu.healAmount = 0;
            newSpellMenu.copyLinkToSpell = {};
            return newSpellMenu;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><SpellMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler} inputChangeHandler={inputChangeHandler}></SpellMenu></>);
        }
    },
    ItemMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            return (<>
                <div className="menuTitleBarTitle">
                    <RetroButton text={data.menuTitle} onClickHandler={() => {
                        if (menuConfig.copyLinkToItem && menuConfig.copyLinkToItem.onExecute) {
                            menuConfig.copyLinkToItem.onExecute();
                        }
                    }} showTriangle={false} disabled={false}></RetroButton>
                </div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newItemMenu = {};
            newItemMenu.item = data.item;
            newItemMenu.copyLinkToItem = {};
            return newItemMenu;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><ItemMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} addToMenuStack={addToMenuStack} menuConfig={menuConfig}></ItemMenu></>);
        }
    },
    UnarmedStrikeMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            return (<>
                <div className="menuTitleBarTitle">
                    <RetroButton text={data.menuTitle} onClickHandler={() => {
                        if (menuConfig.copyLinkToItem && menuConfig.copyLinkToItem.onExecute) {
                            menuConfig.copyLinkToItem.onExecute();
                        }
                    }} showTriangle={false} disabled={false}></RetroButton>
                </div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newItemMenu = {};
            newItemMenu.unarmedStrike = data.unarmedStrike;
            newItemMenu.copyLinkToItem = {};
            return newItemMenu;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><UnarmedStrikeMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig}></UnarmedStrikeMenu></>);
        }
    },
    PropertyMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            return (<>
                <div className="menuTitleBarTitle">
                    <RetroButton text={data.menuTitle} onClickHandler={() => {
                        if (menuConfig.copyLinkToItem && menuConfig.copyLinkToItem.onExecute) {
                            menuConfig.copyLinkToItem.onExecute();
                        }
                    }} showTriangle={false} disabled={false}></RetroButton>
                </div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newItemMenu = {};
            newItemMenu.property = data.property;
            newItemMenu.copyLinkToItem = {};
            return newItemMenu;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><PropertyMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig}></PropertyMenu></>);
        }
    },
    MasteryMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            return (<>
                <div className="menuTitleBarTitle">
                    <RetroButton text={data.menuTitle} onClickHandler={() => {
                        if (menuConfig.copyLinkToItem && menuConfig.copyLinkToItem.onExecute) {
                            menuConfig.copyLinkToItem.onExecute();
                        }
                    }} showTriangle={false} disabled={false}></RetroButton>
                </div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newItemMenu = {};
            newItemMenu.mastery = data.mastery;
            newItemMenu.copyLinkToItem = {};
            return newItemMenu;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><MasteryMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig}></MasteryMenu></>);
        }
    },
    ActionMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            return (<>
                <div className="menuTitleBarTitle">
                    <RetroButton text={data.menuTitle} onClickHandler={() => {
                        if (menuConfig.copyLinkToItem && menuConfig.copyLinkToItem.onExecute) {
                            menuConfig.copyLinkToItem.onExecute();
                        }
                    }} showTriangle={false} disabled={false}></RetroButton>
                </div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newItemMenu = {};
            newItemMenu.action = data.action;
            newItemMenu.copyLinkToItem = {};
            return newItemMenu;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><ActionMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig}></ActionMenu></>);
        }
    },
    FeatureActionMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            return (<>
                <div className="menuTitleBarTitle">
                    <RetroButton text={data.menuTitle} onClickHandler={() => {
                        if (menuConfig.copyLinkToItem && menuConfig.copyLinkToItem.onExecute) {
                            menuConfig.copyLinkToItem.onExecute();
                        }
                    }} showTriangle={false} disabled={false}></RetroButton>
                </div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newItemMenu = {};
            newItemMenu.featureAction = data.featureAction;
            newItemMenu.feature = data.feature;
            newItemMenu.origin = data.origin;
            newItemMenu.resource = data.resource;
            newItemMenu.userInput = {};
            newItemMenu.hpIsChanging = false;
            newItemMenu.healAmount = 0;
            newItemMenu.copyLinkToItem = {};
            return newItemMenu;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><FeatureActionMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler} inputChangeHandler={inputChangeHandler}></FeatureActionMenu></>);
        }
    },
    ConditionMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            return (<>
                <div className="menuTitleBarTitle">
                    <RetroButton text={data.menuTitle} onClickHandler={() => {
                        if (menuConfig.copyLinkToItem && menuConfig.copyLinkToItem.onExecute) {
                            menuConfig.copyLinkToItem.onExecute();
                        }
                    }} showTriangle={false} disabled={false}></RetroButton>
                </div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newItemMenu = {};
            newItemMenu.condition = data.condition;
            if (data.conditionConfig) {
                newItemMenu.conditionConfig = {...data.conditionConfig}
                newItemMenu.startingConditionConfig = newItemMenu.conditionConfig;
            } else {
                newItemMenu.conditionConfig = { name: data.condition.name }
                if (newItemMenu.condition.type) {
                    if (newItemMenu.condition.type.includes("damagetypes")) {
                        newItemMenu.conditionConfig.damagetypes = [];
                    }
                    if (newItemMenu.condition.type.includes("conditions")) {
                        newItemMenu.conditionConfig.conditions = [];
                    }
                    if (newItemMenu.condition.type.includes("level")) {
                        newItemMenu.conditionConfig.level = 1;
                    }
                }
            }
            newItemMenu.onOkClicked = data.onOkClicked;
            newItemMenu.onRemoveClicked = data.onRemoveClicked;
            newItemMenu.copyLinkToItem = {};
            return newItemMenu;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><ConditionMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler}></ConditionMenu></>);
        }
    },
    SelectListMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            return (<>
                <div className="menuTitleBarTitle">{data.menuTitle}</div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newItemMenu = {};
            newItemMenu.menuText = data.menuText;
            newItemMenu.onOkClicked = data.onOkClicked;
            newItemMenu.options = data.options;
            newItemMenu.valueSelected = undefined;
            return newItemMenu;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><SelectListMenu setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler}></SelectListMenu></>);
        }
    },
    SaveMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            return (<>
                <div className="menuTitleBarTitle">Save Menu</div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newHealthMenuConfig = {};
            return newHealthMenuConfig;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><SaveMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} addToMenuStack={addToMenuStack} menuConfig={menuConfig}></SaveMenu></>);
        }
    },
    LoadMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            return (<>
                <div className="menuTitleBarTitle">Load Menu</div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newHealthMenuConfig = {};
            return newHealthMenuConfig;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><LoadMenu setCenterScreenMenu={setCenterScreenMenu} addToMenuStack={addToMenuStack} menuConfig={menuConfig} loadCharacter={loadCharacter}></LoadMenu></>);
        }
    },
    ManageHeldEquipmentMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            const titleName = "Manage Held Equipment";
            return (<>
                <div className="menuTitleBarTitle">{titleName}</div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newHealthMenuConfig = {};
            newHealthMenuConfig.items = playerConfigs.items;
            return newHealthMenuConfig;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><ManageHeldEquipmentMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} addToMenuStack={addToMenuStack} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler} inputChangeHandler={inputChangeHandler}></ManageHeldEquipmentMenu></>);
        }
    },
    ArmorMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            const titleName = "Manage Armor";
            return (<>
                <div className="menuTitleBarTitle">{titleName}</div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newHealthMenuConfig = {};
            newHealthMenuConfig.items = playerConfigs.items;
            return newHealthMenuConfig;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><ArmorMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} addToMenuStack={addToMenuStack} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler} inputChangeHandler={inputChangeHandler}></ArmorMenu></>);
        }
    },
    AspectMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            return (<>
                <div className="menuTitleBarTitle">{data.menuTitle}</div>
            </>);
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newHealthMenuConfig = {};
            newHealthMenuConfig.aspectName = data.aspectName;
            newHealthMenuConfig.addendumsToShow = data.addendumsToShow;
            newHealthMenuConfig.leadingPlus = data.leadingPlus;
            return newHealthMenuConfig;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><AspectMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig}></AspectMenu></>);
        }
    },
    ViewMenu: {
        createMenuTitle: (playerConfigs, data, menuConfig) => {
            return (<>
                <div className="menuTitleBarTitle">
                    <RetroButton text={data.menuTitle} onClickHandler={() => {
                        if (menuConfig.copyLinkToView && menuConfig.copyLinkToView.onExecute) {
                            menuConfig.copyLinkToView.onExecute();
                        }
                    }} showTriangle={false} disabled={false}></RetroButton>
                </div>
            </>)
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newItemMenu = {...data};
            newItemMenu.copyLinkToView = {};
            return newItemMenu;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, addToMenuStack, inputChangeHandler, menuConfig, menuStateChangeHandler, showDeathScreen, loadCharacter) => {
            return (<><ViewMenu setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig}></ViewMenu></>);
        }
    },
}

const defaultMenuConfig = {
    type: undefined,
    opened: false
}

let menuStack = [];

export function CenterMenu({playerConfigs, menuType, data, setCenterScreenMenu, inputChangeHandler, showDeathScreen, loadCharacter}) {
    const [menuConfig, setMenuConfig] = useState(defaultMenuConfig);

    const menu = menuCollection[menuType];
    let title = [];
    const menuLayout = [];

    if (menu) {
        let newMenuConfig = menuConfig;
        if (!newMenuConfig.opened || newMenuConfig.type !== menuType) {
            newMenuConfig = menu.createDefaultMenuConfig(playerConfigs, data);
            newMenuConfig.type = menuType;
            newMenuConfig.opened = true;
            setMenuConfig(newMenuConfig);
        }

        title = menu.createMenuTitle(playerConfigs, data, newMenuConfig);

        menuLayout.push(menu.createMenuLayout(playerConfigs, 
            (centerScreenConfigs) => {
                if (!centerScreenConfigs.show) {
                    if (menuStack.length > 0) {
                        // Hold on... There was a previous menu that we want to show instead.
                        const previousMenu = menuStack.pop();
                        setMenuConfig(previousMenu.menuConfig);
                        setCenterScreenMenu({ show: true, menuType: previousMenu.menuType, data: { menuTitle: previousMenu.menuTitle } })
                    } else {
                        // They're closing out of the menu. Reset menu configs as well for next time.
                        const resetMenuConfig = {...defaultMenuConfig};
                        setMenuConfig(resetMenuConfig);
                        setCenterScreenMenu(centerScreenConfigs);
                    }
                } else {
                    setCenterScreenMenu(centerScreenConfigs);
                }
                
            },
            (previousMenu) => {
                menuStack.push(previousMenu);
            },
            inputChangeHandler, 
            newMenuConfig, 
            (baseStateObject, pathToProperty, newValue) => {
                const totalPath = getTotalPath(pathToProperty);
                
                // We are traversing the path, but also making shallow copies all the way down for the new version of the state as we go.
                let newBaseStateObject = Object.assign({}, baseStateObject);
                let newPropertyObject = newBaseStateObject;
            
                // We do - 1 to the length because we don't want to end up with the actual property at the end, just right before.
                for (let i = 0; i < totalPath.length - 1; i++) {
                    let pathSegment = totalPath[i];
                    const nextPropertyObject = newPropertyObject[pathSegment];
            
                    let newNextPropertyObject
                    // Sometimes some slippery arrays make their way in here... those get cloned differently.
                    if (Array.isArray(nextPropertyObject)) {
                    newNextPropertyObject = [...nextPropertyObject]
                    } else {
                    newNextPropertyObject = Object.assign({}, nextPropertyObject);
                    }
                    
                    newPropertyObject[pathSegment] = newNextPropertyObject;
                    newPropertyObject = newNextPropertyObject
                }
            
                // Now we have the property object right at the end of the path and have done our shallow clones all the way to it.
                if (totalPath.length === 0) {
                    newPropertyObject = newValue;
                } else {
                    newPropertyObject[totalPath[totalPath.length - 1]] = newValue;
                }
                setMenuConfig(newBaseStateObject);
                return newBaseStateObject;
            },
            showDeathScreen,
            loadCharacter
        ));
    }

    return (<>
        <div className="centerMenuOuterDiv">
            <div className="menuTitleBar">
                {title}
                <RetroButton text={"X"} onClickHandler={() => {
                    const resetMenuConfig = {...defaultMenuConfig};
                    menuStack = [];
                    setMenuConfig(resetMenuConfig);
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }} showTriangle={false} disabled={false}></RetroButton>
            </div>
            <div className="centerMenuSeperator"></div>
            {menuLayout}
        </div>
    </>);
}