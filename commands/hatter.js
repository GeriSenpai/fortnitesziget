const { saveLeaderboard } = require('../utils/helpers');
module.exports = {
    name: 'hatter',
    aliases: ['háttér'],
    async execute(message, args, client, leaderboard) {
        const userId = message.author.id;
        if (!args[0]) return message.reply(`🎒 Háttereid: \n${leaderboard[userId].inventory.map(b => `• \`${b}\``).join('\n')}`);
        
        const code = args[0].toLowerCase();
        if (!client.config.ELERHETO_HATTEREK[code]) return message.reply('❌ Nincs ilyen háttér!');
        if (!leaderboard[userId].inventory.includes(code)) return message.reply('❌ Nincs meg ez a háttér!');

        leaderboard[userId].activeBackground = code;
        saveLeaderboard(leaderboard);
        message.reply(`✅ Háttér beállítva: **${client.config.ELERHETO_HATTEREK[code].nev}**!`);
    }
};
