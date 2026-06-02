const { EmbedBuilder } = require('discord.js');
const { saveLeaderboard } = require('../utils/helpers');

module.exports = {
    name: 'bolt',
    aliases: ['shop'],
    async execute(message, args, client, leaderboard) {
        const userId = message.author.id;
        const shopItems = {
            'fortnite': { name: 'Fortnite Sziget Háttér', type: 'bg', price: 10 },
            'rick': { name: 'Rick és Morty Portál Háttér', type: 'bg', price: 15 },
            'metal': { name: 'Metál Profil Keret', type: 'border', price: 8 },
            'rick_keret': { name: 'Rick Portál Keret', type: 'border', price: 20 }
        };

        if (!args[0]) {
            // A bolt parancsban:
let boltLeiras = `🪙 Jelenlegi egyenleged: **${leaderboard[userId].vshard}** ${client.config.VSHARD_EMOJI}\n\n`;

            for (const [id, item] of Object.entries(shopItems)) { boltLeiras += `| \`${id}\` | **${item.name}** | \`${item.price} TK\` |\n`; }
            return message.channel.send({ embeds: [new EmbedBuilder().setTitle('🛒 KÜLDETÉS BOLT').setDescription(boltLeiras).setColor('#00FFCC')] });
        }

        if (args[0] === 'vasarlas' || args[0] === 'buy') {
            const itemId = args[1];
            if (!itemId || !shopItems[itemId]) return message.reply('❌ Érvénytelen tárgy ID!');
            const item = shopItems[itemId];
            if (leaderboard[userId].tokens < item.price) return message.reply(`❌ Nincs elég Tokened! (Ár: \`${item.price} TK\`)`);
            
            if (item.type === 'bg' && leaderboard[userId].inventory.includes(itemId)) return message.reply('❌ Ezt már megvetted!');
            if (item.type === 'border' && leaderboard[userId].borderInventory.includes(itemId)) return message.reply('❌ Ezt már megvetted!');

            leaderboard[userId].tokens -= item.price;
            item.type === 'bg' ? leaderboard[userId].inventory.push(itemId) : leaderboard[userId].borderInventory.push(itemId);
            saveLeaderboard(leaderboard);
            message.reply(`🎉 Sikeresen megvetted: **${item.name}**! Új egyenleg: \`${leaderboard[userId].tokens} TK\`.`);
        }
    }
};
