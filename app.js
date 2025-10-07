const teamNumberInput = document.getElementById('team-number');
const eventCodeInput = document.getElementById('event-code');
const loadMatchesButton = document.getElementById('load-matches');
const matchesList = document.getElementById('matches-list');

const checklist = document.getElementById('checklist');
const notesTextarea = document.getElementById('match-notes');
const saveNotesButton = document.getElementById('save-notes');

// Enter your TBA Read API Key here
const TBA_API_KEY = 'BeG5D5SaJDBW9iun3eGrb0grTcKGLdEXiacoIDzM3GBPEbPVf44wVR7Ztxb5qDYV';

// Load matches from TBA API
async function fetchMatches(teamNumber, eventCode) {
    const url = `https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/event/${eventCode}/matches/simple`;
    const res = await fetch(url, {
        headers: { 'X-TBA-Auth-Key': TBA_API_KEY }
    });
    if (!res.ok) throw new Error('Failed to fetch matches from TBA');
    return res.json();
}

// Populate match list
loadMatchesButton.addEventListener('click', async () => {
    const teamNumber = teamNumberInput.value;
    const eventCode = eventCodeInput.value;
    matchesList.innerHTML = 'Loading...';
    try {
        const matches = await fetchMatches(teamNumber, eventCode);
        matchesList.innerHTML = '';
        matches
            .filter(m => m.comp_level === 'qm') // only qualification matches
            .sort((a,b) => a.match_number - b.match_number)
            .forEach(match => {
                const li = document.createElement('li');
                li.textContent = `Match ${match.match_number} - ${match.alliances.red.team_keys.includes(`frc${teamNumber}`) ? 'Red' : 'Blue'}`;
                li.style.cursor = 'pointer';
                li.addEventListener('click', () => loadMatchData(match.match_number));
                matchesList.appendChild(li);
            });
    } catch (err) {
        matchesList.innerHTML = 'Error loading matches';
        console.error(err);
    }
});

// Save checklist and notes
function saveMatchData(matchNumber) {
    const checklistData = {};
    checklist.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        checklistData[cb.id] = cb.checked;
    });
    const notesData = notesTextarea.value;
    localStorage.setItem(`match_${matchNumber}`, JSON.stringify({ checklist: checklistData, notes: notesData }));
    alert('Saved!');
}

// Load checklist and notes
function loadMatchData(matchNumber) {
    const data = JSON.parse(localStorage.getItem(`match_${matchNumber}`));
    if (data) {
        checklist.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = data.checklist[cb.id] || false);
        notesTextarea.value = data.notes || '';
    } else {
        checklist.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        notesTextarea.value = '';
    }
}

// Save button
saveNotesButton.addEventListener('click', () => {
    const selectedMatch = matchesList.querySelector('li.selected');
    if (!selectedMatch) {
        alert('Select a match first!');
        return;
    }
    const matchNumber = selectedMatch.textContent.match(/\d+/)[0];
    saveMatchData(matchNumber);
});

// Highlight selected match
matchesList.addEventListener('click', (e) => {
    if(e.target.tagName === 'LI') {
        matchesList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
        e.target.classList.add('selected');
    }
});
