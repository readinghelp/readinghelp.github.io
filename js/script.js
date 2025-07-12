function convertToRangeCfi(startCfi, endCfi) {
  const cleanStart = startCfi.replace(/^epubcfi\(|\)$/g, '');
  const cleanEnd = endCfi.replace(/^epubcfi\(|\)$/g, '');

  const [startBase, startSubpath] = cleanStart.split('!');
  let [endBase, endSubpath] = cleanEnd.split('!');

  if (startBase !== endBase) {
    throw new Error("Start and End CFIs are in different spine items.");
  }

  // Patch: bump the endSubpath to ensure inclusive range
  const bumpEndCfi = (subpath) => {
    const parts = subpath.split('/');
    for (let i = parts.length - 1; i >= 0; i--) {
      const num = parseInt(parts[i], 10);
      if (!isNaN(num)) {
        parts[i] = (num + 2).toString(); // CFI steps are usually even
        break;
      }
    }
    return parts.join('/');
  };
  endSubpath = bumpEndCfi(endSubpath);

  const startParts = startSubpath.split('/');
  const endParts = endSubpath.split('/');

  let commonParts = [];
  for (let i = 0; i < Math.min(startParts.length, endParts.length); i++) {
    if (startParts[i] === endParts[i]) {
      commonParts.push(startParts[i]);
    } else {
      break;
    }
  }

  const commonPath = '/' + commonParts.filter(Boolean).join('/');
  const startTail = '/' + startParts.slice(commonParts.length).join('/');
  const endTail = '/' + endParts.slice(commonParts.length).join('/');

  if (!startTail || !endTail) {
    return `epubcfi(${startBase}!${startSubpath})`; // fallback to single CFI
  }

  return `epubcfi(${startBase}!${commonPath},${startTail},${endTail})`;
}

async function textFromCfi() {
    // Get the current location (CFI range) from the rendition
    const location = rendition.location;
    if (location && location.start && location.end) {
        const startCfi = location.start.cfi;
        const endCfi = location.end.cfi;
        console.log(startCfi, endCfi);
        // Extract base, start, and end using regex
        cfiRange = convertToRangeCfi(startCfi, endCfi);
        console.log(cfiRange);
        try {
            const range = await book.getRange(cfiRange);
            const text = range ? range.toString() : '';
            console.log(text);
            return text;
        } catch (error) {
            console.error('Error fetching text from CFI', error);
            alert('Error fetching text from CFI');
            return '';
        }
    } else {
        console.warn("Unable to get current CFI range from rendition.");
        alert(null);
        return '';
    }
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
    ////
    ////
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
    //"break-inside": "avoid",
    //"page-break-inside": "avoid",
    //"orphans": 2,
    //"widows": 2,
    //"overflow-wrap": "break-word",
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