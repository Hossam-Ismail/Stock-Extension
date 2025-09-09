const button = document.getElementById('OnOff');

// Initial state
let isOn = true;
button.classList.add('on');
button.textContent = 'On';
// Add click event listener
button.addEventListener('click', () => {
    isOn = !isOn; // Toggle the state

    if (isOn) {
        button.classList.toggle('on');
        button.textContent = 'On'; // Change button text
    } else {
        button.classList.toggle('on');
        button.textContent = 'Off'; // Change button text
    }
});
// make the on and off interact with the content script
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab) {
        chrome.tabs.sendMessage(activeTab.id, { action: isOn ? 'start' : 'stop' });
    }
});

