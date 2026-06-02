const { EmbedBuilder } = require('discord.js');
const { saveLeaderboard } = require('../utils/helpers');

module.exports = {
    name: 'premium',
    aliases: ['prémium'],
    async execute(message, args, client, leaderboard) {
        const userId = message.author.id;
        const lb = leaderboard[userId];

        if (lb.hasPremium) return message.reply("👑 Már van Prémiumod!");
        if (lb.points < 1000) return message.reply(`❌ Nincs elég pontod! Ára: **1000 PT**, neked \`${lb.points} PT\` van.`);

        lb.points -= 1000;
        lb.hasPremium = true;
        saveLeaderboard(leaderboard);

        message.channel.send({ embeds: [new EmbedBuilder().setTitle('👑 PRÉMIUM PASS AKTIVÁLVA!').setDescription(`Gratulálunk, **${message.author.username}**! Megvásároltad a Premium Pass-t!`).setColor('#FFD700')] });
    }
};
