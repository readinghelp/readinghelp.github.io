// IndexedDB Setup
let db;
const request = indexedDB.open("epubReaderDB", 2);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains("books")) {
        db.createObjectStore("books", { keyPath: "id" });
    }
};

request.onsuccess = async function(event) {
    db = event.target.result;
    await addBuiltinBook();
    displayBooks();
};

async function extractBookInfo(file){
    const book = ePub(file);
    await book.ready;

    let metadata = {};
    let coverURL = null;
    try {
        metadata = await book.loaded.metadata;
    } catch {}

    try {
        coverURL = await book.coverUrl();
    } catch {}

    return {
        title: metadata.title || file.name.replace(".epub",""),
        author: metadata.creator || "",
        cover: coverURL
    };
}

async function addBuiltinBook(){
    const tx = db.transaction("books","readonly");
    const store = tx.objectStore("books");
    const books = await new Promise(resolve=>{
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
    });

    const exists = books.some(b => b.builtin);
    if(exists) return;

    const response = await fetch("alice.epub");
    const blob = await response.blob();

    const info = await extractBookInfo(blob);

    const tx2 = db.transaction("books","readwrite");
    const store2 = tx2.objectStore("books");

    store2.add({
        id: "builtin-alice",
        file: blob,
        title: info.title || "Alice in Wonderland",
        author: info.author || "Lewis Carroll",
        cover: info.cover,
        builtin: true
    });

}

document.getElementById("addBook").onclick = async function(){
    const input = document.getElementById("fileInput");
    const file = input.files[0];

    if(!file){
        alert("Select an EPUB first");
        return;
    }
    const info = await extractBookInfo(file);
    const tx = db.transaction("books","readwrite");
    const store = tx.objectStore("books");

    const book = {
        id: Date.now(),
        file: file,
        title: info.title,
        author: info.author,
        cover: info.cover
    };

    store.add(book);
    tx.oncomplete = function(){
        input.value="";
        displayBooks();
    };
};

function displayBooks(){
    const library = document.getElementById("library");
    library.innerHTML="";

    const tx = db.transaction("books","readonly");
    const store = tx.objectStore("books");

    const request = store.getAll();
    request.onsuccess = function(){
        const books = request.result.sort((a, b) => {
            if (a.builtin && !b.builtin) return -1;
            if (!a.builtin && b.builtin) return 1;
            return a.id - b.id;

        });
        books.forEach(book => {
            const card = document.createElement("div");
            card.className = "book";

            const coverWrap = document.createElement("div");
            coverWrap.className = "book-cover-wrapper";

            const img = document.createElement("img");
            img.className = "book-cover";

            if(book.cover){
                img.src = book.cover;
            }

            const overlay = document.createElement("div");
            overlay.className = "book-overlay";

            const openBtn = document.createElement("button");
            openBtn.textContent = "Open";
            openBtn.onclick = function(){
                const url = URL.createObjectURL(book.file);
                window.open(url);
            };

            // Delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.className = "delete-button";
            deleteBtn.onclick = function(){
                deleteBook(book.id);
            };

            overlay.appendChild(openBtn);
            if(!book.builtin){
                overlay.appendChild(deleteBtn);
            }
            else {
                const badge = document.createElement("button");
                badge.textContent = "Inbuilt";
                badge.className = "sample-button";
                overlay.appendChild(badge);
            }
            coverWrap.appendChild(img);
            coverWrap.appendChild(overlay);

            const title = document.createElement("div");
            title.className = "book-title";
            title.textContent = book.title;

            if(book.author){
                const author = document.createElement("div");
                author.style.fontSize = "13px";
                author.style.opacity = "0.7";
                author.textContent = book.author;
                card.appendChild(coverWrap);
                card.appendChild(title);
                card.appendChild(author);
            } else {
                card.appendChild(coverWrap);
                card.appendChild(title);
            }
            library.appendChild(card);
        });
    };
}

function deleteBook(id){
    const tx = db.transaction("books","readwrite");
    const store = tx.objectStore("books");

    store.delete(id);
    tx.oncomplete = function(){
        displayBooks();
    };
}