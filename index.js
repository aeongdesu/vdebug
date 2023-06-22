import { spawn } from "child_process"
import repl from "repl"
import { WebSocketServer } from "ws"
export let isPrompting = false

import Utils from "./utils/index.js"

// stole from aliucord/debug-ws-server
spawn("adb", ["reverse", "tcp:9090", "tcp:9090"], { stdio: "ignore" }).on("exit", (code) => {
  if (code !== 0) Utils.debuggerLog(`Port forwarding port 9090 with adb exited with code ${code}, vendetta may not load`)
  else Utils.debuggerLog("Successfully forwarded port 9090 to phone with adb")
})

if (process.argv.includes("--dump")) Utils.DumpModules()
else {
  // Display welcome message and basic instructions
  console.log("\"vdebug is a virus\" - sapphire")
  console.log("Press Ctrl+C to exit.")
  console.log("You can use `pnpm run dump` to dump modules.")

  // Create websocket server and REPL, and wait for connection
  const wss = new WebSocketServer({ port: 9090 })
  wss.on("connection", (ws) => {
    Utils.debuggerLog("Connected to Discord over websocket, starting debug session")

    isPrompting = false // REPL hasn't been created yet
    let finishCallback

    // Handle logs returned from Discord client via the websocket
    ws.on("message", (data) => {
      try {
        if (finishCallback) {
          finishCallback(null, data)
          finishCallback = undefined
        } else {
          Utils.discordLog(data)
        }
      } catch (e) {
        Utils.debuggerError(e, false)
      }
      isPrompting = true
      rl.displayPrompt()
    })

    // Create the REPL
    const rl = repl.start({
      eval: (input, ctx, filename, cb) => {
        try {
          if (!input.trim()) {
            cb()
          } else {
            isPrompting = false
            ws.send(`const res=(0,eval)(${JSON.stringify(input)});console.log(vendetta.metro.findByProps("inspect").inspect(res,{showHidden:true}));res`)
            finishCallback = cb
          }
        } catch (e) {
          cb(e)
        }
      },
      writer: (data) => {
        return (data instanceof Error) ? Utils.debuggerError(data, true) : Utils.discordColorize(data)
      }
    })

    isPrompting = true // Now the REPL exists and is prompting the user for input

    rl.on("close", () => {
      Utils.debuggerLog("Closing debugger, press Ctrl+C to exit")
    })

    ws.on("close", () => {
      Utils.debuggerLog("Websocket has been closed")
      isPrompting = false
      rl.close()
    })
  })

  Utils.debuggerLog("Ready to connect")
}