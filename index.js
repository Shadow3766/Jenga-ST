import { handleCommand } from './jenga.js';
import { executeSlashCommandsWithOptions } from '../../../slash-commands.js';
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument } from '../../../slash-commands/SlashCommandArgument.js';
import { SlashCommandEnumValue } from '../../../slash-commands/SlashCommandEnumValue.js';
import { eventSource, event_types } from '../../../../script.js';

const BANG_COMMANDS = {
    START: '!startjenga',
    PULL: '!pullblock',
    PLACE: '!placeblock',
    RESET: '!resetjenga',
};

function registerSlashCommand() {
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'jenga',
        unnamedArgumentList: [SlashCommandArgument.fromProps({
            description: 'help topic',
            typeList: [ARGUMENT_TYPE.STRING],
            enumList: [
                new SlashCommandEnumValue('start', 'Start a game'),
                new SlashCommandEnumValue('pull', 'Pull a block'),
                new SlashCommandEnumValue('place', 'Place a block'),
                new SlashCommandEnumValue('reset', 'Reset game'),
            ],
        })],
        callback: async (arg1, type) => {
            const bangCmd = BANG_COMMANDS[type.toUpperCase()];
            if (!bangCmd) {
                console.error(`[Jenga] Invalid command type: ${type}`);
                return;
            }
            await sendResponse(bangCmd);
        },
        helpString: 'Play Jenga',
    }));
}

async function sendResponse(bangCmd, name = undefined) {
    let response = await handleCommand(bangCmd);
    if (name) {
        response = response.replace(/^You /, `${name} `);
    }

    const messageOptions = {
        source: 'jenga',
        isSystemMessage: true, // Mark as system-generated
    };

    await executeSlashCommandsWithOptions(`/sys compact=true ${response}`, messageOptions);
}

async function handleMessage(mesId, eventType) {
    const context = SillyTavern.getContext();
    const message = context.chat[mesId];
    
    // Log the message object for debugging
    console.log(`[Jenga] Message Received:`, message);

    if (!message || message.isSystemMessage) {
        console.log(`[Jenga] Skipping system message: ${message ? message.mes : 'unknown'}`);
        return;
    }

    const bangCmd = Object.values(BANG_COMMANDS).find(cmd => message.mes.trim().startsWith(cmd));
    if (!bangCmd) return;

    console.log(`[Jenga] Handling user command: ${bangCmd}`);
    await sendResponse(bangCmd, message.name);
}


export const JengaExtension = {
    setup() {
        console.log('[Jenga] Doing setup');
        registerSlashCommand();

        eventSource.on(event_types.USER_MESSAGE_RENDERED, async (mesId) => handleMessage(mesId, event_types.USER_MESSAGE_RENDERED));
        eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, async (mesId) => handleMessage(mesId, event_types.CHARACTER_MESSAGE_RENDERED));
    }
};

jQuery(async () => {
    console.log('[Jenga] loaded');
    JengaExtension.setup();
});
