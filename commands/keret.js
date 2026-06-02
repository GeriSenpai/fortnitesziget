const { saveLeaderboard } = require('../utils/helpers');
module.exports = {
    name: 'keret',
    async execute(message, args, client, leaderboard) {
        const userId = message.author.id;
        if (!args[0]) return message.reply(`🖼️ Kereteid: \n${leaderboard[userId].borderInventory.map(b => `• \`${b}\``).join('\n')}`);
        
        const code = args[0].toLowerCase();
        if (!client.config.ELERHETO_KERETEK[code]) return message.reply('❌ Nincs ilyen keret!');
        if (!leaderboard[userId].borderInventory.includes(code)) return message.reply('❌ Nincs meg ez a keret!');

        leaderboard[userId].activeBorder = code;
        saveLeaderboard(leaderboard);
        message.reply(`✅ Keret beállítva: **${client.config.ELERHETO_KERETEK[code].nev}**!`);
    }
};
