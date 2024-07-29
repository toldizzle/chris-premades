import {effects} from '../extensions/effects.js';
import * as macros from '../macros.js';
import {effectUtils, genericUtils, socketUtils} from '../utils.js';
import {auras} from './auras.js';
function getEffectMacroData(effect) {
    return effect.flags['chris-premades']?.macros?.effect ?? [];
}
function collectEffectMacros(effect) {
    let macroList = [];
    macroList.push(...getEffectMacroData(effect));
    if (!macroList.length) return [];
    return macroList.map(i => macros[i]).filter(j => j);
}
function collectMacros(effect, pass) {
    let macroList = collectEffectMacros(effect);
    if (!macroList.length) return [];
    let triggers = [];
    let effectMacros = macroList.filter(i => i.effect?.find(j => j.pass === pass)).flatMap(k => k.effect).filter(l => l.pass === pass);
    effectMacros.forEach(i => {
        triggers.push({
            entity: effect,
            castData: {
                castLevel: effectUtils.getCastLevel(effect) ?? -1,
                baseLevel: effectUtils.getBaseLevel(effect) ?? -1,
                saveDC: effectUtils.getSaveDC(effect) ?? -1
            },
            macro: i.macro,
            name: effect.name,
            priority: i.priority
        });
    });
    return triggers;
}
function getSortedTriggers(effect, pass) {
    let allTriggers = collectMacros(effect, pass);
    let names = new Set(allTriggers.map(i => i.name));
    let maxMap = {};
    names.forEach(i => {
        let maxLevel = Math.max(...allTriggers.map(i => i.castData.castLevel));
        let maxDC = Math.max(...allTriggers.map(i => i.castData.saveDC));
        maxMap[i] = {
            maxLevel: maxLevel,
            maxDC: maxDC
        };
    });
    let triggers = [];
    names.forEach(i => {
        let maxLevel = maxMap[i].maxLevel;
        let maxDC = maxMap[i].maxDC;
        let maxDCTrigger = allTriggers.find(j => j.castData.saveDC === maxDC);
        let selectedTrigger;
        if (maxDCTrigger.castData.castLevel === maxLevel) {
            selectedTrigger = maxDCTrigger;
        } else {
            selectedTrigger = allTriggers.find(j => j.castData.castLevel === maxLevel);
        }
        triggers.push(selectedTrigger);
    });
    return triggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger) {
    genericUtils.log('dev', 'Executing Effect Macro: ' + trigger.macro.name + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
    try {
        await trigger.macro({trigger});
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.error(error);
    }
}
async function executeMacroPass(effect, pass) {
    genericUtils.log('dev', 'Executing Effect Macro Pass: ' + pass + ' for ' + effect.name);
    let triggers = getSortedTriggers(effect, pass);
    if (triggers.length) await genericUtils.sleep(50);
    for (let i of triggers) await executeMacro(i);
}
async function createActiveEffect(effect, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if (!(effect.parent instanceof Actor)) return;
    await auras.effectCheck(effect);
    await executeMacroPass(effect, 'created');
}
async function deleteActiveEffect(effect, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if ((effect.parent instanceof Actor)) {
        await auras.effectCheck(effect);
        await executeMacroPass(effect, 'deleted');
    }
    await effects.checkInterdependentDeps(effect);
}
export let effectEvents = {
    createActiveEffect,
    deleteActiveEffect,
    collectEffectMacros,
    getEffectMacroData
};