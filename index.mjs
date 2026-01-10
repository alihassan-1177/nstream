import { readdir, writeFile, readFile } from "fs/promises"
import express from "express"
import { createWriteStream } from "fs"

// const INDEX_PATH = "D:/Videos"
const INDEX_PATH = "E:/work"
// const INDEX_PATH = "E:/work"

const LOGGING_ENABLED = true

main()

function log(){
    if (LOGGING_ENABLED) {
        console.log(...arguments)
    }
}

async function main() {
    const command = process.argv[2]

    console.time("EXECUTION TIME =>", command)

    switch (command) {
        case "index":
            await indexFiles()
            break;
        case "serve":
            await startServer()
            break;
        case "experiment":
            // const files = await readdir(INDEX_PATH, {
            //     recursive: true,
            //     withFileTypes: true
            // })

            // const stream = createWriteStream("experiment.txt")

            // for (const file of files) {
            //     log("PROCESSING =>", file.name)
            //     stream.write(`${file.name}\n`)
            // }

            // stream.end()

            break;
        default:
            log("UNKNOWN COMMAND =>", command)
            process.exit()
            break;
    }

    log("COMMAND COMPLETED =>", command)
    console.timeEnd("EXECUTION TIME =>", command)

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
        log(`SERVER STARTED ON PORT => ${port}`)
    })
}

async function indexFiles() {
    const files = {}
    const writeStream = createWriteStream("experiment.txt")
    await loadFilesDataImproved(INDEX_PATH, files, writeStream)
    writeStream.end()

    await writeFile("data.json", JSON.stringify(files))
}

async function loadData() {
    try {
        const data = await readFile("data.json")
        return JSON.parse(data.toString())
    } catch (error) {
        if (error.code == "ENOENT") {
            log("FILE NOT FOUND => ", error.path)
            log("PLEASE RUN `npm run index` FIRST")
            process.exit(1)
        }

        throw error
    }
}

async function loadFilesData(directoryPath, foundFiles) {
    const files = await readdir(directoryPath, {
        withFileTypes: true
    })

    for (const file of files) {
        log("PROCESSING =>", file.name)
        const filePath = `${directoryPath}/${file.name}`
        const key = filePath.replace(/[^a-z0-9]/gi, "").toUpperCase();

        if (file.isDirectory()) {
            log("FOUND DIRECTORY =>", filePath)

            foundFiles[key] = {
                type: "FOLDER",
                path: filePath,
                name: file.name
            }

            foundFiles[key]["children"] = {}
            await loadFilesData(filePath, foundFiles[key]["children"])
        }

        if (file.isFile()) {
            log("FOUND FILE =>", filePath)

            foundFiles[key] = {
                type: "FILE",
                path: filePath,
                name: file.name
            }
        }

    }
}

async function loadFilesDataImproved(directoryPath, foundFiles, writeStream) {
    const files = await readdir(directoryPath, { withFileTypes: true });
    // Use Promise.all if you want to speed up processing of sub-directories in parallel
    await Promise.all(files.map(async (file) => {
        const filePath = `${directoryPath}/${file.name}`;
        const key = filePath.replace(/[^a-z0-9]/gi, "").toUpperCase();

        log("PROCESSING =>", filePath);
 
        writeStream.write(`${filePath}\n`)

        if (file.isDirectory()) {
            foundFiles[key] = {
                type: "FOLDER",
                path: filePath,
                name: file.name,
                children: {} // Initialize children immediately
            };
            // Recursive call
            await loadFilesDataImproved(filePath, foundFiles[key].children, writeStream);
        } else if (file.isFile()) {
            foundFiles[key] = {
                type: "FILE",
                path: filePath,
                name: file.name
            };
        }
    }));
}