$(".flipbook").turn();

document.getElementById("demo").innerHTML = `
<p>
  this is an example on line 1 <br>
  and i want to continue on line 2
</p>
`;
document.getElementById("demo2").innerHTML = "Hello World!";

document.getElementById("demo3").innerHTML = "bombasticlap!";

document.getElementById("demo4").innerHTML = "bombasticlap2!";

document.getElementById("bouton").innerHTML = $('#flipbook').turn('page'); 

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