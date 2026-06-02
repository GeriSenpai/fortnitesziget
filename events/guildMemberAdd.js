const { loadLeaderboard, saveLeaderboard } = require('../utils/helpers');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        // 1. Tag számláló frissítése
        const channel = member.guild.channels.cache.get(client.config.COUNTER_CHANNEL_ID);
        if (channel) {
            channel.setName(`🏝️Szigetlakos: ${member.guild.memberCount}`).catch(console.error);
        }

        // 2. Adatbázis létrehozása az új tagnak
        let lb = loadLeaderboard();
        if (!lb[member.id]) {
            lb[member.id] = { 
                username: member.user.username, 
                points: 0, 
                vshard: 0,
                energy: 100,           // Kezdő energia
                questCounter: 0,       // Kezdő küldetés számláló
                inventory: ['alap'], 
                activeBackground: 'alap', 
                borderInventory: ['nincs'], 
                activeBorder: 'nincs', 
                xp: 0, 
                level: 1, 
                hasPremium: false 
            };
            saveLeaderboard(lb);
        }
    }
};
