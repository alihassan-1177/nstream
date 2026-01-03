import { readdir, writeFile, readFile } from "fs/promises"
import express from "express"

const INDEX_PATH = "/home/ali/Downloads"

main()

async function main() {
    const command = process.argv[2]

    switch (command) {
        case "index":
            await indexFiles()
            console.log("COMMAND COMPLETED => ", command)
            break;
        case "serve":
            await startServer()
            console.log("COMMAND COMPLETED => ", command)
            break;
        default:
            console.log("UNKNOWN COMMAND => ", command)
            break;
    }

}

async function startServer() {
    const app = express()
    const port = 3000

    app.use(express.static('public'))
    app.use(express.json())

    let data = await loadData()

    const initialData = {}

    for (let key of Object.keys(data)) {
        initialData[key] = {
            type: data[key].type,
            path: data[key].path,
            name: data[key].name,
        }
    }

    app.post('/api/data', (req, res) => {
        const keys = req.body.keys
        if (keys && keys.length > 0) {
            let _data = {}
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (_data[key] && _data[key]["children"]) {
                    _data = _data[key]["children"]
                } else {
                    _data = data[key]["children"]
                }
            }

            let responseData = {}
            for (let key of Object.keys(_data)) {
                responseData[key] = {
                    type: _data[key].type,
                    name: _data[key].name,
                    path: _data[key].path,
                }
            }

            res.send(responseData)
        } else {
            res.send(initialData)
        }
    })

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    })
}

async function indexFiles() {
    const files = {}
    await findFilesInDirectory(INDEX_PATH, files)
    await writeFile("data.json", JSON.stringify(files))
    console.log("FOUND FILES => ", files)
}

async function findFilesInDirectory(directoryPath, foundFiles) {
    const files = await readdir(directoryPath)
    for (const file of files) {
        console.log("PROCESSING FILE => ", file)
        const filePath = `${directoryPath}/${file}`
        const key = filePath.replace(/[^a-z0-9]/gi, "").toUpperCase();
        try {
            foundFiles[key] = {
                type: "FOLDER",
                path: filePath,
                name: file
            }

            foundFiles[key]["children"] = {}
            await findFilesInDirectory(filePath, foundFiles[key]["children"])
        } catch (error) {
            if (error.code == "ENOTDIR") {
                foundFiles[key] = {
                    type: "FILE",
                    path: filePath,
                    name: file
                }
            }
        }
    }
}

async function loadData() {
    try {
        const data = await readFile("data.json")
        return JSON.parse(data.toString())
    } catch (error) {
        if (error.code == "ENOENT") {
            console.log("FILE NOT FOUND => ", error.path)
            console.log("PLEASE RUN `npm run index` FIRST")
            process.exit(1)
        }

        throw error
    }
}