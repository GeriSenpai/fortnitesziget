const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    name: 'help',
    aliases: ['segítség', 'parancsok', 'cmds', 'h'],
    async execute(message, args, client) {
        
        // --- 1. EMBED LÉTREHOZÁSA ÉS DIZÁJN ---
        const helpEmbed = new EmbedBuilder()
            .setColor('#a35cff') // A quest parancsból ismert neon lila
            .setAuthor({ 
                name: '⚜️ DIMENZIÓ KÖZPONT | Rendszer Parancsok', 
                iconURL: client.user.displayAvatarURL() // A bot saját profilképe
            })
            .setDescription('Üdvözöllek az ügynökség hálózatában! Itt találod a hozzáférésedhez mérten elérhető összes parancsot.\n\nKattints a megfelelő kategóriákra a részletekért!')
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true })) // A lekérdező játékos profilképe
            .addFields(
                { 
                    name: '⚡ KÜLDETÉSEK ÉS GAZDASÁG', 
                    value: '`!quest` - Megnyitja a dimenzió missziók HUD-ját.\n`!bal` - Lekérdezi az aktuális egyenleged és V-shardjaid.\n`!daily` - Napi bejelentkezési jutalom átvétele.', 
                    inline: false 
                },
                { 
                    name: '📊 STATISZTIKA ÉS BATTLEPASS', 
                    value: '`!bp` - Megjeleníti a jelenlegi Battlepass szintedet.\n`!leaderboard` - A szerver legjobb ügynökeinek ranglistája.\n`!profile` - Részletes statisztikád megtekintése.', 
                    inline: false 
                },
                { 
                    name: '🛠️ EGYÉB PARANCSOK', 
                    value: '`!ping` - A hálózat válaszidejének mérése.\n`!help` - Ezt a panelt hozza be.', 
                    inline: false 
                }
            )
            .setImage('https://i.imgur.com/8Q9O2Bw.png') // Ide tehetsz egy menő elválasztó csíkot vagy bannert! (Ez egy átlátszó lila vonal)
            .setFooter({ 
                text: `Lekérdezte: ${message.author.username} | Biztonsági szint: Zöld`, 
                iconURL: message.author.displayAvatarURL() 
            })
            .setTimestamp();

        // --- 2. GOMBOK HOZZÁADÁSA (Pl. bezárás gomb) ---
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('delete_help')
                .setLabel('❌ Panel Bezárása')
                .setStyle(ButtonStyle.Danger)
        );

        // --- 3. ÜZENET ELKÜLDÉSE ---
        const helpMessage = await message.reply({ embeds: [helpEmbed], components: [row] });

        // --- 4. GOMB FIGYELÉSE (Collector) ---
        const collector = helpMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async i => {
            // Csak az nyomhatja meg a gombot, aki lekérte a helpet
            if (i.user.id !== message.author.id) {
                return i.reply({ content: '❌ Ezt a panelt nem te nyitottad meg!', ephemeral: true });
            }

            if (i.customId === 'delete_help') {
                await helpMessage.delete().catch(() => {});
            }
        });

        collector.on('end', () => {
            // Ha lejár a 60 másodperc, eltüntetjük a gombot, hogy ne zavarjon
            helpMessage.edit({ components: [] }).catch(() => {});
        });
    }
};
