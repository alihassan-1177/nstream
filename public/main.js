const globalState = {
    data: {},
    keys: []
}


const refreshIndexButton = document.querySelector(".refresh-btn")

refreshIndexButton.addEventListener("click", async () => {
    console.log("SENDING REFRESH REQUEST")
    const response = await fetch("/api/refresh-index")
    const data = await response.json()
    if(data.success){
        main()        
    }
})

main()

async function main() {
    await loadData()
    await buildUI()
}

async function loadData() {
    console.log("GLOBAL STATE KEYS => ", globalState.keys)
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
    console.log("DATA KEYS => ", keys)
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
            // console.log("ITEM => ", item)
        }

    }
}

async function openItem(e) {
    if (e.dataset.type == "FOLDER") {
        if (globalState.keys.indexOf(e.dataset.id) == -1) {
            globalState.keys.push(e.dataset.id)
            await loadData()
            await buildUI()
        }
    }

}
