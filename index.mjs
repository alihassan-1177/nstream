import { readdir, writeFile, readFile } from "fs/promises"
import express from "express"

const INDEX_PATH = "D:/Videos/Courses"
const globalState = {
    data: {}
}

main()

async function main() {
    const app = express()
    const port = 3000

    app.use(express.static('public'))
    app.use(express.json())

    globalState.data = await loadData()

    const initialData = {}

    for (let key of Object.keys(globalState.data)) {
        initialData[key] = {
            type: globalState.data[key].type,
            path: globalState.data[key].path,
            name: globalState.data[key].name,
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
                    _data = globalState.data[key]["children"]
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

    app.get('/api/refresh-index', async (req, res) => {
        console.log("REFRESHING INDEX")
        await indexFiles()
        globalState.data = await loadData()
        res.send({
            "success": true
        })
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
    return JSON.parse((await readFile("data.json")).toString())
}