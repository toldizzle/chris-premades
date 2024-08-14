import {registerHooks} from './hooks.js';
import {setupJournal} from './extensions/journal.js';
import {registerMenus, registerSettings} from './settings.js';
import {DialogApp} from './applications/dialog.js';
import {AdditionalCompendiums} from './applications/additionalCompendiums.js';
import {Crosshairs} from './lib/crosshairs.js';
import {registerCustomTypes} from './extensions/customTypes.js';
import * as utils from './utils.js';
import * as macros from './macros.js';
import {effectInterface} from './applications/effectInterface.js';
import {macroInterface} from './applications/macroInterface.js';
import {settingButton} from './applications/settings.js';
import {effectHud} from './applications/effectHud.js';
import {conditions} from './extensions/conditions.js';
import {Summons} from './lib/summons.js';
import {registerSockets} from './lib/sockets.js';
import {workflow} from './extensions/workflow.js';
import {Teleport} from './lib/teleport.js';
import {backup} from './extensions/backup.js';
import {selectTool} from './extensions/selectTool.js';
import {abilitySave} from './extensions/abilitySave.js';
import {skillCheck} from './extensions/skillCheck.js';
import {ddbi} from './integrations/ddbi.js';
import {effectEvents} from './events/effects.js';
import {gambitPremades} from './integrations/gambitsPremades.js';
import {miscPremades} from './integrations/miscPremades.js';
import {updateCheck} from './extensions/update.js';
import {troubleshooter} from './applications/troubleshooter.js';
Hooks.once('socketlib.ready', registerSockets);
Hooks.once('init', () => {
    registerSettings();
    if (utils.genericUtils.getCPRSetting('useLocalCompendiums')) utils.constants.setUseLocalCompendium(true);
    registerMenus();
    registerCustomTypes();
    if (utils.genericUtils.getCPRSetting('effectInterface')) effectInterface.init();
    if (utils.genericUtils.getCPRSetting('macroInterface')) macroInterface.init();
    if (utils.genericUtils.getCPRSetting('temporaryEffectHud')) effectHud.patchToggleEffect(true);
    if (utils.genericUtils.getCPRSetting('selectTool') && !game.modules.get('multi-token-edit')?.active && !game.modules.get('select-tool-everywhere')?.active) selectTool.init();
    abilitySave.init();
    skillCheck.init();
    effectEvents.init();
});
Hooks.once('ready', () => {
    troubleshooter.startup();
    workflow.setup();
    registerHooks();
    ddbi.ready();
    if (game.modules.get('gambits-premades')?.active) gambitPremades.init(utils.genericUtils.getCPRSetting('gambitPremades'));
    if (game.modules.get('midi-item-showcase-community')?.active) miscPremades.init(utils.genericUtils.getCPRSetting('miscPremades'));
    if (utils.genericUtils.getCPRSetting('disableNonConditionStatusEffects')) conditions.disableNonConditionStatusEffects();
    if (utils.genericUtils.getCPRSetting('replaceStatusEffectIcons')) conditions.setStatusEffectIcons();
    if (utils.genericUtils.getCPRSetting('disableSpecialEffects')) conditions.disableSpecialEffects(true);
    if (game.user.isGM) {
        game.settings.set('chris-premades', 'gmID', game.user.id);
        setupJournal();
        if (utils.genericUtils.getCPRSetting('backups')) backup.doBackup();
        if (utils.genericUtils.getCPRSetting('checkForUpdates')) updateCheck();
    }
    if (utils.genericUtils.getCPRSetting('abilitySave')) abilitySave.patch(true);
    if (utils.genericUtils.getCPRSetting('skillCheck')) skillCheck.patch(true);
    if (game.modules.get('ddb-importer')?.active) ddbi.workaround(); //Remove this after MrPrimate updates to the new API.
});
globalThis['chrisPremades'] = {
    DialogApp,
    Crosshairs,
    AdditionalCompendiums,
    Summons,
    Teleport,
    utils,
    macros,
    settingButton
};