// https://gist.github.com/redstonekasi/2447f7657d8f2bb253eed4c482073e37
import * as path from "path"
import * as fs from "fs"
import * as url from "url"
import { WebSocketServer } from "ws"

const __dirname = url.fileURLToPath(new URL(".", import.meta.url))

export default async () => {
    const dumper = () => {
        const modules = window["modules"]

        function parseValue(value) {
            if (typeof value === "function") {
                return value.name ? `[Function: ${value.name}]` : "[Function]"
            } else if (Array.isArray(value)) {
                return value.map(parseValue)
            } else if (typeof value === "object") {
                const output = {}

                for (const key in value) {
                    output[key] = parseValue(value[key])
                }

                return output
            }

            return value
        }

        for (const m of Object.keys(modules)) {
            try {
                const module = modules[m]
                const dumpedModule = { id: m }

                if (!module.publicModule?.exports) continue

                const exports = module.publicModule.exports

                for (const key of Object.keys(module.publicModule.exports)) {
                    dumpedModule[key] = parseValue(exports[key])
                }

                if (Object.keys(dumpedModule).length === 1) continue
                console.log(JSON.stringify(dumpedModule, null, 0))
            } catch (err) {
                console.log(`vd:couldn't dump module ${m}`)
                console.log(err)
            }
        }

        console.log("vd:done!")
    }

    const folder = path.join(__dirname, "../dumped") // funniest trick?
    fs.mkdirSync(folder, { recursive: true })

    const wss = new WebSocketServer({ port: 9090 })
    wss.on("connection", (ws) => {
        console.log("connected to discord, starting to dump...")

        ws.on("message", (data) => {
            try {
                const parsed = JSON.parse(data)
                if (parsed?.message) {
                    try {
                        const data = JSON.parse(parsed.message)
                        if (!data?.id) return
                        fs.writeFileSync(path.join(folder, `${data.id}.json`), JSON.stringify(data, null, 2))
                    } catch {
                        if (!parsed.message.startsWith?.("vd:")) return
                        parsed.message = parsed.message.slice(3)
                        console.log(parsed.message)
                        if (parsed.message === "done!")
                            ws.close()
                    }
                }
            } catch { }
        })

        ws.on("close", () => {
            console.log("dumping finished")
            console.log("do not share dumped files with others!")
            process.exit(0)
        })

        ws.send(`(${dumper.toString()})()`)
    })

    console.log("ready to dump")
}