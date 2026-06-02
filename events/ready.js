module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ Bot online! Bejelentkezve mint: ${client.user.tag}`);
    }
};
