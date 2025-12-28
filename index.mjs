import { readdir, writeFile, readFile } from "fs/promises"
import express from "express"

main()

async function main() {
    const app = express()
    const port = 3000

    const data = JSON.parse((await readFile("data.json")).toString())

    app.get('/', (req, res) => {
        res.send(data)
    })

    app.get('/refresh-index', async (req, res) => {
        console.log("REFRESHING INDEX")
        await indexFiles()
        res.send({
            "success": true
        })
    })

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    })
}

async function indexFiles() {
    const path = "D:/Videos"
    const files = {}
    await findFilesInDirectory(path, files)
    await writeFile("data.json", JSON.stringify(files))
    console.log("FOUND FILES => ", files)
}

async function findFilesInDirectory(directoryPath, foundFiles) {
    const files = await readdir(directoryPath)
    for (const file of files) {
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
