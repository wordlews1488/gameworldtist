let sound = new Audio("./sounds/button-digital-cartoon-vibrating.mp3")
let button = document.getElementById("buttons")
let input = document.getElementById("input")
button.addEventListener("click", () => {
    sound.play()

})
function send() {
    const value = document.getElementById("input").value;
    const input = document.getElementById("input")
    if (!value) return
    fetch("https://discord.com/api/webhooks/1493633638766608414/r49jRYQSwzqX6oQN2pMuO4uGsK-K6zqEpY5FYyvOOGf16Mqcs36hkiQrm13Lgffa_QOR", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            content: "Пользователь написал: " + value
        })
    });
    input.value = ""
}

