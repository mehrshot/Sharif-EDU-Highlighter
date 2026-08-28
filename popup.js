document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['courses', 'professors', 'enableHighlights', 'enableWidget'], (data) => {
    if (data.courses) {
      document.getElementById('courseCodes').value = data.courses.join(', ');
    }
    if (data.professors) {
      document.getElementById('professors').value = data.professors.join('، ');
    }
    if (data.enableHighlights !== undefined) {
      document.getElementById('enableHighlights').checked = data.enableHighlights;
    }
    if (data.enableWidget !== undefined) {
      document.getElementById('enableWidget').checked = data.enableWidget;
    }
  });
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const courseInput = document.getElementById('courseCodes').value;
  const profInput = document.getElementById('professors').value;
  const enableHighlights = document.getElementById('enableHighlights').checked;
  const enableWidget = document.getElementById('enableWidget').checked;
  
  const courses = courseInput.split(/,|،/).map(code => code.trim()).filter(code => code.length > 0);
  const professors = profInput.split(/,|،/).map(name => name.trim()).filter(name => name.length > 0);

  chrome.storage.sync.set({ 
    courses: courses, 
    professors: professors,
    enableHighlights: enableHighlights,
    enableWidget: enableWidget
  }, () => {
    const dot = document.querySelector('.dot');
    dot.style.backgroundColor = '#ff9800'; 
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "updateHighlights" }, () => {
          dot.style.backgroundColor = '#4caf50'; 
        });
      }
    });
  });
});