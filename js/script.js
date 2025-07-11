$(".flipbook").turn();

function TextToSpeech() {
    const pages = $('#flipbook').turn('view'); // Get currently visible pages
    let combinedText = '';
    pages.forEach(function(pageNum) {
        const pageElement = $('#flipbook').children().eq(pageNum-1); // Pages are 0-indexed in jQuery's .eq()
        combinedText += pageElement.text() + '\n'; // Extract visible text
    });
    document.getElementById("bouton").innerText = pages;
    let text = combinedText;
    let speech = new SpeechSynthesisUtterance();
    speech.text = text;
    speech.volume = 1;
    speech.rate = 0.5;
    speech.pitch = 10;
    window.speechSynthesis.speak(speech);
}