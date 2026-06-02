const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('@napi-rs/canvas');
const { loadLeaderboard, saveLeaderboard } = require('../utils/helpers');

module.exports = {
    name: 'daily',
    aliases: ['napi', 'tasks', 'feladatok'],
    async execute(message, args, client) {
        const userId = message.author.id;
        let lb = loadLeaderboard();

        // Napi reset logikája
        const today = new Date().toLocaleDateString('hu-HU', { timeZone: 'Europe/Budapest' });
        
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

        const dailyData = lb[userId].dailyTasks;

        const tasks = [
            { 
                id: 0, title: 'DIMENZIÓ JÁRÓ', desc: 'Teljesíts 3 küldetést a mai nap folyamán.', 
                current: dailyData.questsDone, max: 3, reward: 50, rewardType: 'V-Shard' 
            },
            { 
                id: 1, title: 'FRISSÍTŐ KÖR', desc: 'Vegyél és igyál meg 1 Splash-t a kocsmában.', 
                current: dailyData.splashesUsed, max: 1, reward: 20, rewardType: 'V-Shard' 
            },
            { 
                id: 2, title: 'TAPASZTALT ÜGYNÖK', desc: 'Szerezz 150 Tapasztalati Pontot (XP).', 
                current: dailyData.xpEarned, max: 150, reward: 50, rewardType: 'V-Shard' 
            }
        ];

        // --- UI GENERÁLÁSA (SCI-FI / QUEST.JS STÍLUS) ---
        const generateDailyUI = async () => {
            const canvas = createCanvas(1000, 520);
            const ctx = canvas.getContext('2d');

            // 1. Sötét sci-fi háttér
            const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGrad.addColorStop(0, '#13002b');
            bgGrad.addColorStop(1, '#270054');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Külső keret
            ctx.strokeStyle = 'rgba(163, 92, 255, 0.3)';
            ctx.lineWidth = 4;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

            // Fejléc
            ctx.shadowColor = '#a35cff';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#ffffff'; 
            ctx.font = 'italic bold 32px HostingSansBold';
            ctx.fillText('NAPI FELADATOK', 40, 60);
            ctx.shadowBlur = 0; 

            ctx.fillStyle = '#b38cd9'; 
            ctx.font = 'italic bold 14px HostingSansBold';
            ctx.fillText('NAPI KÜLDETÉS NAPLÓ', 40, 95);
            
            // Egyenes elválasztó
            ctx.strokeStyle = '#a35cff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(40, 105);
            ctx.lineTo(960, 105);
            ctx.stroke();

            // 4. Feladatok kirajzolása (Dobozok)
            tasks.forEach((task, i) => {
                const y = 130 + (i * 110); // Egymás alatti távolság
                const isCompleted = task.current >= task.max;
                const isClaimed = dailyData.claimed[task.id];

                // Fő doboz
                ctx.fillStyle = isClaimed ? 'rgba(255, 255, 255, 0.02)' : 'rgba(50, 0, 100, 0.4)';
                ctx.strokeStyle = isClaimed ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(40, y, 680, 90, [4]) : ctx.rect(40, y, 680, 90);
                ctx.fill(); ctx.stroke();

                // Díszítő csík bal oldalt
                ctx.fillStyle = isClaimed ? '#444444' : (isCompleted ? '#4caf50' : '#a35cff');
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(40, y, 8, 90, [4, 0, 0, 4]) : ctx.rect(40, y, 8, 90);
                ctx.fill();

                // Cím és Leírás
                ctx.fillStyle = isClaimed ? '#555555' : '#ffffff';
                ctx.font = 'italic bold 22px HostingSansBold';
                ctx.fillText(task.title, 65, y + 30);

                ctx.fillStyle = isClaimed ? '#444444' : '#b38cd9';
                ctx.font = '16px HostingSans';
                ctx.fillText(task.desc, 65, y + 55);

                // Haladásjelző Csík (Progress bar)
                const barX = 65;
                const barY = y + 70;
                const barWidth = 635;
                const barHeight = 10;
                const safeProgress = Math.min(task.current, task.max);
                const progressPercent = safeProgress / task.max;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(barX, barY, barWidth, barHeight, [4]) : ctx.rect(barX, barY, barWidth, barHeight);
                ctx.fill();

                if (progressPercent > 0) {
                    ctx.fillStyle = isClaimed ? '#555555' : (isCompleted ? '#4caf50' : '#d4af37'); // Arany, ha csinálod, zöld, ha kész
                    ctx.beginPath();
                    ctx.roundRect ? ctx.roundRect(barX, barY, barWidth * progressPercent, barHeight, [4]) : ctx.rect(barX, barY, barWidth * progressPercent, barHeight);
                    ctx.fill();
                }

                // Haladás szöveg (pl. 1 / 3) a progress bar felett jobbra
                ctx.fillStyle = isClaimed ? '#555555' : '#ffffff';
                ctx.font = 'italic bold 12px HostingSansBold';
                const progressText = `${safeProgress} / ${task.max}`;
                const textWidth = ctx.measureText(progressText).width;
                ctx.fillText(progressText, barX + barWidth - textWidth, barY - 5);

                // --- JUTALOM DOBOS (Jobb oldalon) ---
                const rewardX = 740;
                ctx.fillStyle = isClaimed ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)';
                ctx.strokeStyle = isClaimed ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)';
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(rewardX, y, 220, 90, [4]) : ctx.rect(rewardX, y, 220, 90);
                ctx.fill(); ctx.stroke();

                ctx.fillStyle = isClaimed ? '#444444' : '#ff8c00';
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(rewardX, y, 8, 90, [4, 0, 0, 4]) : ctx.rect(rewardX, y, 8, 90);
                ctx.fill();

                ctx.fillStyle = isClaimed ? '#555555' : '#b38cd9';
                ctx.font = 'italic bold 14px HostingSansBold';
                ctx.fillText('JUTALOM', rewardX + 25, y + 30);

                if (isClaimed) {
                    ctx.fillStyle = '#666666';
                    ctx.font = 'italic bold 22px HostingSansBold';
                    ctx.fillText('ÁTVÉVE', rewardX + 25, y + 60);
                } else {
                    ctx.fillStyle = isCompleted ? '#4caf50' : '#ffffff';
                    ctx.font = 'italic bold 24px HostingSansBold';
                    ctx.fillText(`+${task.reward} V-Shard`, rewardX + 25, y + 62);
                }
            });

            // Névkijelzés alul
            ctx.fillStyle = '#ffffff';
            ctx.font = 'italic bold 16px HostingSansBold';
            ctx.fillText(`${message.author.username.toUpperCase()} - NAPI PROGRESSZIÓNAPLÓ`, 40, 490);

            // Gombok beállítása
            const row = new ActionRowBuilder();
            
            tasks.forEach((task, index) => {
                const isCompleted = task.current >= task.max;
                const isClaimed = dailyData.claimed[task.id];
                
                const btn = new ButtonBuilder()
                    .setCustomId(`claim_${task.id}`)
                    .setLabel(`${index + 1}. Jutalom`)
                    .setEmoji('<:VShard:1510974230446211154>') // A te saját V-shard emojid
                    .setStyle(ButtonStyle.Success);
                
                if (!isCompleted || isClaimed) {
                    btn.setDisabled(true);
                    btn.setStyle(ButtonStyle.Secondary);
                }

                row.addComponents(btn);
            });

            row.addComponents(
                new ButtonBuilder().setCustomId('close_daily').setLabel('❌ Bezár').setStyle(ButtonStyle.Danger)
            );

            return {
                files: [new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'daily.png' })],
                components: [row]
            };
        };

        const initialUI = await generateDailyUI();
        const msg = await message.reply(initialUI);

        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: '❌ Ez nem a te naplód!', ephemeral: true });

            if (i.customId === 'close_daily') {
                await i.update({ content: '❌ **Napi feladatok bezárva.**', components: [], files: [] });
                return collector.stop();
            }

            if (i.customId.startsWith('claim_')) {
                const taskId = parseInt(i.customId.split('_')[1]);
                let currentLb = loadLeaderboard(); 
                const task = tasks[taskId];

                if (currentLb[userId].dailyTasks.claimed[taskId]) return i.reply({ content: 'Ezt már átvetted!', ephemeral: true });
                
                // Jutalom kiosztása
                currentLb[userId].vshard = (currentLb[userId].vshard || 0) + task.reward;
                currentLb[userId].dailyTasks.claimed[taskId] = true;
                
                saveLeaderboard(currentLb); 
                
                dailyData.claimed[taskId] = true; 
                const updatedUI = await generateDailyUI();
                await i.update(updatedUI);
                
                await message.channel.send(`🎉 **${message.author.username}** sikeresen teljesített egy napi feladatot! Jutalom: **+${task.reward} V-shard** <:VShard:1510974230446211154>`);
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                msg.edit({ components: [] }).catch(() => {});
            }
        });
    }
};
