//////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////
async function getCharacterAtCfi(cfi) {
  try {
    const range = await book.getRange(cfi);
    if (!range) {
      console.warn("Invalid range returned for CFI:", cfi);
      return null;
    }

    const containerText = range.startContainer.textContent;
    const offset = range.startOffset;

    if (containerText && offset < containerText.length) {
      return containerText.charAt(offset);
    } else {
      console.warn("Offset exceeds text length or container is null.");
      return null;
    }
  } catch (err) {
    console.error("Error getting character at CFI:", err);
    return null;
  }
}

async function isValidCfi(startcfi, endcfi) {
  if (startcfi == endcfi) {
    let endcfiArr = endcfi.split(":");
    endcfiArr[1] = endcfiArr[1].slice(0, -1);
    let endcfiNum = parseInt(endcfiArr[1]) + 1;
    endcfi = endcfiArr[0] + ":" + endcfiNum + ")";
  }
  const cfirange = await cfiToRange(startcfi, endcfi);
  //console.log(cfirange);
  try {
    const range = await book.getRange(cfirange);
    //console.log(range);
    let text = range.toString();
    //console.log(text);
    if (text.length > 0) { return true; }
    else { return false; }
  } catch (err) { return false; }
}

async function spineEndCfi(start) {
  const startCfi = start;
  let parent = startCfi.split("!")[0];
  let endCfi = startCfi.split("!")[1];
  let valid = true;
  let endcfiArr = endCfi.split(":");
  endcfiArr[1] = endcfiArr[1].slice(0, -1);
  let endcfiNum = parseInt(endcfiArr[1]);
  while (valid == true) {
    endcfiNum ++ ;
    endCfi = parent + "!" + endcfiArr[0] + ":" + endcfiNum + ")";
    valid = await isValidCfi(startCfi, endCfi);
  }
  endCfi = endcfiArr[0] + ":" + (endcfiNum-1) + ")";
  return parent + "!" + endCfi;
}

function firstListDiff(list1, list2) {
  for (let i = 0; i < list1.length; i++) {
    if (list1[i] != list2[i]) {
      return i;
    }
  }
  return i;
}

async function cfiToRange(start, end) {
  let startCfi = start;
  let char = "\n"
  let startCfiArr = startCfi.split(":");
  let startNum = parseInt(startCfiArr[1].slice(0, startCfiArr[1].length - 1));
  let offset = startNum - 1;
  while (/^\s*$/.test(char)) {
    offset ++;
    startCfiArr = startCfi.split(":");
    startCfi = startCfiArr[0] + ":" + offset + ")";
    char = await getCharacterAtCfi(startCfi);
    //console.log(char.length);
  }
  const endCfi = end;
  let cfiBase;
  let startRange;
  let endRange;
  let i = firstListDiff(startCfi, endCfi);
  i = Math.max(i, (endCfi.indexOf("!")) + 2);
  i = endCfi.slice(0, i).lastIndexOf("/") + 1
  //console.log(i);
  cfiBase = endCfi.slice(0, i - 1);
  startRange = startCfi.slice(i - 1, -1).trim();
  endRange = endCfi.slice(i - 1, -1).trim();
  const endRangeArr = endRange.split(":");
  let endNum = parseInt(endRangeArr[1]) + offset - startNum;
  endRange = endRangeArr[0] + ":" + endNum;
  if (cfiBase === startCfi.slice(0, i - 1)) {
    return `${cfiBase},${startRange},${endRange})`;
  }
  else {
    return `${cfiBase},/2/8:0,${endRange})`;
  }
}

function extractSpineId(cfi) {
  const match = cfi.match(/\/\d+\/\d+\[([^\]]+)\]/);
  return match ? match[1] : null;
}

async function textFromCfi() {
  const location = rendition.location;
  const startCfi = location.start.cfi;
  const endCfi = location.end.cfi;

  //console.log(startCfi, endCfi);

  const startSpineId = extractSpineId(startCfi);
  const endSpineId = extractSpineId(endCfi);

  if (startSpineId !== endSpineId) {
    console.warn('Start and end CFIs are in different spine items.');
    const cfiRange2 = await cfiToRange(startCfi, endCfi);
    const newEndCfi = await spineEndCfi(startCfi);
    const cfiRange1 = await cfiToRange(startCfi, newEndCfi);
    //console.log(cfiRange2, cfiRange1);
    const contents = rendition.getContents();
    const doc = contents[0].document;
    let chapter = doc.body.innerText || doc.body.textContent;
    //console.log(chapter);
    try {
      const range2 = await book.getRange(cfiRange2);
      const range1 = await book.getRange(cfiRange1);
      //console.log(range2, range1);
      let text1 = range1 ? range1.toString() : '';
      text1 = text1.replace(/(\r\n\r\n|\n\n|\r\r)/gm, " <NEWPARAGRAPH> ");
      text1 = text1.replace(/(\r\n|\n|\r)/gm, " ");
      text1 = text1.replace(/(<NEWPARAGRAPH>)/gm, "\n\n");
      //console.log(text1);
      text1 = text1.trim();
      chapter = chapter.split(text1);
      text0 = chapter[chapter.length - 1];
      //console.log(text0);
      text1 = text1 + text0;
      let text2 = range2 ? range2.toString() : '';
      text2 = text2.replace(/(\r\n\r\n|\n\n|\r\r)/gm, " <NEWPARAGRAPH> ");
      text2 = text2.replace(/(\r\n|\n|\r)/gm, " ");
      text2 = text2.replace(/(<NEWPARAGRAPH>)/gm, "\n\n");

      let text = text1 + "\n" + text2;
      console.log("text fetched successfully");
      return text;
    } catch (error) {
      console.error('Error fetching text from CFI', error);
      alert('Error fetching text - this is probably a code error');
      return '';
    }
  }

  const cfiRange = await cfiToRange(startCfi, endCfi);
  //console.log(cfiRange);

  try {
    const range = await book.getRange(cfiRange);
    //console.log(range);
    let text = range ? range.toString() : '';
    text = text.replace(/(\r\n\r\n|\n\n|\r\r)/gm, " <NEWPARAGRAPH> ");
    text = text.replace(/(\r\n|\n|\r)/gm, " ");
    text = text.replace(/(<NEWPARAGRAPH>)/gm, "\n\n");
    console.log("text fetched successfully");
    return text;
  } catch (error) {
    console.error('Error fetching text from CFI', error);
    alert('Error fetching text - this is probably a code error');
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
        elem.style.width = (parseFloat(width) / 0.9877074370006146) + "%";
        elem.innerHTML = parseInt(width / 0.9877074370006146) + "%";
      }
    }
  }
}

function goToChapter(selectElement) {
  const href = selectElement.value;
  if (href) {
    rendition.display(href);
  }
}

//////////////////////////////////////////////////MAIN CODE//////////////////////////////////////////////
window.addEventListener('beforeunload', () => {
  window.speechSynthesis.cancel();
});

window.addEventListener('DOMContentLoaded', function () {
  if (window.innerWidth <= 768) {
    const viewer = document.getElementById('viewer');
    viewer.classList.remove('spreads');
  }
});

let book;
let rendition;

document.querySelector('input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (rendition) {
    rendition.destroy();
  }
  book = ePub(file);

  //book = ePub("your-book.epub");

  rendition = book.renderTo("viewer", {
    manager: "continuous",
    flow: "paginated",
    width: "100%",
    height: "100%"
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

  const savedCfi = localStorage.getItem(`${file.name}-loc`);
  if (savedCfi) {
    rendition.display(savedCfi);
  }
  else {rendition.display();}

  let tocList = [];

  book.ready.then(() => {
    book.locations.generate(100);
    //console.log(book.locations);

    const oldNext = document.getElementById("next");
    const newNext = oldNext.cloneNode(true);
    oldNext.replaceWith(newNext);

    const oldPrev = document.getElementById("prev");
    const newPrev = oldPrev.cloneNode(true);
    oldPrev.replaceWith(newPrev);

    newNext.addEventListener("click", function (e) {
      if (book.package.metadata.direction === "rtl") {
        rendition.prev();
      } else {
        rendition.next();
      }
      e.preventDefault();
    }, false);

    newPrev.addEventListener("click", function (e) {
      if (book.package.metadata.direction === "rtl") {
        rendition.next();
      } else {
        rendition.prev();
      }
      e.preventDefault();
    }, false);
  });

  book.loaded.navigation.then(function (toc) {
    const tocElement = document.getElementById("toc");
    tocElement.innerHTML = "";
    tocList = toc.toc;
    tocList.forEach((chapter) => {
      const option = document.createElement("option");
      option.textContent = chapter.label;
      option.value = chapter.href;
      tocElement.appendChild(option);
    });
  });

  rendition.on("relocated", function (location) {
    speechSynthesis.cancel();
    const locationcfi = location.start.cfi;
    const loc = book.locations.locationFromCfi(locationcfi);
    const total = book.locations.total;
    const locpercent = (loc / total) * 100;
    const prevpercent = ((loc - 1) / total) * 100;
    if (Number.isFinite(prevpercent) && Number.isFinite(locpercent) && locpercent < 100 && prevpercent < 100) {
      move(prevpercent, locpercent);
    }

    let next = book.package.metadata.direction === "rtl" ? document.getElementById("prev") : document.getElementById("next");
    let prev = book.package.metadata.direction === "rtl" ? document.getElementById("next") : document.getElementById("prev");

    if (location.atEnd) {
      next.style.opacity = "0.5";
      next.style.pointerEvents = "none";
    } else {
      next.style.opacity = "1";
      next.style.pointerEvents = "auto";
    }

    if (location.atStart) {
      prev.style.opacity = "0.5";
      prev.style.pointerEvents = "none";
    } else {
      prev.style.opacity = "1";
      prev.style.pointerEvents = "auto";
    }

    if (tocList.length > 0 && location.start.href) {
      const tocElement = document.getElementById("toc");
      const currentHref = location.start.href.split("#")[0];
      for (let i = 0; i < tocList.length; i++) {
        if (tocList[i].href.split("#")[0] === currentHref) {
          tocElement.selectedIndex = i;
          break;
        }
      }
    }

    if (location && location.start && location.start.cfi) {
      localStorage.setItem(`${file.name}-loc`, location.start.cfi);
    }
  });

  rendition.on("selected", function (range) {
    console.log("selected", range);
  });

  rendition.on("layout", function (layout) {
    let viewer = document.getElementById("viewer");
    if (layout.spread) {
      viewer.classList.remove('single');
    } else {
      viewer.classList.add('single');
    }
  });
});