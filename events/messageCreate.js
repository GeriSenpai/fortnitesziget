const { loadLeaderboard, saveLeaderboard } = require('../utils/helpers');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        const userId = message.author.id;
        const lb = loadLeaderboard();

        // Ha még nincs profilja, létrehozzuk
        if (!lb[userId]) {
            lb[userId] = { 
                username: message.author.username, points: 0, chestsOpened: 0, 
                inventory: ['alap'], activeBackground: 'alap', borderInventory: ['nincs'], activeBorder: 'nincs', 
                tokens: 0, xp: 0, level: 1, hasPremium: false 
            };
            saveLeaderboard(lb);
        }

        // QTE (Szörny támadás hárítás) Ellenőrzés
        if (client.activeQTE.has(userId) && message.content.toUpperCase() === client.activeQTE.get(userId).code) {
            client.activeQTE.delete(userId);
            message.reply("⚔️ **Sikeres hárítás!** Elkergetted a szörnyet, a küldetés folytatódik!");
            const questCmd = client.commands.get('quest');
            return questCmd.generateQuestAndOfferGamble(message, userId, client);
        }

        // Parancs felismerése a Prefix alapján
        if (!message.content.startsWith(client.config.PREFIX)) return;
        
        const args = message.content.slice(client.config.PREFIX.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return;

        try { 
            await command.execute(message, args, client, lb); 
        } catch (error) { 
            console.error(error); 
            message.reply('❌ Hiba történt a parancs végrehajtása közben!'); 
        }
    }
};
