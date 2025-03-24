let gameState = {
    day: 1,
    time: 11,
    hunger: 70,
    thirst: 64,
    health: 100,
    nuts: 0,
    water: 0,
    seeds: 0,
    hasFarm: false,
    barrelsCount: 0,
    hasWaterFilter: false,
    wood: 0,
    stones: 0,
    hasShelter: false,
};

let isSleeping = false;

const TIME_SPEED = 1000; // 1 секунда = 1 игровой час

function updateUI() {
    const isNight = gameState.time >= 18 || gameState.time < 6;
    const timeOfDayElement = document.getElementById('timeOfDay');
    // Обновляем текст и стиль
    timeOfDayElement.textContent = isNight ? 'Ночь' : 'День';
    timeOfDayElement.className = isNight ? 'night-time' : '';

    // Первый столбец
    document.getElementById('day').textContent = gameState.day;
    document.getElementById('timeOfDay').textContent = gameState.time >= 6 && gameState.time < 18 ? 'День' : 'Ночь';
    document.getElementById('hunger').textContent = gameState.hunger.toFixed(1);
    document.getElementById('thirst').textContent = gameState.thirst.toFixed(1);
    document.getElementById('health').textContent = gameState.health.toFixed(1);
    
    // Второй столбец
    document.getElementById('nuts').textContent = gameState.nuts;
    document.getElementById('water').textContent = gameState.water;
    document.getElementById('seeds').textContent = gameState.seeds;
    document.getElementById('wood').textContent = gameState.wood;
    document.getElementById('stones').textContent = gameState.stones;
    
    // Третий столбец (постройки)
    document.getElementById('shelter').textContent = gameState.hasShelter ? "Да" : "Нет";
    document.getElementById('farm').textContent = gameState.hasFarm ? "Да" : "Нет";
    document.getElementById('barrels').textContent = gameState.barrelsCount;
    document.getElementById('waterFilter').textContent = gameState.hasWaterFilter ? "Да" : "Нет";
}

function eat() {
    if (gameState.nuts >= 5) {
        gameState.nuts -= 5;
        gameState.hunger = Math.min(100, gameState.hunger + 20);
        addLog("Вы съели 5 орехов (+20% сытости)");
        passTime(0.1); // На еду уходит 30 минут
    } else {
        addLog("Недостаточно орехов для еды!", false, true);
    }
    updateUI();
}

function drink() {
    if (gameState.water >= 50) {
        gameState.water -= 50;
        gameState.thirst = Math.min(100, gameState.thirst + 30);
        
        // Всегда показываем сообщение о питье
        addLog("Вы выпили 50 мл воды (+30% гидрации)");

        // Проверяем систему очистки
        if (!gameState.hasWaterFilter) {
            const penalty = 3.2;
            gameState.health = Math.max(0, gameState.health - penalty);
            addLog("Выпили грязную воду! -3.2% здоровья", true); // Красное сообщение
        }

        passTime(0.1);
    } else {
        addLog("Недостаточно воды для питья!", false, true);
    }
    updateUI();
}

function addLog(message, isError = false, isWarning = false) {
    const log = document.getElementById('log');
    const messageElement = document.createElement('div');
    
    if (isError) {
        messageElement.className = 'error-message';
    } else if (isWarning) {
        messageElement.className = 'warning-message';
    }
    
    messageElement.textContent = `[День ${gameState.day}] ${message}`;
    log.appendChild(messageElement);
    log.scrollTop = log.scrollHeight;
}

// Игровые механики
function collectNuts() {
    if (gameState.time < 6 || gameState.time >= 18) {
        addLog("Ночью нельзя собирать орехи!", false, true);
        return;
    }
    const nuts = Math.floor(Math.random() * 3) + 1;
    gameState.nuts += nuts;
    addLog(`Собрано ${nuts} орехов!`);
    passTime(1);
}

function searchWater() {
    const water = Math.floor(Math.random() * 30) + 10;
    gameState.water += water;
    addLog(`Найдено ${water} мл воды!`);
    passTime(1);
}

function explore() {
    let foundSomething = false;
    
    // Шанс найти семена (30%)
    if (Math.random() < 0.2) {
        const seeds = Math.floor(Math.random() * 3) + 1;
        gameState.seeds += seeds;
        addLog(`Найдено ${seeds} семян!`);
        foundSomething = true;
    }
    
    // Шанс найти древесину (40%)
    if (Math.random() < 0.3) {
        const wood = Math.floor(Math.random() * 5) + 2;
        gameState.wood += wood;
        addLog(`Найдено ${wood} древесины!`);
        foundSomething = true;
    }
    
    // Шанс найти камни (30%)
    if (Math.random() < 0.3) {
        const stones = Math.floor(Math.random() * 4) + 1;
        gameState.stones += stones;
        addLog(`Найдено ${stones} камней!`);
        foundSomething = true;
    }

    if (!foundSomething) {
        addLog("Ничего не найдено...");
    }
    passTime(3);
}

function sleep() {
    if (gameState.time >= 6 && gameState.time < 18) {
        addLog("Сейчас день! сложно спать днем", true);
        return;
    }

    // Рассчитываем продолжительность сна до рассвета (6:00)
    let hoursToDawn;
    if (gameState.time >= 18) {
        // Если вечер (после 18:00)
        hoursToDawn = 24 - gameState.time + 6;
    } else {
        // Если ночь (до 6:00)
        hoursToDawn = 6 - gameState.time;
    }

    const startHealth = gameState.health;
    isSleeping = true;

    // Защита от хищников если есть укрытие
    if (gameState.hasShelter) {
        addLog(`Вы легли спать до рассвета (${hoursToDawn} часов)...`);
    } else {
        addLog(`Вы спите под открытым небом ${hoursToDawn} часов...`, true);
        checkPredators();
    }

    // Продвижение времени
    passTime(hoursToDawn);
    
    // Устанавливаем точное время рассвета
    gameState.time = 6;
    
    // Восстановление здоровья
    const healthRecovery = gameState.hasShelter ? 
        Math.min(15, hoursToDawn * 2) :  // +2% за час в укрытии
        Math.min(8, hoursToDawn * 1);    // +1% за час без укрытия
        
    gameState.health = Math.min(100, gameState.health + healthRecovery);
    
    addLog(`☀️ Проснулись в 6:00 (+${healthRecovery}% здоровья)`);
    isSleeping = false;
    updateUI();
}

// Функция постройки укрытия
function buildShelter() {
    if (gameState.wood >= 30 && gameState.stones >= 15) {
        gameState.wood -= 30;
        gameState.stones -= 15;
        gameState.hasShelter = true;
        addLog("Укрытие построено! Теперь вы защищены во время сна.");
        updateUI();
    } else {
	addLog("Не хватает ресурсов! Нужно 30 древесины и 15 камней.", false, true);
        updateUI();
    }
}

function buildFarm() {
    if (gameState.nuts >= 20 && gameState.seeds >= 5) {
        gameState.nuts -= 20;
        gameState.seeds -= 5;
        gameState.hasFarm = true;
        addLog("Ферма построена! Теперь орехи растут автоматически.");
    } else {
	addLog("Не хватает ресурсов (нужно 20 орехов и 5 семян)!", false, true);
    }
}

function buildWaterFilter() {
    if (gameState.stones >= 10 && gameState.wood >= 5) {
        gameState.stones -= 10;
        gameState.wood -= 5;
        gameState.hasWaterFilter = true;
        addLog("Система очистки построена! Теперь вода безопасна.");
        updateUI();
    } else {
	addLog("Нужно 10 камней и 5 древесины!", false, true);
    }
}

function buildBarrel() {
    const woodCost = 6;
    
    if (gameState.wood >= woodCost) {
        gameState.wood -= woodCost;
        gameState.barrelsCount++;
        addLog(`Бочка построена! (теперь вода собирается автоматически)`);
        updateUI();
    } else {
	addLog(`Нужно ${woodCost} древесины для постройки бочки!`, false, true);
    }
}

function passTime(hours) {
    gameState.time += hours;
    
    // Обработка перехода через полночь
    while (gameState.time >= 24) {
        gameState.time -= 24;
        gameState.day++;
    }
    
    // Обновление статистики с учетом дробных часов
    gameState.hunger = Math.max(0, gameState.hunger - hours * 0.5);
    gameState.thirst = Math.max(0, gameState.thirst - hours * 0.8);
    
    // Автоматические системы
    if (gameState.hasFarm) gameState.nuts += hours;
    // Автоматический сбор воды (чем больше бочек - тем больше воды)
    if (gameState.time >= 6 && gameState.time < 18) {
        const waterCollected = gameState.barrelsCount * 5 * hours;
        gameState.water += waterCollected;
        if (waterCollected > 0) {
        }
    }
    
    checkPredators();
    checkHealth();
    updateUI();
}

// Обновляем проверку хищников
function checkPredators() {
    // Хищники не нападают только если игрок спит В УБЕЖИЩЕ
    if (isSleeping && gameState.hasShelter) return;

    // Хищники активны только ночью (18:00-6:00)
    if (gameState.time >= 18 || gameState.time < 6) {
        // Шанс нападения 40%
        if (Math.random() < 0.4) {
            const baseDamage = 10;
            const dayMultiplier = 1;
            const damage = baseDamage + dayMultiplier * gameState.day;
            
            gameState.health -= damage;
            addLog(`Ночью на вас напал хищник! Потеряно ${damage}% здоровья! (День ${gameState.day})`, true);
        }
    }
}

function checkHealth() {
    // Потеря здоровья от голода/жажды
    if (gameState.hunger <= 0 || gameState.thirst <= 0) {
        gameState.health -= 35;
        addLog("КРИТИЧЕСКИЙ УРОВЕНЬ ГОЛОДА/ЖАЖДЫ! -35% здоровья", true);
    }

    // Проверка уровней здоровья
    if (gameState.health <= 1) {
        alert("☠️ Ваше здоровье упало до 1%! Смерть неизбежна...");
        location.reload();
        return;
    }
    
    if (gameState.health <= 15) {
        addLog("⚠️ КРИТИЧЕСКОЕ СОСТОЯНИЕ! Здоровье ниже 15%", true);
    }

    // Стандартная проверка смерти
    if (gameState.health <= 0) {
    updateUI();
        alert("Игра окончена! Вы не выжили...");
        location.reload();
    }
}

function initGame() {
    gameState = { // Полная переинициализация
        day: 1,
        time: 11,
        hunger: 70,
        thirst: 64,
        health: 100,
        nuts: 0,
        water: 0,
        seeds: 0,
        hasFarm: false,
        barrelsCount: 0,
        hasWaterFilter: false,
        wood: 0,
        stones: 0,
        hasShelter: false
    };
    addLog("Основные правила:");
    addLog("- Собирайте орехи днем");
    addLog("- Стройте укрытие для защиты от хищников");
    addLog("- Сначала постройте систему очистки воды");
    addLog("победой в игре считается автоматизация получения еды и воды и постройка убежища");
    updateUI();
}

initGame(); // Инициализируем игру с обучающими сообщениями
