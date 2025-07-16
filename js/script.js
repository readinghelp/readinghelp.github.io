//////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////
function firstListDiff(list1, list2) {
  for (let i=0; i < list1.length; i++) {
    if (list1[i] != list2[i]) {
      return i;
    }
  }
  return i;
}

function cfiToRange2(start, end) {
  const startCfi = start;
  const endCfi = end;
  let cfiBase;
  let startRange;
  let endRange;
  let i = firstListDiff(startCfi, endCfi);
  i = Math.max(i, (endCfi.indexOf("!")) + 2);
  i = endCfi.slice(0,i).lastIndexOf("/") + 1
  console.log(i);
  cfiBase = endCfi.slice(0, i-1);
  startRange = startCfi.slice(i-1, -1).trim();
  endRange = endCfi.slice(i-1, -1).trim();
  const endRangeArr = endRange.split(":");
  let endNum = parseInt(endRangeArr[1]) + 1;
  endRange = endRangeArr[0] + ":" + endNum;
  if (cfiBase === startCfi.slice(0, i-1)) {
    return `${cfiBase},${startRange},${endRange})`;
    //document.getElementById("bouton").innerText = `${cfiBase},${startRange},${endRange})`;
  }
  else {
    return `${cfiBase},/2/1:0,${endRange})`;
    //document.getElementById("bouton").innerText = `${cfiBase},${startRange},/999/1:1)`;
  }
}

function cfiToRange1(start, end) {
  const startCfi = start;
  let cfiBase;
  let startRange;
  let i = startCfi.search(/\/\d+\/\d+:\d+/) + 1;
  console.log(i);
  cfiBase = startCfi.slice(0, i-1);
  startRange = startCfi.slice(i-1, -1).trim();
  console.log(rendition.currentLocation());
  return `${cfiBase},${startRange},/54/9:54)`;
  //document.getElementById("bouton").innerText = `${cfiBase},${startRange},/999/1:1)`;
}

function extractSpineId(cfi) {
  const match = cfi.match(/\/\d+\/\d+\[([^\]]+)\]/);
  return match ? match[1] : null;
}

async function textFromCfi() {
  // Get the current location from the rendition
  const location = rendition.location;
  const startCfi = location.start.cfi;
  const endCfi = location.end.cfi;

  console.log(startCfi, endCfi);

  // Check if start and end are in different spine items
  const startSpineId = extractSpineId(startCfi);
  const endSpineId = extractSpineId(endCfi);

  if (startSpineId !== endSpineId) {
    alert('Start and end CFIs are in different spine items.');
    // Extract range using other function
    const cfiRange2 = cfiToRange2(startCfi, endCfi);
    const cfiRange1 = cfiToRange1(startCfi, endCfi);
    console.log(cfiRange2, cfiRange1);

    try {
      const range2 = await book.getRange(cfiRange2);
      const range1 = await book.getRange(cfiRange1);
      console.log(range2, range1);
      let text1 = range1 ? range1.toString() : '';
      text1 = text1.replace(/(\r\n\r\n|\n\n|\r\r)/gm, " <NEWPARAGRAPH> ");
      text1 = text1.replace(/(\r\n|\n|\r)/gm, " ");
      text1 = text1.replace(/(<NEWPARAGRAPH>)/gm, "\n\n");
      console.log(text1);
      let text2 = range2 ? range2.toString() : '';
      text2 = text2.replace(/(\r\n\r\n|\n\n|\r\r)/gm, " <NEWPARAGRAPH> ");
      text2 = text2.replace(/(\r\n|\n|\r)/gm, " ");
      text2 = text2.replace(/(<NEWPARAGRAPH>)/gm, "\n\n");
      console.log(text2);
      let text = text1 + "\n" + text2
      return text;
    } catch (error) {
      console.error('Error fetching text from CFI', error);
      alert('Error fetching text from CFI');
      return '';
    }
  }

  // Extract range using other function
  const cfiRange = cfiToRange2(startCfi, endCfi);
  console.log(cfiRange);

  try {
    const range = await book.getRange(cfiRange);
    console.log(range);
    let text = range ? range.toString() : '';
    text = text.replace(/(\r\n\r\n|\n\n|\r\r)/gm, " <NEWPARAGRAPH> ");
    text = text.replace(/(\r\n|\n|\r)/gm, " ");
    text = text.replace(/(<NEWPARAGRAPH>)/gm, "\n\n");
    return text;
  } catch (error) {
    console.error('Error fetching text from CFI', error);
    alert('Error fetching text from CFI');
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