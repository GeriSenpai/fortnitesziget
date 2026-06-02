const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas'); 
const { loadLeaderboard, saveLeaderboard } = require('../utils/helpers');

module.exports = {
    name: 'base',
    aliases: ['bázis', 'város', 'erőd'],
    async execute(message, args, client) {
        const userId = message.author.id;
        const userName = message.author.username; 
        let lb = loadLeaderboard();

        if (!lb[userId].base) {
            lb[userId].base = {
                hqLevel: 1,
                shardGenLevel: 1,
                ptGenLevel: 1,
                lastClaim: Date.now() 
            };
            saveLeaderboard(lb);
        }

        let baseData = lb[userId].base;

        let timeDiffMinutes = Math.floor((Date.now() - baseData.lastClaim) / 60000);
        if (timeDiffMinutes < 0) timeDiffMinutes = 0;

        const shardPerMinute = baseData.shardGenLevel * 0.1; 
        const ptPerMinute = baseData.ptGenLevel * 2;         

        const maxShardStorage = baseData.shardGenLevel * 100;
        const maxPtStorage = baseData.ptGenLevel * 2000;

        let uncollectedShards = Math.floor(timeDiffMinutes * shardPerMinute);
        let uncollectedPt = Math.floor(timeDiffMinutes * ptPerMinute);
        
        if (uncollectedShards > maxShardStorage) uncollectedShards = maxShardStorage;
        if (uncollectedPt > maxPtStorage) uncollectedPt = maxPtStorage;

        const generateBaseUI = async () => {
            const canvas = createCanvas(1000, 850); // Még nagyobb canvas, hogy elférjen a "3D" kép
            const ctx = canvas.getContext('2d');
            
            // ==========================================
            // 🖼️ SAJÁT KÉPEID (ASSETS) BEÁLLÍTÁSA
            // Ide illeszd be a képeid URL linkjét! (Discord attachment link is tökéletes)
            // ==========================================
            const ASSETS = {
                background: 'https://i.imgur.com/K3Z1x3S.png', // A talaj/terep (háttérkép)
                hqImage: 'https://i.imgur.com/w8N4unY.png',    // Főparancsnokság PNG
                shardImage: 'https://i.imgur.com/uX8W4nB.png', // V-Shard Generátor PNG
                ptImage: 'https://i.imgur.com/7T6mXnU.png'     // Adatbányász PNG
            };

            // 1. Alap háttérszín (Ha nem töltene be a kép)
            ctx.fillStyle = '#13002b';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // ==========================================
            // --- 3D IZOMETRIKUS NÉZET (FELSŐ RÉSZ) ---
            // ==========================================
            const viewHeight = 450; // A felső 450 pixel a képé

            // 1. Háttérkép betöltése és rajzolása
            try {
                const bgImg = await loadImage(ASSETS.background);
                ctx.drawImage(bgImg, 10, 10, canvas.width - 20, viewHeight);
            } catch (e) {
                // Biztonsági sci-fi rács, ha hibás a link
                ctx.strokeStyle = 'rgba(163, 92, 255, 0.2)';
                ctx.lineWidth = 2;
                for (let i = 20; i < canvas.width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 10); ctx.lineTo(i, viewHeight); ctx.stroke(); }
                for (let i = 20; i < viewHeight; i += 50) { ctx.beginPath(); ctx.moveTo(10, i); ctx.lineTo(canvas.width - 10, i); ctx.stroke(); }
            }

            // --- ÉPÜLET RAJZOLÓ FUNKCIÓ (Címkével a tetején) ---
            const drawBuildingImage = async (url, x, y, width, height, name, level, glowColor) => {
                try {
                    const img = await loadImage(url);
                    
                    // Kép rajzolása
                    ctx.shadowColor = glowColor;
                    ctx.shadowBlur = 20; // Ragyogás az épület körül
                    ctx.drawImage(img, x, y, width, height);
                    ctx.shadowBlur = 0;

                    // "Shakes & Fidget" stílusú lebegő névtábla az épület felett
                    const tagText = `${name} (Lv. ${level})`;
                    ctx.font = 'bold 16px HostingSansBold';
                    const textWidth = ctx.measureText(tagText).width;
                    const tagX = x + (width / 2) - (textWidth / 2);
                    const tagY = y - 10;

                    // Névtábla háttere
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.strokeStyle = glowColor;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.roundRect ? ctx.roundRect(tagX - 10, tagY - 20, textWidth + 20, 25, 4) : ctx.rect(tagX - 10, tagY - 20, textWidth + 20, 25);
                    ctx.fill(); ctx.stroke();

                    // Névtábla szövege
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(tagText, tagX, tagY - 3);

                } catch (e) {
                    console.log(`Nem sikerült betölteni az épületet: ${url}`);
                }
            };

            // Épületek rajzolása SORRENDBEN (Háttértől előrefelé, hogy a Z-index jó legyen)
            // 1. HQ (Leghátul, középen)
            await drawBuildingImage(ASSETS.hqImage, 350, 40, 300, 300, 'Főparancsnokság', baseData.hqLevel, '#ffb700');
            
            // 2. PT Bányász (Elöl, balra)
            await drawBuildingImage(ASSETS.ptImage, 100, 200, 220, 220, 'Adatbányász', baseData.ptGenLevel, '#a35cff');
            
            // 3. V-Shard Generátor (Elöl, jobbra)
            await drawBuildingImage(ASSETS.shardImage, 680, 220, 220, 220, 'V-Shard Generátor', baseData.shardGenLevel, '#00ffcc');


            // ==========================================
            // --- ALSÓ HUD INTERFÉSZ (VEZÉRLŐ) ---
            // ==========================================
            const uiStartY = 470;

            const drawSkewedBox = (x, y, w, h, skew, isFill = true, isStroke = true) => {
                ctx.beginPath(); ctx.moveTo(x + skew, y); ctx.lineTo(x + w + skew, y);           
                ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
                if (isFill) ctx.fill(); if (isStroke) ctx.stroke();
            };

            // HUD Fejléc
            ctx.shadowColor = '#a35cff';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#ffffff'; 
            ctx.font = 'italic bold 32px HostingSansBold';
            ctx.fillText('DIMENZIÓ BÁZIS VEZÉRLŐ', 40, uiStartY);
            ctx.shadowBlur = 0; 

            ctx.fillStyle = '#b38cd9'; 
            ctx.font = 'italic bold 14px HostingSansBold';
            ctx.fillText(`PARANCSNOK: ${userName.toUpperCase()}`, 40, uiStartY + 30);
            
            ctx.strokeStyle = '#a35cff';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(40, uiStartY + 40); ctx.lineTo(960, uiStartY + 40); ctx.stroke();

            // Külső főkeret az egész képre
            ctx.strokeStyle = 'rgba(163, 92, 255, 0.4)';
            ctx.lineWidth = 6;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

            // --- ÉPÜLETEK STATISZTIKÁJA ÉS FEJLESZTÉS ---
            const buildings = [
                {
                    name: 'FŐPARANCSNOKSÁG', level: baseData.hqLevel,
                    desc: 'Meghatározza a többi épület maximális szintjét.', stat: `Max Szint Korlát: ${baseData.hqLevel * 5}`,
                    cost: baseData.hqLevel * 1000, costType: 'PT', color: '#ffb700'
                },
                {
                    name: 'V-SHARD GENERÁTOR', level: baseData.shardGenLevel,
                    desc: 'Kozmikus energiát sűrít V-sharddá.', stat: `Termelés: ${Math.floor(shardPerMinute * 60)}/óra | Tárhely: ${uncollectedShards}/${maxShardStorage}`,
                    cost: baseData.shardGenLevel * 500, costType: 'PT', color: '#00ffcc'
                },
                {
                    name: 'ADATBÁNYÁSZ KÖZPONT', level: baseData.ptGenLevel,
                    desc: 'Feltöri a hálózatot extra Sziget Pontokért (PT).', stat: `Termelés: ${Math.floor(ptPerMinute * 60)}/óra | Tárhely: ${uncollectedPt}/${maxPtStorage}`,
                    cost: baseData.ptGenLevel * 5, costType: 'V-Shard', color: '#a35cff'
                }
            ];

            buildings.forEach((b, i) => {
                const y = uiStartY + 60 + (i * 85);
                
                ctx.fillStyle = 'rgba(50, 0, 100, 0.4)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 1;
                drawSkewedBox(40, y, 660, 70, 15);

                ctx.fillStyle = b.color;
                drawSkewedBox(40, y, 8, 70, 15, true, false);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'italic bold 20px HostingSansBold';
                ctx.fillText(b.name, 70, y + 26);
                
                ctx.fillStyle = '#b38cd9';
                ctx.font = 'italic 12px HostingSans';
                ctx.fillText(b.desc, 70, y + 44);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'italic bold 14px HostingSansBold';
                ctx.fillText(b.stat, 70, y + 62);

                const upgX = 720;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                drawSkewedBox(upgX, y, 220, 70, 15);

                ctx.fillStyle = '#b38cd9';
                ctx.font = 'italic bold 12px HostingSansBold';
                ctx.fillText('FEJLESZTÉS ÁRA', upgX + 45, y + 25);

                const hasEnough = (b.costType === 'PT' && (lb[userId].points || 0) >= b.cost) || 
                                  (b.costType === 'V-Shard' && (lb[userId].vshard || 0) >= b.cost);
                
                ctx.fillStyle = hasEnough ? '#ffffff' : '#ff3366';
                ctx.font = 'italic bold 22px HostingSansBold';
                ctx.fillText(`${b.cost} ${b.costType}`, upgX + 45, y + 50);
            });

            // --- BEGYŰJTHETŐ LOOT SÁV ---
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.strokeStyle = '#d4af37'; // Arany keret
            ctx.lineWidth = 2;
            drawSkewedBox(40, 765, 900, 45, 10);

            ctx.fillStyle = '#d4af37';
            ctx.font = 'italic bold 18px HostingSansBold';
            ctx.fillText(`BEGYŰJTHETŐ LOOT: +${uncollectedShards} V-SHARD | +${uncollectedPt} PT`, 70, 793);

            // --- GOMBOK ---
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('claim_base').setLabel('💰 LOOT BEGYŰJTÉSE').setStyle(uncollectedShards > 0 || uncollectedPt > 0 ? ButtonStyle.Success : ButtonStyle.Secondary).setDisabled(uncollectedShards === 0 && uncollectedPt === 0),
                new ButtonBuilder().setCustomId('close_base').setLabel('❌ BEZÁR').setStyle(ButtonStyle.Danger)
            );

            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('upg_hq').setLabel('🏗️ HQ').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('upg_pt').setLabel('🏗️ Adatbányász').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('upg_shard').setLabel('🏗️ Generátor').setStyle(ButtonStyle.Primary)
            );

            return {
                files: [new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'base.png' })],
                components: [row1, row2] 
            };
        };

        const initialUI = await generateBaseUI();
        const msg = await message.reply(initialUI);

        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });

        collector.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: '❌ Ez nem a te bázisod!', ephemeral: true });

            let currentLb = loadLeaderboard();
            let currentBase = currentLb[userId].base;

            if (i.customId === 'close_base') {
                await i.update({ content: '❌ **Bázis panel bezárva.**', components: [], files: [] });
                return collector.stop();
            }

            if (i.customId === 'claim_base') {
                currentLb[userId].vshard = (currentLb[userId].vshard || 0) + uncollectedShards;
                currentLb[userId].points = (currentLb[userId].points || 0) + uncollectedPt;
                currentLb[userId].base.lastClaim = Date.now(); 
                
                saveLeaderboard(currentLb);

                uncollectedShards = 0;
                uncollectedPt = 0;
                baseData.lastClaim = Date.now(); 

                const newUI = await generateBaseUI();
                await i.update(newUI);
                return message.channel.send(`💰 **${message.author.username}** begyűjtötte a bázis termelését!`);
            }

            const hqMaxLevel = currentBase.hqLevel * 5;

            if (i.customId === 'upg_hq') {
                const cost = currentBase.hqLevel * 1000;
                if ((currentLb[userId].points || 0) < cost) return i.reply({ content: '❌ Nincs elég PT a fejlesztéshez!', ephemeral: true });
                currentLb[userId].points -= cost;
                currentLb[userId].base.hqLevel += 1;
            }

            if (i.customId === 'upg_shard') {
                if (currentBase.shardGenLevel >= hqMaxLevel) return i.reply({ content: `❌ Elérted a maximum szintet! Fejleszd a Főparancsnokságot a további építéshez!`, ephemeral: true });
                const cost = currentBase.shardGenLevel * 500;
                if ((currentLb[userId].points || 0) < cost) return i.reply({ content: '❌ Nincs elég PT a fejlesztéshez!', ephemeral: true });
                currentLb[userId].points -= cost;
                currentLb[userId].base.shardGenLevel += 1;
            }

            if (i.customId === 'upg_pt') {
                if (currentBase.ptGenLevel >= hqMaxLevel) return i.reply({ content: `❌ Elérted a maximum szintet! Fejleszd a Főparancsnokságot a további építéshez!`, ephemeral: true });
                const cost = currentBase.ptGenLevel * 5;
                if ((currentLb[userId].vshard || 0) < cost) return i.reply({ content: '❌ Nincs elég V-Shard a fejlesztéshez!', ephemeral: true });
                currentLb[userId].vshard -= cost;
                currentLb[userId].base.ptGenLevel += 1;
            }

            if (i.customId.startsWith('upg_')) {
                saveLeaderboard(currentLb);
                baseData = currentLb[userId].base; 
                const newUI = await generateBaseUI();
                await i.update(newUI);
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                msg.edit({ components: [] }).catch(() => {});
            }
        });
    }
};
