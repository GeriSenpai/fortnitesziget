module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        const channel = member.guild.channels.cache.get(client.config.COUNTER_CHANNEL_ID);
        if (channel) {
            channel.setName(`🏝️Szigetlakos: ${member.guild.memberCount}`).catch(console.error);
        }
    }
};
