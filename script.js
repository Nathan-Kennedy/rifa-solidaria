function sortearNumero() {
  const box = document.getElementById('box');
  const paper = document.getElementById('paper');
  const button = document.querySelector('button');

  button.disabled = true;

  // Cria a lista de números para rolar
  const numberList = document.createElement('div');
  numberList.className = 'number-list';
  for (let i = 1; i <= 150; i++) {
    const number = document.createElement('div');
    number.textContent = i;
    numberList.appendChild(number);
  }
  box.appendChild(numberList);

  // Define o número sorteado
  const numeroSorteado = Math.floor(Math.random() * 150) + 1;

  // Aguarda a rolagem terminar
  setTimeout(() => {
    numberList.style.animation = 'none';
    numberList.innerHTML = `<div class='number-highlight'>${numeroSorteado}</div>`;

    // Reativa o botão após o sorteio
    setTimeout(() => {
      button.disabled = false;
    }, 1000);
  }, 3000);
}

document.getElementById('raffle-button').addEventListener('click', () => {
  const display = document.getElementById('number-display');
  const winnerDisplay = document.getElementById('winner-display');
  display.textContent = '?';
  display.style.animation = 'none';
  winnerDisplay.classList.add('hidden');

  // Simula uma rolagem de números
  let currentNumber = 0;
  const interval = setInterval(() => {
    currentNumber = Math.floor(Math.random() * 200) + 1;
    display.textContent = currentNumber;
  }, 50);

  // Para a rolagem e exibe o número sorteado
  setTimeout(() => {
    clearInterval(interval);
    const finalNumber = Math.floor(Math.random() * 200) + 1;
    display.textContent = finalNumber;
    display.style.animation = 'zoom 0.5s ease-in-out';

    // Exibe o nome do ganhador
    fetch('rifa_participantes.xlsx')
      .then(response => response.text())
      .then(data => {
        const rows = data.split('\n').slice(1);
        const winner = rows.find(row => row.startsWith(finalNumber + ','));
        if (winner) {
          const [, comprado, nome] = winner.split(',');
          if (comprado.trim() === 'Sim') {
            const winnerName = nome.trim();
            const winningNumber = finalNumber;
            setTimeout(() => {
              winnerDisplay.innerHTML = `<span class='winner-name'>${winnerName}</span><br><span class='winning-number'>Número: ${winningNumber}</span>`;
              winnerDisplay.classList.remove('hidden');

              // Remove blur effect
              const body = document.querySelector('body');
              body.classList.remove('blurred');

              // Ensure confetti runs indefinitely
              const confettiLayer = document.createElement('div');
              confettiLayer.className = 'confetti-layer';
              document.body.appendChild(confettiLayer);
              launchConfetti(confettiLayer);
            }, 5000);
          } else {
            winnerDisplay.textContent = 'O número sorteado não foi comprado.';
            winnerDisplay.classList.remove('hidden');
          }
        }
      });
      
    // Apply blur effect
    const body = document.querySelector('body');
    body.classList.add('blurred');
  }, 3000);
});

function launchConfetti(layer) {
  setInterval(() => {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    layer.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, 3000);
  }, 100);
}

// Function to display participant names with fade-in and fade-out animation
function displayThankYouNames(participants) {
  const scrollingNamesDiv = document.getElementById('scrolling-names');
  scrollingNamesDiv.innerHTML = ''; // Clear any existing content

  const nameDisplay = document.createElement('div');
  nameDisplay.className = 'name-display';
  scrollingNamesDiv.appendChild(nameDisplay);

  let index = 0;

  function showNextName() {
    if (participants.length === 0) return;

    const participant = participants[index];
    if (participant.Comprado === 'Sim' && participant.Nome) {
      nameDisplay.textContent = participant.Nome;
      nameDisplay.classList.remove('fade-out');
      nameDisplay.classList.add('fade-in');

      setTimeout(() => {
        nameDisplay.classList.remove('fade-in');
        nameDisplay.classList.add('fade-out');
      }, 3000); // Keep the name visible for 3 seconds

      index = (index + 1) % participants.length;
    } else {
      index = (index + 1) % participants.length;
      showNextName(); // Skip to the next valid participant
    }
  }

  setInterval(showNextName, 4000); // Cycle every 4 seconds
  showNextName();
}

// Fetch participant data from the Excel file and display the thank-you names
async function fetchAndDisplayThankYouNames() {
  try {
    const response = await fetch('rifa_participantes.xlsx');
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const participants = XLSX.utils.sheet_to_json(sheet);

    displayThankYouNames(participants);
  } catch (error) {
    console.error('Error fetching or processing the Excel file:', error);
  }
}

// Initialize the thank-you names display
fetchAndDisplayThankYouNames();

async function fetchAndDisplayNames() {
  try {
    const response = await fetch('rifa_participantes.xlsx');
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', codepage: 65001 }); // Ensure UTF-8 decoding
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const participants = XLSX.utils.sheet_to_json(sheet, { raw: false }); // Decode text properly

    // Filter participants who purchased and remove duplicates by name
    const uniqueParticipants = Array.from(
      new Map(
        participants
          .filter(p => p.Comprado === 'Sim' && p.Nome)
          .map(p => [p.Nome, p]) // Use Map to ensure uniqueness by name
      ).values()
    );

    let shuffledNames = shuffleArray(uniqueParticipants);

    const nameDisplay = document.getElementById('name-display');

    function showNextName() {
      if (shuffledNames.length === 0) {
        // Reshuffle names when all have been shown
        shuffledNames = shuffleArray(uniqueParticipants);
      }

      const participant = shuffledNames.shift(); // Get the next name
      nameDisplay.textContent = participant.Nome;
      nameDisplay.classList.remove('fade-out');
      nameDisplay.classList.add('fade-in');

      setTimeout(() => {
        nameDisplay.classList.remove('fade-in');
        nameDisplay.classList.add('fade-out');

        const randomDelay = Math.random() * (2500 - 1500) + 1500; // Random delay between 1.5-2.5 seconds
        setTimeout(showNextName, randomDelay);
      }, 1500); // Keep the name visible for 1.5 seconds
    }

    showNextName();
  } catch (error) {
    console.error('Error fetching or processing the Excel file:', error);
  }
}

// Helper function to shuffle an array
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Initialize the name display
fetchAndDisplayNames();