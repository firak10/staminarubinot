// Máscara automática para o input HH:MM
document.getElementById('currentStamina').addEventListener('input', function(e) {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length >= 2) {
        e.target.value = v.substring(0, 2) + ':' + v.substring(2, 4);
    } else {
        e.target.value = v;
    }
});

function formatDuration(totalRealMinutes) {
    if (totalRealMinutes <= 0) return "Já atingido";
    const hours = Math.floor(totalRealMinutes / 60);
    const minutes = Math.round(totalRealMinutes % 60);
    if (hours === 0) return `${minutes} min`;
    return `${hours}h ${minutes}min`;
}

function formatExactTime(futureMinutes) {
    if (futureMinutes <= 0) return "Agora";
    const now = new Date();
    const futureDate = new Date(now.getTime() + futureMinutes * 60 * 1000);
    return futureDate.toLocaleDateString('pt-BR', {
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
    });
}

function calculateStamina() {
    const timeStr = document.getElementById('currentStamina').value;
    const parts = timeStr.split(':');
    
    if (parts.length !== 2 || parts[0] === "" || parts[1] === "" || parts[1].length < 2) {
        alert("Por favor, digite a stamina no formato correto (HH:MM). Exemplo: 35:30");
        return;
    }

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const currentMins = (hours * 60) + minutes;

    const MAX_STAMINA = 42 * 60;   // 2520 mins
    const GREEN_STAMINA = 39 * 60; // 2340 mins
    const POTION_GAIN = 60;        // 60 mins (1 hora)

    if (currentMins > MAX_STAMINA || minutes >= 60) {
        alert("Stamina inválida! O limite máximo do jogo é 42:00.");
        return;
    }

    const usePotion = document.getElementById('usePotion').checked;

    // Taxas de Regeneração baseadas nas regras do Rubinot
    const ratesLaranja = { off: 3, pz: 3, train: 6 };
    const ratesVerde = { off: 6, pz: 5, train: 6 };

    // Função interna para processar os tempos por método
    function getMethodTimes(rateL, rateV) {
        let minsToGreen = Math.max(0, GREEN_STAMINA - currentMins);
        let minsToFullFromGreen = Math.max(0, MAX_STAMINA - Math.max(GREEN_STAMINA, currentMins));

        // Aplicação inteligente da poção focando na Stamina Verde (pior taxa)
        if (usePotion) {
            if (minsToFullFromGreen >= POTION_GAIN) {
                minsToFullFromGreen -= POTION_GAIN;
            } else {
                let remainder = POTION_GAIN - minsToFullFromGreen;
                minsToFullFromGreen = 0;
                minsToGreen = Math.max(0, minsToGreen - remainder);
            }
        }

        let realMinsToGreen = minsToGreen * rateL;
        let realMinsToFull = realMinsToGreen + (minsToFullFromGreen * rateV);

        return { toGreen: realMinsToGreen, toFull: realMinsToFull };
    }

    // Calcula os tempos para cada cenário
    const pzTimes = getMethodTimes(ratesLaranja.pz, ratesVerde.pz);
    const offTimes = getMethodTimes(ratesLaranja.off, ratesVerde.off);
    const trainTimes = getMethodTimes(ratesLaranja.train, ratesVerde.train);

    // Injeta os dados da Zona de Proteção (PZ)
    document.getElementById('pzToGreen').innerText = formatDuration(pzTimes.toGreen);
    document.getElementById('datePzToGreen').innerText = formatExactTime(pzTimes.toGreen);
    document.getElementById('pzToFull').innerText = formatDuration(pzTimes.toFull);
    document.getElementById('datePzToFull').innerText = formatExactTime(pzTimes.toFull);

    // Injeta os dados Offline
    document.getElementById('offToGreen').innerText = formatDuration(offTimes.toGreen);
    document.getElementById('dateOffToGreen').innerText = formatExactTime(offTimes.toGreen);
    document.getElementById('offToFull').innerText = formatDuration(offTimes.toFull);
    document.getElementById('dateOffToFull').innerText = formatExactTime(offTimes.toFull);

    // Injeta os dados do Trainer
    document.getElementById('trainToGreen').innerText = formatDuration(trainTimes.toGreen);
    document.getElementById('dateTrainToGreen').innerText = formatExactTime(trainTimes.toGreen);
    document.getElementById('trainToFull').innerText = formatDuration(trainTimes.toFull);
    document.getElementById('dateTrainToFull').innerText = formatExactTime(trainTimes.toFull);

    // Renderiza e atualiza o quadro de conselhos da poção
    const potionAdviceEl = document.getElementById('potionAdvice');
    if (usePotion) {
        if (currentMins + POTION_GAIN > MAX_STAMINA) {
            potionAdviceEl.style.borderLeft = "4px solid var(--accent-orange)";
            potionAdviceEl.style.color = "#ffb74d";
            potionAdviceEl.style.backgroundColor = "rgba(255, 145, 0, 0.05)";
            potionAdviceEl.innerHTML = `⚠️ <strong>Aviso de Desperdício:</strong> Usar a poção em ${timeStr} vai estourar o limite máximo de 42:00. Use apenas quando estiver abaixo de 41:00!`;
        } else if (currentMins < GREEN_STAMINA) {
            potionAdviceEl.style.borderLeft = "4px solid var(--primary-color)";
            potionAdviceEl.style.color = "#a0e6b7";
            potionAdviceEl.style.backgroundColor = "rgba(0, 230, 118, 0.05)";
            potionAdviceEl.innerHTML = `💡 <strong>Estratégia Otimizada:</strong> O sistema guardou o efeito da poção automaticamente para mitigar a perda na <strong>Stamina Verde</strong>, poupando o tempo de regeneração mais lento!`;
        } else {
            potionAdviceEl.style.borderLeft = "4px solid var(--primary-color)";
            potionAdviceEl.style.color = "#a0e6b7";
            potionAdviceEl.style.backgroundColor = "rgba(0, 230, 118, 0.05)";
            potionAdviceEl.innerHTML = `✅ <strong>Poção Aplicada:</strong> Como você já está na stamina verde, a poção abateu diretamente 1 hora do tempo de regeneração mais demorado.`;
        }
    } else {
        potionAdviceEl.style.borderLeft = "4px solid var(--accent-blue)";
        potionAdviceEl.style.color = "#80d8ff";
        potionAdviceEl.style.backgroundColor = "rgba(0, 176, 255, 0.05)";
        potionAdviceEl.innerHTML = `🧠 <strong>Dica de Eficiência:</strong> Prefira utilizar suas poções de stamina quando estiver na faixa verde (acima de 39:00). Como a regeneração nessa faixa é pior, usar a poção ali evita passar horas esperando o tempo mais lento passar!`;
    }

    document.getElementById('resultsBox').classList.add('active');
}