const globalState = {
    data: {},
    keys: []
}

const breadcrumbs = document.querySelector(".breadcrumbs")

main()

async function main() {
    await loadData()
    await buildUI()
}

async function loadData() {
    const response = await fetch("/api/data", {
        headers: {
            "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({
            keys: globalState.keys
        })
    })
    const data = await response.json()
    globalState.data = data
}

async function buildUI() {
    const items = document.querySelector(".items-wrapper")
    items.innerHTML = ""

    const keys = Object.keys(globalState.data)
    if (keys.length > 0) {

        for (let key of keys) {
            const item = globalState.data[key];
            let icon = item.type == "FOLDER" ? "fa-folder" : "fa-file"

            const element = `
            <button onclick="openItem(this)" data-id="${key}" data-type="${item.type}" class="item">
                <i class="fa-solid ${icon}"></i>
                <div class="item-detail">
                    <p>${item.name}</p>
                    <small>${item.path}</small>
                </div>
            </button>
        `

            items.innerHTML += element
        }

    }
}

async function openItem(e) {
    window.scrollTo(0, 0);

    if (e.dataset.type == "HOME") {
        globalState.keys = []
        await loadData()
        await buildUI()
    }

    if (e.dataset.type == "FOLDER") {    
        if (globalState.keys.indexOf(e.dataset.id) == -1) {
            globalState.keys.push(e.dataset.id)
        } else {
            let index = globalState.keys.indexOf(e.dataset.id)
            globalState.keys.splice(index + 1)
        }
        await loadData()
        await buildUI()
    }

    buildBreadcrumbs()
}

buildBreadcrumbs()

function buildBreadcrumbs() {
    const homeBtn = `
        <button class="breadcrumb-item" onclick="openItem(this)" data-type="HOME">
            <i class="fa-solid fa-home"></i>
        </button>
        <span>/</span>
        `

    breadcrumbs.innerHTML = `${homeBtn}`

    console.log(globalState)

    globalState.keys.forEach(key => {
        const element = `
        <button class="breadcrumb-item" onclick="openItem(this)" data-id="${key}" data-type="FOLDER">
           ${key}
        </button>
        <span>/</span>
        `
        breadcrumbs.innerHTML += element
    })
}