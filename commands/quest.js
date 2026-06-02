const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas'); 
const { loadLeaderboard, saveLeaderboard, loadAsset, checkBattlePassLevelUp } = require('../utils/helpers');
const config = require('../config');

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

module.exports = {
    name: 'quest',
    aliases: ['küldetés', 'mission'],
    async execute(message, args, client, leaderboard) {
        const userId = message.author.id;
        const userName = message.author.username; 
        let lb = loadLeaderboard();

        // Lekérjük a felhasználó profilképét (avatarját)
        const avatarUrl = message.author.displayAvatarURL({ extension: 'png', size: 256 });
        const userAvatar = await loadImage(avatarUrl).catch(() => null); 

        const today = new Date().toLocaleDateString('hu-HU', { timeZone: 'Europe/Budapest' });
        
        // Energia éjféli reset
        if (lb[userId].energy === undefined) lb[userId].energy = 100;
        if (lb[userId].lastRefill !== today) { 
            lb[userId].energy = 100; 
            lb[userId].lastRefill = today; 
            saveLeaderboard(lb); 
        }

        // --- NAPI FELADATOK INICIALIZÁLÁSA BIZTONSÁGBÓL ---
        // Ha a játékos a !daily előtt írná be a !quest parancsot, itt is létrehozzuk a napi tárolóját
        if (!lb[userId].dailyTasks || lb[userId].lastDailyTasksDate !== today) {
            lb[userId].dailyTasks = {
                questsDone: 0,   
                splashesUsed: 0, 
                xpEarned: 0,     
                claimed: [false, false, false]
            };
            lb[userId].lastDailyTasksDate = today;
            saveLeaderboard(lb);
        }

        // 4 KÜLDETÉS - Növelt loot és 0% failChance az elsőnél
        const quests = [
            { 
                id: 'q0', name: 'OPERATION: RUTIN', 
                desc: 'Teljesen biztonságos felderítő küldetés. Nincs kockázat, garantált a siker.', 
                cost: 10, pt: getRandomInt(25, 65), xp: getRandomInt(15, 35), failChance: 0, color: '#a35cff' 
            }, 
            { 
                id: 'q1', name: 'OPERATION: SZEKTOR', 
                desc: 'Fegyveres konfliktus várható a szektorban. A jutalom csábító, de fel kell készülnöd a lehetséges kudarcra.', 
                cost: 20, pt: getRandomInt(70, 140), xp: getRandomInt(35, 70), failChance: 25, color: '#a35cff' 
            }, 
            { 
                id: 'q2', name: 'OPERATION: CITADELLA', 
                desc: 'Extrém veszélyes rajtaütés a főellenség bázisán. A bukás esélye hatalmas, de a sikeres akció legendás vagyont hoz.', 
                cost: 35, pt: getRandomInt(150, 260), xp: getRandomInt(75, 120), failChance: 45, color: '#a35cff' 
            },
            { 
                id: 'q3', name: 'OPERATION: OMEGA', 
                desc: 'Szigorúan titkos, öngyilkos küldetés a dimenzió peremén. Csak a legbátrabbak térnek vissza élve.', 
                cost: 50, pt: getRandomInt(300, 500), xp: getRandomInt(150, 250), failChance: 65, color: '#a35cff' 
            }
        ];

        let selectedIndex = 0; 

        const generateUI = async (activeIndex, currentEnergy) => {
            const canvas = createCanvas(1000, 520);
            const ctx = canvas.getContext('2d');
            const activeQuest = quests[activeIndex];
            
            // --- SEGÉDFÜGGVÉNY: DÖNTÖTT DOBOZ ---
            const drawSkewedBox = (x, y, w, h, skew, isFill = true, isStroke = true) => {
                ctx.beginPath();
                ctx.moveTo(x + skew, y);               
                ctx.lineTo(x + w + skew, y);           
                ctx.lineTo(x + w, y + h);              
                ctx.lineTo(x, y + h);                  
                ctx.closePath();
                if (isFill) ctx.fill();
                if (isStroke) ctx.stroke();
            };

            // 1. Háttér
            const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGrad.addColorStop(0, '#13002b');
            bgGrad.addColorStop(1, '#270054');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Neon keret effekt
            ctx.strokeStyle = 'rgba(163, 92, 255, 0.3)';
            ctx.lineWidth = 4;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            
            // --- BAL OLDAL: MENÜ ---
            ctx.shadowColor = '#a35cff';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#ffffff'; 
            ctx.font = 'italic bold 32px HostingSansBold';
            ctx.fillText('KÜLDETÉSEK', 40, 60);
            ctx.shadowBlur = 0; 

            ctx.fillStyle = '#b38cd9'; 
            ctx.font = 'italic bold 14px HostingSansBold';
            ctx.fillText('ELÉRHETŐ CÉLPONTOK', 40, 95);
            
            ctx.strokeStyle = '#a35cff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(45, 105);
            ctx.lineTo(390, 105);
            ctx.stroke();

            // 4 Gomb kirajzolása sűrűbb távolsággal
            quests.forEach((q, i) => {
                const y = 120 + (i * 75); 
                const isSelected = (i === activeIndex);

                ctx.fillStyle = isSelected ? 'rgba(255, 140, 0, 0.8)' : 'rgba(50, 0, 100, 0.4)'; 
                ctx.strokeStyle = isSelected ? '#ffb700' : '#8238cc';
                ctx.lineWidth = isSelected ? 3 : 1;
                
                if (isSelected) {
                    ctx.shadowColor = '#ff8c00';
                    ctx.shadowBlur = 15;
                }
                
                drawSkewedBox(40, y, 350, 60, 15);
                ctx.shadowBlur = 0; 

                ctx.fillStyle = isSelected ? '#ffffff' : '#a35cff';
                drawSkewedBox(40, y, 6, 60, 15, true, false);

                ctx.fillStyle = isSelected ? '#1a0033' : '#ffffff';
                ctx.font = 'italic bold 22px HostingSansBold';
                ctx.fillText(q.name, 75, y + 28);

                ctx.fillStyle = isSelected ? '#4a2500' : '#b38cd9';
                ctx.font = 'italic bold 14px HostingSansBold';
                ctx.fillText(`ENERGIA: ${q.cost}`, 75, y + 48);
            });

            // --- JOBB OLDAL: RÉSZLETEK ---
            const rightX = 460;
            
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 5;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'italic bold 32px HostingSansBold';
            ctx.fillText(activeQuest.name, rightX, 60);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#b38cd9';
            ctx.font = '16px HostingSans';
            const words = activeQuest.desc.split(' ');
            let line = '';
            let lineY = 100;
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > 480 && n > 0) {
                    ctx.fillText(line, rightX, lineY);
                    line = words[n] + ' ';
                    lineY += 25;
                } else { line = testLine; }
            }
            ctx.fillText(line, rightX, lineY);

            const rewardsY = lineY + 40;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'italic bold 18px HostingSansBold';
            ctx.fillText('JUTALMAK', rightX, rewardsY);
            
            // --- HUD ÖSSZEKÖTŐ VONAL ---
            const activeButtonY = 120 + (activeIndex * 75);
            const startX = 398; 
            const startY = activeButtonY + 30; 

            ctx.strokeStyle = '#ffb700'; 
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ff8c00';
            ctx.shadowBlur = 10; 

            ctx.beginPath();
            ctx.moveTo(startX, startY); 
            ctx.lineTo(430, startY);    
            ctx.lineTo(430, rewardsY + 10); 
            ctx.lineTo(rightX + 480, rewardsY + 10); 
            ctx.stroke();
            ctx.shadowBlur = 0; 

            const stats = [
                { title: 'TAPASZTALAT', val: `+${activeQuest.xp}`, color: '#ff8c00' },
                { title: 'SZIGET PONT', val: `+${activeQuest.pt}`, color: '#00ffcc' },
                { title: 'ENERGIA', val: `-${activeQuest.cost}`, color: '#a35cff' },
                { title: 'KOCKÁZAT', val: `${activeQuest.failChance}%`, color: '#ff0055' }
            ];

            stats.forEach((stat, i) => {
                const isRightCol = i % 2 !== 0;
                const rx = rightX + (isRightCol ? 240 : 0);
                const ry = rewardsY + 30 + (Math.floor(i / 2) * 70);

                ctx.fillStyle = 'rgba(50, 0, 100, 0.4)';
                ctx.strokeStyle = '#8238cc';
                ctx.lineWidth = 1;
                drawSkewedBox(rx, ry, 210, 50, 10);

                ctx.fillStyle = stat.color;
                drawSkewedBox(rx, ry, 8, 50, 10, true, false);

                ctx.fillStyle = '#b38cd9';
                ctx.font = 'italic bold 12px HostingSansBold';
                ctx.fillText(stat.title, rx + 25, ry + 20);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'italic bold 20px HostingSansBold';
                ctx.fillText(stat.val, rx + 25, ry + 42);
            });

            // --- FELHASZNÁLÓ PROFILJA ÉS ENERGIA-CSÍK ---
            const avatarRadius = 35; 
            const avatarX = rightX + avatarRadius; 
            const avatarY = 445;

            if (userAvatar) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(userAvatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
                ctx.restore();

                ctx.strokeStyle = '#a35cff';
                ctx.lineWidth = 3; 
                ctx.beginPath();
                ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
                ctx.stroke();
            }

            const energyBarX = avatarX + avatarRadius + 25; 
            const energyBarY = 445; 
            const energyBarWidth = 950 - energyBarX; 
            const energyBarHeight = 22;
            const filledWidth = Math.max(0, Math.min((currentEnergy / 100) * energyBarWidth, energyBarWidth));

            ctx.fillStyle = '#ffffff';
            ctx.font = 'italic bold 15px HostingSansBold'; 
            ctx.fillText(`${userName.toUpperCase()} - ENERGIÁD: ${currentEnergy}/100`, energyBarX + 10, energyBarY - 8);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.strokeStyle = '#8238cc';
            drawSkewedBox(energyBarX, energyBarY, energyBarWidth, energyBarHeight, 10);

            ctx.fillStyle = '#d4af37'; 
            if (filledWidth > 0) {
                drawSkewedBox(energyBarX, energyBarY, filledWidth, energyBarHeight, 10, true, false);
            }

            // Gombok beállítása
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('sel_0').setLabel('1️⃣').setStyle(activeIndex === 0 ? ButtonStyle.Primary : ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('sel_1').setLabel('2️⃣').setStyle(activeIndex === 1 ? ButtonStyle.Primary : ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('sel_2').setLabel('3️⃣').setStyle(activeIndex === 2 ? ButtonStyle.Primary : ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('sel_3').setLabel('4️⃣').setStyle(activeIndex === 3 ? ButtonStyle.Primary : ButtonStyle.Secondary)
            );

            // Nincs emoji a splash gombon
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('start').setLabel('✅ ELFOGADÁS').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('refill').setLabel('💦 Splash (10 V-shard)').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('cancel').setLabel('❌ MÉGSE').setStyle(ButtonStyle.Danger)
            );

            return {
                files: [new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'quest.png' })],
                components: [row1, row2] 
            };
        };

        const initialUI = await generateUI(selectedIndex, lb[userId].energy);
        const msg = await message.reply(initialUI);
        
        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 90000 });
        
        collector.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: '❌ Ez az interfész nem neked szól!', ephemeral: true });
            
            let currentLb = loadLeaderboard();
            
            if (i.customId === 'cancel') {
                await i.update({ content: '❌ **Küldetés interfész bezárva.**', components: [], files: [] });
                collector.stop('cancelled');
                return;
            }

            if (i.customId.startsWith('sel_')) {
                selectedIndex = parseInt(i.customId.split('_')[1]);
                const newUI = await generateUI(selectedIndex, currentLb[userId].energy);
                return i.update(newUI);
            }
            
            // --- SPLASH VÁSÁRLÁSA ---
            if (i.customId === 'refill') {
                if (currentLb[userId].vshard < 10) return i.reply({ content: '❌ Nincs elég V-shard egy Splash-hez!', ephemeral: true });
                if (currentLb[userId].energy >= 100) return i.reply({ content: '⚠️ Teljesen tele vagy energiával!', ephemeral: true });
                
                currentLb[userId].vshard -= 10; 
                currentLb[userId].energy = Math.min(100, currentLb[userId].energy + 20);
                
                // --- NAPI FELADAT HALADÁS NÖVELÉSE (Splash használat) ---
                if (currentLb[userId].dailyTasks) {
                    currentLb[userId].dailyTasks.splashesUsed += 1;
                }

                saveLeaderboard(currentLb);
                
                const updatedUI = await generateUI(selectedIndex, currentLb[userId].energy);
                return i.update(updatedUI);
            }

            // --- KÜLDETÉS INDÍTÁSA ---
            if (i.customId === 'start') {
                const quest = quests[selectedIndex];

                if (currentLb[userId].energy < quest.cost) return i.reply({ content: `❌ Nincs elég energiád! (Szükséges: ${quest.cost} ⚡)`, ephemeral: true });

                currentLb[userId].energy -= quest.cost;
                currentLb[userId].questCounter += 1;
                
                const rng = Math.floor(Math.random() * 100) + 1;
                const isFailed = quest.failChance > 0 && rng <= quest.failChance;

                if (isFailed) {
                    saveLeaderboard(currentLb);
                    return i.update({ 
                        content: `💀 **${quest.name} ELBUKVA!**\nA küldetés során kritikus hiba lépett fel. Elvesztettél ${quest.cost} Energiát, de nem szereztél semmit. (Maradék: ${currentLb[userId].energy}/100 ⚡)`, 
                        components: [], files: [] 
                    });
                }

                // Siker esetén XP és Pont növelése
                currentLb[userId].points += quest.pt;
                currentLb[userId].xp += quest.xp;

                // --- NAPI FELADATOK HALADÁS NÖVELÉSE (Küldetés és XP) ---
                if (currentLb[userId].dailyTasks) {
                    currentLb[userId].dailyTasks.questsDone += 1;
                    currentLb[userId].dailyTasks.xpEarned += quest.xp;
                }

                saveLeaderboard(currentLb);
                
                await i.update({ 
                    content: `✅ **${quest.name} SIKERES!**\nJutalom: +${quest.pt} PT és +${quest.xp} XP. (Maradék energia: ${currentLb[userId].energy}/100 ⚡)`, 
                    components: [], files: [] 
                });
                
                checkBattlePassLevelUp(message, userId, client);
                collector.stop('started');
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                msg.edit({ content: '⏱️ **Az interfész lezárult.** Írd be újra a `!quest` parancsot!', components: [] }).catch(() => {});
            }
        });
    }
};
