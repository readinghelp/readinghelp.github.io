/**
 * Extracts text between two CFI positions using epub.js, without displaying anything.
 * @param {Book} book - The epub.js Book instance.
 * @param {string} cfiStart - The starting CFI.
 * @param {string} cfiEnd - The ending CFI.
 * @returns {Promise<string>} - Promise resolving to the extracted text.
 */
async function extractTextBetweenCFIsBackend(book, cfiStart, cfiEnd) {
    // Find the section for the start CFI
    const section = book.spine.get(cfiStart);
    if (!section) throw new Error('Section not found for start CFI.');

    // Load the section
    await section.load();

    // Try to get the DOM Range using section.cfiRange (most epub.js builds support this)
    let range;
    if (typeof section.cfiRange === "function") {
        range = await section.cfiRange(cfiStart, cfiEnd);
    } else if (typeof book.getRange === "function") {
        range = await book.getRange(cfiStart, cfiEnd);
    } else {
        throw new Error('No method to get DOM Range from CFIs.');
    }

    if (!range) throw new Error('Unable to create DOM Range from CFIs.');

    // Extract and return the text within the range
    const text = range.toString().trim();
    return text;
}

function textToSpeech() {
    const iframes = Array.from(document.querySelectorAll("#viewer iframe")).slice(0, 2);
    let text = "";
    iframes.forEach((iframe) => {
        try {
            const doc = iframe.contentDocument;
            const bodyText = doc.body.innerText || "";
            console.log(bodyText);
            text += (bodyText + "  ");
        } catch (e) {
            console.warn("unable to access iframe content", e)
        }
    });
    text = text.trim(); 
    let speech = new SpeechSynthesisUtterance();
    speech.text = text;
    speech.volume = 1;
    speech.rate = 0.5;
    speech.pitch = 10;
    speechSynthesis.speak(speech);
    // extractTextBetweenCFIsBackend(book, 'epubcfi(/6/2[chapter1]!/4/1:0)', 'epubcfi(/6/2[chapter1]!/4/1:50)')
    // .then(text => console.log(text))
    // .catch(err => console.error(err));
    // console.log(rendition.reportLocation());
    ///////////////////////////////////////////////////////////////
    // document.getElementById("prev").addEventListener("click", function() {
    //     speechSynthesis.cancel();
    // });
    // document.getElementById("next").addEventListener("click", function() {
    //     speechSynthesis.cancel();
    // });
    // Get current location info from rendition ///////////////////////
    // const location = rendition.reportLocation();
    // if (!location || !location.start || !location.end) {
    //     console.warn("Unable to get current CFI range from rendition.");
    //     return;
    // }

    // const cfiStart = location.start.cfi;
    // const cfiEnd = location.end.cfi;

    // extractTextBetweenCFIsBackend(book, cfiStart, cfiEnd)
    //     .then(text => {
    //         console.log(text);
    //         let speech = new SpeechSynthesisUtterance();
    //         speech.text = text;
    //         speech.volume = 1;
    //         speech.rate = 0.5;
    //         speech.pitch = 10;
    //         speechSynthesis.speak(speech);
    //     })
    //     .catch(err => console.error(err));

    // document.getElementById("prev").addEventListener("click", function() {
    //     speechSynthesis.cancel();
    // });
    // document.getElementById("next").addEventListener("click", function() {
    //     speechSynthesis.cancel();
    // });
}

// Load the book
book = ePub("your-book.epub");
const rendition = book.renderTo("viewer", {
    manager: "continuous",
    flow: "paginated",
    width: "100%",
    height: 600
});

rendition.themes.default({
    "p": {
    "font-family": "Georgia, serif",
    "break-inside": "avoid",
    "page-break-inside": "avoid",
    "orphans": 2,
    "widows": 2,
    "overflow-wrap": "break-word",
    "text-align": "justify"
    },
    "h1": {
    "font-family": "Helvetica, sans-serif"
    }
});

const displayed = rendition.display();

book.ready.then(() => {

    let next = document.getElementById("next");

    next.addEventListener("click", function(e){
    book.package.metadata.direction === "rtl" ? rendition.prev() : rendition.next();
    e.preventDefault();
    }, false);

    let prev = document.getElementById("prev");
    prev.addEventListener("click", function(e){
    book.package.metadata.direction === "rtl" ? rendition.next() : rendition.prev();
    e.preventDefault();
    }, false);

});

rendition.on("selected", function(range) {
    console.log("selected", range);
});

rendition.on("layout", function(layout) {
    let viewer = document.getElementById("viewer");

    if (layout.spread) {
    viewer.classList.remove('single');
    } else {
    viewer.classList.add('single');
    }
});

rendition.on("relocated", function(location){
    console.log(location);

    let next = book.package.metadata.direction === "rtl" ?  document.getElementById("prev") : document.getElementById("next");
    let prev = book.package.metadata.direction === "rtl" ?  document.getElementById("next") : document.getElementById("prev");

    if (location.atEnd) {
    next.style.visibility = "hidden";
    } else {
    next.style.visibility = "visible";
    }

    if (location.atStart) {
    prev.style.visibility = "hidden";
    } else {
    prev.style.visibility = "visible";
    }

});