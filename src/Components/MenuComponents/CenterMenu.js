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
            return newHealthMenuConfig;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, inputChangeHandler, menuConfig, menuStateChangeHandler) => {
            return (<><HealthMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler} inputChangeHandler={inputChangeHandler}></HealthMenu></>)
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
            newHitDiceMenuConfig.soundOnHitDiceExpend = data.soundOnHitDiceExpend;
            newHitDiceMenuConfig.soundOnNoHitDiceExpend = data.soundOnNoHitDiceExpend;
            newHitDiceMenuConfig.remainingHitDice = playerConfigs.currentStatus.remainingHitDice ?? {};
            newHitDiceMenuConfig.healAmount = 0;
            return newHitDiceMenuConfig;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, inputChangeHandler, menuConfig, menuStateChangeHandler) => {
            return (<><HitDiceMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler} inputChangeHandler={inputChangeHandler}></HitDiceMenu></>)
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
        createMenuLayout: (playerConfigs, setCenterScreenMenu, inputChangeHandler, menuConfig, menuStateChangeHandler) => {
            return (<><ConfirmationMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler} inputChangeHandler={inputChangeHandler}></ConfirmationMenu></>)
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
            newSpellMenu.useFreeUse = false;
            newSpellMenu.useRitual = false;
            newSpellMenu.hpIsChanging = false;
            newSpellMenu.healAmount = 0;
            newSpellMenu.copyLinkToSpell = {};
            return newSpellMenu;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, inputChangeHandler, menuConfig, menuStateChangeHandler) => {
            return (<><SpellMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler} inputChangeHandler={inputChangeHandler}></SpellMenu></>)
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
        createMenuLayout: (playerConfigs, setCenterScreenMenu, inputChangeHandler, menuConfig, menuStateChangeHandler) => {
            return (<><ItemMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler} inputChangeHandler={inputChangeHandler}></ItemMenu></>)
        }
    }
}

const defaultMenuConfig = {
    type: undefined,
    opened: false
}

export function CenterMenu({playerConfigs, menuType, data, setCenterScreenMenu, inputChangeHandler}) {
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
                    // They're closing out of the menu. Reset menu configs as well for next time.
                    const resetMenuConfig = {...defaultMenuConfig};
                    setMenuConfig(resetMenuConfig);
                }
                setCenterScreenMenu(centerScreenConfigs);
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
            }
        ));
    }

    return (<>
        <div className="centerMenuOuterDiv">
            <div className="menuTitleBar">
                {title}
                <RetroButton text={"X"} onClickHandler={() => {
                    const resetMenuConfig = {...defaultMenuConfig};
                    setMenuConfig(resetMenuConfig);
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }} showTriangle={false} disabled={false}></RetroButton>
            </div>
            <div className="centerMenuSeperator"></div>
            {menuLayout}
        </div>
    </>);
}