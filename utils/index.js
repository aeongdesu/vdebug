import DumpModules from "./dump.js"
import colors from "ansi-colors"
import { isPrompting } from "../index.js"
const { cyan, red, yellow, bold: { blue } } = colors

// Utility functions for more visually pleasing logs
// Get out of user input area first if prompt is currently being shown
const colorize = (data, source, color) => color(`[${source}] `) + data
const safeLog = (data) => console.log((isPrompting ? "\n" : "") + data)

const discordColorize = (data) => {
    let { message, level } = JSON.parse(data)
    // Normal logs don't need extra colorization
    switch (level) {
        case 0: // Info
            message = cyan(message)
            break
        case 2: // Warning
            message = yellow(message)
            break
        case 3: // Error
            message = red(message)
            break
    }
    return colorize(message, "Discord", blue)
}
const discordLog = (data) => safeLog(discordColorize(data))

const debuggerColorize = (data) => colorize(data, "Debugger", blue)
const debuggerLog = (data) => safeLog(debuggerColorize(data))
const debuggerError = (err, isReturning) => {
    safeLog(colorize(red("Error"), "Debugger", red.bold))
    if (isReturning) {
        return err
    }
    console.error(err)
}

export default {
    DumpModules,
    discordColorize,
    discordLog,
    debuggerLog,
    debuggerError
}