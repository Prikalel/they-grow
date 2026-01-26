// Card Effects System for They Groth

// Negative Cards - These have detrimental effects on your civilization
const negative_cards = [
    {
        name: 'ПОТРЕБЛЕНИЕ',
        description: 'Отнимает столько еды, сколько всего у вас населения. Если еды не хватает вы проиграли.',
        type: 'negative',
        effect_apply: function(gameData) {
            gameData.factions.farming.power -= gameData.stats.population;
            if (gameData.factions.farming.power < 0) {
                gameData.gameOver = true;
            }
            return `Люди съели еду в количестве ${gameData.stats.population}`;
        }
    },
    {
        name: 'ВНЕШНИЙ ДОЛГ',
        description: 'Вы теряете 10 монет из казны.',
        type: 'negative',
        effect_apply: function(gameData) {
            gameData.factions.trade.power -= 10;
            return `Отдан долг в размере 10 монет`;
        }
    },
    {
        name: 'ЭПИДЕМИЯ',
        description: 'Потеря одного случайного человека. Если население станет 0 - проигрыш.',
        type: 'negative',
        effect_apply: function(gameData) {
            let faction = removePersonFromAnyFaction(gameData); // Удаляет случайного человека
            return `Фракция "${faction}" потеряла одного человека`;
        }
    },
    {
        name: 'ВОЙНА',
        description: 'Если военная мощь меньше 5 - проигрыш. Иначе военная мощь сбрасывается до 0.',
        type: 'negative',
        effect_apply: function(gameData) {
            if (gameData.factions.army.power < 5) {
                gameData.factions.army.power = -1;
                gameData.gameOver = true;
            } else {
                gameData.factions.army.power = 0;
            }
            return `Прошла война и вы потеряли все военные силы`;
        }
    },
    {
        name: 'ДЕДОВЩИНА',
        description: 'Если хотя бы 1 человек в армии, вы теряете 3 счастья.',
        type: 'negative',
        effect_apply: function(gameData) {
            if (gameData.factions.army.people.length > 0) {
                gameData.factions.religion.power -= 3;
                return `Кого-то избили. Вы потеряли счастье.`;
            }
            return `В армии никого нет, дедовщина отменяется`;
        }
    },
    {
        name: 'СУХОЙ ГОД',
        description: 'Фермеры теряют половину еды (минимум 1).',
        type: 'negative',
        effect_apply: function(gameData) {
            const lost = Math.max(1, Math.floor(gameData.factions.farming.power / 2));
            gameData.factions.farming.power -= lost;
            return `Из-за засухи пропало ${lost} еды`;
        }
    },
    {
        name: 'БУНТ',
        description: 'Если ваше счастье меньше 5 вы теряете кол-во людей по числу фракций с >2 людей в них.',
        type: 'negative',
        effect_apply: function(gameData) {
            let factionsWithPeopleCount = 0;
            for (const key in gameData.factions) {
                if (gameData.factions[key].people.length >= 2) {
                    factionsWithPeopleCount++;
                }
            }
            const initialFactionsWithPeopleCount = factionsWithPeopleCount;
            if (gameData.factions.religion.power < 5) {
                while (factionsWithPeopleCount > 0) {
                    removePersonFromAnyFaction(gameData);
                    factionsWithPeopleCount--;
                }

                return `В результате бунта погибло ${initialFactionsWithPeopleCount} людей`;
            }
            
            return `Ваше счастье достаточно большое чтобы избежать бунта`;
        }
    },
    {
        name: 'ЭКОНОМИЧЕСКИЙ КРИЗИС',
        description: 'Вы теряете половину своих монет (минимум 1).',
        type: 'negative',
        effect_apply: function(gameData) {
            const lost = Math.max(1, Math.floor(gameData.factions.trade.power / 2));
            gameData.factions.trade.power -= lost;
            return `Рынок рухнул и вы потеряли бюджет казны в размере ${lost} монет`;
        }
    }
];

// Positive Cards - These provide benefits to your civilization
const positive_cards = [
    {
        name: 'ПРОИЗВОДСТВО',
        description: 'Все фракции производят свой ресурс кроме армии.',
        type: 'positive',
        effect_apply: function(gameData) {
            gameData.factions.farming.power += gameData.factions.farming.people.length;
            gameData.factions.trade.power += gameData.factions.trade.people.length;
            gameData.factions.religion.power += gameData.factions.religion.people.length;
            return `Были повышены ресурсы. Армия отдыхает.`;
        }
    },
    {
        name: 'СОБИРАТЕЛЬСТВО',
        description: 'За каждого фермера + 1 еда.',
        type: 'positive',
        effect_apply: function(gameData) {
            gameData.factions.farming.power += gameData.factions.farming.people.length;
            return `Фермеры отработали и дали вам еду + ${gameData.factions.farming.people.length}`;
        }
    },
    {
        name: 'МОБИЛИЗАЦИЯ',
        description: 'Ваша военная мощь теперь равна числу бойцов.',
        type: 'positive',
        effect_apply: function(gameData) {
            gameData.factions.army.power = gameData.factions.army.people.length;
            return `Солдаты начистили стволы`;
        }
    },
    {
        name: 'РОЖДЕНИЕ',
        description: 'У вас появляется новый человек.',
        type: 'positive',
        effect_apply: function(gameData) {
            addPersonToFaction(gameData, 'army');
            return "Новый персонаж попал в армию";
        }
    },
    {
        name: 'УРОЖАЙ',
        description: 'Фермеры производят двойное количество еды но это им стоит больших усилий.',
        type: 'positive',
        effect_apply: function(gameData) {
            const produced = gameData.factions.farming.people.length * 2;
            gameData.factions.farming.power += produced;
            gameData.factions.religion.power = 0;
            return `Урожай был богатым! Фермеры дали +${produced} еды но счастье обнулилось`;
        }
    },
    {
        name: 'ТОРГОВЛЯ',
        description: 'За каждого торговца вы получаете 5 монет.',
        type: 'positive',
        effect_apply: function(gameData) {
            const gained = gameData.factions.trade.people.length * 5;
            gameData.factions.trade.power += gained;
            return `Торговцы принесли +${gained} монет`;
        }
    },
    {
        name: 'МОЛИТВА',
        description: 'Жрецы производят двойное счастье.',
        type: 'positive',
        effect_apply: function(gameData) {
            const gained = gameData.factions.religion.people.length * 2;
            gameData.factions.religion.power += gained;
            return `Молитва принесла +${gained} счастья`;
        }
    }
];

// Neutral Cards - These have mixed or balanced effects
const neutral_cards = [
    {
        name: 'РОЖДЕНИЕ',
        description: 'У вас появляется новый человек но вы теряете 2 еды. Если еды не хватает - ничего не происходит.',
        type: 'neutral',
        effect_apply: function(gameData) {
            if (gameData.factions.farming.power >= 2) {
                gameData.factions.farming.power -= 2;
                addPersonToFaction(gameData, 'army');
                return "Новый персонаж попал в армию";
            }
            return "Вам не хватило еды чтобы родить нового человека 😭";
        }
    },
    {
        name: 'РАССТРЕЛ',
        description: 'Потеря одного случайного человека. Плюс 1 к военной мощи. Вы проиграете если это был последний тип.',
        type: 'neutral',
        effect_apply: function(gameData) {
            let faction = removePersonFromAnyFaction(gameData); // Удаляет случайного человека
            gameData.factions.army.power += 1;
            return `Фракция "${faction}" потеряла одного человека в результате расстрела`;
        }
    },
    {
        name: 'ЭНТУЗИАЗМ',
        description: 'Если у вас счастье больше 5 то фермеры производят еду.',
        type: 'neutral',
        effect_apply: function(gameData) {
            if (gameData.factions.religion.power > 5) {
                gameData.factions.farming.power += gameData.factions.farming.people.length;
                return `Фермеры отработали и дали вам еду + ${gameData.factions.farming.people.length}`;
            }
            return `Ваше счастье меньше 5 и фермеры отказались работать сверхурочно 😭`;
        }
    },
    {
        name: 'НАЛОГ',
        description: 'Вы получаете +1 монету за каждого человека, но теряете 1 счастье. Вы проиграете если счастья недостаточно.',
        type: 'neutral',
        effect_apply: function(gameData) {
            const number = gameData.stats.population;
            gameData.factions.trade.power += number;
            gameData.factions.religion.power -= 1;
            return `Вы получили монет +${number}`;
        }
    },
    {
        name: 'НАБОР',
        description: 'Если у вас 5+ монет, теряете 5 монет и получаете +1 военную мощь.',
        type: 'neutral',
        effect_apply: function(gameData) {
            if (gameData.factions.trade.power >= 5) {
                gameData.factions.trade.power -= 5;
                gameData.factions.army.power += 1;
                return `Армия усилена за 5 монет`;
            }
            return `Недостаточно бюджета для набора новобранцев 😭`;
        }
    },
    {
        name: 'ОБМЕН',
        description: 'На все свои денежные ресурсы вы покупаете еду по тарифу 1к1.',
        type: 'neutral',
        effect_apply: function(gameData) {
            const number = gameData.factions.trade.power;
            gameData.factions.farming.power += number;
            gameData.factions.trade.power = 0;
            return `Вы купили еду +${number}`;
        }
    },
    {
        name: 'ПОДНОШЕНИЯ',
        description: 'Теряете 3 еды, получаете +2 к счастью. Если не хватит - ничего не происходит.',
        type: 'neutral',
        effect_apply: function(gameData) {
            if (gameData.factions.farming.power >= 3) {
                gameData.factions.farming.power -= 3;
                gameData.factions.religion.power += 2;
                return `Подношения принесли +2 к счастью`;
            }
            return `Недостаточно еды для подношений 😭`;
        }
    }
];

// Helper function to create a new person
function createPerson(gameData) {
    gameData.stats.population += 1;
    return {
        id: gameData.people.nextId++
    };
}

// Helper function to add a person to a faction
function addPersonToFaction(gameData, factionKey) {
    const person = createPerson(gameData);
    gameData.factions[factionKey].people.push(person);
    return person;
}

/**
 * <returns>Название фракции откуда забрали человека.</returns>
 */ 
function removePersonFromAnyFaction(gameData) {
    // Find any faction with people
    const factionsWithPeople = [];
    for (const key in gameData.factions) {
        if (gameData.factions[key].people.length > 0) {
            factionsWithPeople.push(key);
        }
    }
    
    if (factionsWithPeople.length === 0) {
        // No people in any faction
        gameData.stats.population = 0;
        gameData.gameOver = true;
        return null;
    }
    
    // Select random faction with people
    const randomFactionKey = factionsWithPeople[Math.floor(Math.random() * factionsWithPeople.length)];
    
    // Remove the last person from that faction
    gameData.factions[randomFactionKey].people.pop();
    gameData.stats.population -= 1;
    
    // Check if population reached 0
    if (gameData.stats.population <= 0) {
        gameData.gameOver = true;
    }
    
    return gameData.factions[randomFactionKey].name;
}
