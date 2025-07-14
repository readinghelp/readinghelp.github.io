//////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////
function convertToRangeCfi(startCfi, endCfi) {
  const cleanStart = startCfi.replace(/^epubcfi\(|\)$/g, '');
  const cleanEnd = endCfi.replace(/^epubcfi\(|\)$/g, '');

  const [startBase, startSubpath] = cleanStart.split('!');
  const [endBase, endSubpath] = cleanEnd.split('!');

  // If CFIs are in different spine items
  if (startBase !== endBase) {
    const startParts = startSubpath.split('/');
    const endParts = endSubpath.split('/');

    // Get common path in startSubpath
    const commonPartsStart = [];
    for (let i = 0; i < startParts.length; i++) {
      if (startParts[i] === '') continue;
      if (startParts[i].includes(':')) break;
      commonPartsStart.push(startParts[i]);
    }
    const commonPathStart = '/' + commonPartsStart.join('/');
    const startTail = '/' + startParts.slice(commonPartsStart.length).join('/');

    // Get common path in endSubpath
    const commonPartsEnd = [];
    for (let i = 0; i < endParts.length; i++) {
      if (endParts[i] === '') continue;
      if (endParts[i].includes(':')) break;
      commonPartsEnd.push(endParts[i]);
    }
    const commonPathEnd = '/' + commonPartsEnd.join('/');
    const endTail = '/' + endParts.slice(commonPartsEnd.length).join('/');

    const startRange = `epubcfi(${startBase}!${commonPathStart},${startTail},/20:0)`;
    const endRange = `epubcfi(${endBase}!${commonPathEnd},/0:0,${endTail})`;

    return [startRange, endRange];
  }

  // Same spine item, construct single range
  const startParts = startSubpath.split('/');
  const endParts = endSubpath.split('/');

  let commonParts = [];
  let divergenceIndex = 0;

  for (let i = 0; i < Math.min(startParts.length, endParts.length); i++) {
    if (startParts[i] === endParts[i]) {
      commonParts.push(startParts[i]);
    } else {
      divergenceIndex = i;
      break;
    }
  }

  const commonPath = '/' + commonParts.filter(Boolean).join('/');
  const startTail = '/' + startParts.slice(commonParts.length).join('/');
  let endTail = '/' + endParts.slice(commonParts.length).join('/');

  if (!startTail || !endTail) {
    throw new Error("Invalid subpaths for CFI range construction.");
  }

  let endTails = endTail.split(':');
  endTails[1] = parseInt(endTails[1]) + 1;
  endTail = endTails.join(':');

  return `epubcfi(${startBase}!${commonPath},${startTail},${endTail})`;
}



async function textFromCfi() {
    // Get the current location from the rendition
    const location = rendition.location;
    if (location && location.start && location.end) {
        const startCfi = location.start.cfi;
        const endCfi = location.end.cfi;
        console.log(startCfi, endCfi);
        // Extract base, start, and end using other function
        cfiRange = convertToRangeCfi(startCfi, endCfi);
        console.log(cfiRange);

        if (Array.isArray(cfiRange)) {
          //alert('you ran into that weird case i havent solved yet lol');
          let output = '';
          for (let item in cfiRange) {
            try {
              const range = await book.getRange(item);
              let text = range ? range.toString() : '';
              text = text.replace(/(\r\n\r\n|\n\n|\r\r)/gm, " <NEWPARAGRAPH> ");
              text = text.replace(/(\r\n|\n|\r)/gm, " ");
              text = text.replace(/(<NEWPARAGRAPH>)/gm, "\n\n");
              console.log(text);
              output += text;
            } catch (error) {
                console.error('Error fetching text from CFI', error);
                alert('Error fetching text from CFI');
                output += '';
            }
            return output;
          }
        } else {      
          try {
              const range = await book.getRange(cfiRange);
              let text = range ? range.toString() : '';
              text = text.replace(/(\r\n\r\n|\n\n|\r\r)/gm, " <NEWPARAGRAPH> ");
              text = text.replace(/(\r\n|\n|\r)/gm, " ");
              text = text.replace(/(<NEWPARAGRAPH>)/gm, "\n\n");
              console.log(text);
              return text;
          } catch (error) {
              console.error('Error fetching text from CFI', error);
              alert('Error fetching text from CFI');
              return '';
          }
        }
    } else {
        console.warn("Unable to get current CFI range from rendition.");
        alert(null);
        return '';
    }
}

async function textToSpeech() {
    text = await textFromCfi(); 
    console.log(text);
    let speech = new SpeechSynthesisUtterance();
    speech.text = text;
    speech.volume = 1;
    speech.rate = 0.5;
    speech.pitch = 10;
    speechSynthesis.speak(speech);
}

let i = 0;
function move(cwidth, nwidth) {
  if (i == 0) {
    i = 1;
    const elem = document.getElementById("myBar");
    let width = parseFloat(cwidth);
    const id = setInterval(frame, 50);
    function frame() {
      if (width >= parseFloat(nwidth)) {
        clearInterval(id);
        i = 0;
      } else {
        width = width + 0.01;
        elem.style.width = (parseFloat(width)/0.9877074370006146) + "%";
        elem.innerHTML = parseInt(width/0.9877074370006146)  + "%";
      }
    }
  }
}

///////////////////////////////////MAIN CODE//////////////////////////////////////////////
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
  book.locations.generate(100);
  console.log(book.locations);
  let next = document.getElementById("next");

  next.addEventListener("click", function(e){
    speechSynthesis.cancel();
    if (book.package.metadata.direction === "rtl") {
      rendition.prev();
    } else {
      rendition.next(); 
    }
    e.preventDefault();
  }, false);

  let prev = document.getElementById("prev");
  prev.addEventListener("click", function(e){
    speechSynthesis.cancel();
    if (book.package.metadata.direction === "rtl") {
      rendition.next();
    } else {
      rendition.prev(); 
    }
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
    const locationcfi = location.start.cfi;
    const loc = book.locations.locationFromCfi(locationcfi);
    console.log(loc);
    const locpercent = (loc / 1627) * 100;
    const prevpercent = ((loc-1) / 1627) * 100;
    console.log(locpercent, prevpercent);
    move(prevpercent, locpercent);

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