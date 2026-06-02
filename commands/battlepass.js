const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { drawOrangeCheckmark, drawGoldenLock } = require('../utils/helpers');

module.exports = {
    name: 'battlepass',
    aliases: ['bp'],
    async execute(message, args, client, leaderboard) {
        const userId = message.author.id;
        const loadingMsg = await message.reply("⏳ **Pillanat, generálom a Battle Pass kártyádat...**").catch(() => null);
        
        if (leaderboard[userId].xp === undefined || isNaN(leaderboard[userId].xp)) leaderboard[userId].xp = 0;
        if (leaderboard[userId].level === undefined || isNaN(leaderboard[userId].level)) leaderboard[userId].level = 1;
        if (leaderboard[userId].tokens === undefined || isNaN(leaderboard[userId].tokens)) leaderboard[userId].tokens = 0;
        if (leaderboard[userId].hasPremium === undefined) leaderboard[userId].hasPremium = false;

        const currentXp = leaderboard[userId].xp;
        const currentLevel = leaderboard[userId].level;
        const hasPremium = leaderboard[userId].hasPremium;
        
        // Pl. szintenként 500 XP
        const xpNeeded = currentLevel * 500; 

        const canvas = createCanvas(1540, 520);
        const ctx = canvas.getContext('2d');

        // --- HÁTTÉR ÉS DIZÁJN (A Quest dizájn stílusában) ---
        const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, '#13002b'); // Sötét lila felső
        bgGrad.addColorStop(1, '#270054'); // Világosabb lila alsó
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Külső neon keret
        ctx.strokeStyle = 'rgba(163, 92, 255, 0.3)';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        // Tech díszítő elemek
        ctx.fillStyle = 'rgba(163, 92, 255, 0.1)';
        ctx.fillRect(60, 110, 50, 15);
        ctx.fillRect(500, 65, 140, 20);
        ctx.fillRect(1350, 140, 100, 25);
        
        // Egyenes vonal a fejléc alatt
        ctx.strokeStyle = '#a35cff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, 105);
        ctx.lineTo(1500, 105);
        ctx.stroke();

        // Cím
        ctx.textAlign = 'center';
        ctx.shadowColor = '#a35cff';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic bold 38px HostingSansBold';
        ctx.fillText('SEASON BETA', canvas.width / 2, 65);
        ctx.shadowBlur = 0; // Visszaállítás

        // Játékos neve és szintje a jobb felső sarokban
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic bold 16px HostingSansBold';
        let pName = message.member ? message.member.displayName : message.author.username;
        ctx.fillText(`${pName.toUpperCase()} // SZINT ${currentLevel}`, 1500, 45);

        // Szezon vége visszaszámláló
        const seasonEnd = new Date('2026-07-05T10:00:00'); 
        const timeLeft = seasonEnd - Date.now();
        let bpCountdown = "SZEZON VÉGET ÉRT";
        if (timeLeft > 0) {
            const bpDays = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const bpHours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            bpCountdown = `SZEZON VÉGE: ${bpDays} NAP ${bpHours}Ó`;
        }
        ctx.fillStyle = '#ff8c00'; // Narancs
        ctx.font = 'italic bold 13px HostingSansBold';
        ctx.fillText(bpCountdown, 1500, 68);
        ctx.textAlign = 'start';

        // Prémium gomb ikonja (ha nincs prémium)
        if (!hasPremium) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 183, 0, 0.2)'; 
            ctx.strokeStyle = '#ffb700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(40, 30, 110, 45, 4) : ctx.rect(40, 30, 110, 45);
            ctx.fill(); ctx.stroke();
            
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffb700';
            ctx.font = 'italic bold 12px HostingSansBold';
            ctx.fillText('PRÉMIUM', 95, 48);
            ctx.font = 'italic bold 10px HostingSans';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('!premium', 95, 62);
            ctx.restore();
        }

        // Oldalsó feliratok
        ctx.textAlign = 'right';
        ctx.fillStyle = '#b38cd9';
        ctx.font = 'italic bold 24px HostingSansBold';
        ctx.fillText('INGYENES', 140, 205);

        ctx.fillStyle = '#ffb700'; // Arany
        ctx.font = 'italic bold 24px HostingSansBold';
        ctx.fillText('PRÉMIUM', 140, 325);
        ctx.textAlign = 'start';

        // Pontos struktúra képekkel és szövegekkel
        const bPassStruktura = [
            { szint: 1, free: '50 PT', freeIcon: 'https://i.ibb.co/q3f1p7wP/Season-XP-29-Icon-Fortnite.webp', prem: '100 PT', premIcon: 'https://i.ibb.co/zW2hbVgR/v-bucks.png' },
            { szint: 2, free: '150 PT', freeIcon: 'https://i.imgur.com/w8N4unY.png', prem: '2 Token', premIcon: 'https://i.imgur.com/7T6mXnU.png' },
            { szint: 3, free: '5 Token', freeIcon: 'https://i.ibb.co/zW2hbVgR/v-bucks.png', prem: 'Rick Háttér', premIcon: 'https://i.imgur.com/8Qp4Z9W.png' },
            { szint: 4, free: '50 PT', freeIcon: 'https://i.imgur.com/w8N4unY.png', prem: '200 PT', premIcon: 'https://i.ibb.co/zW2hbVgR/v-bucks.png' },
            { szint: 5, free: 'FN Sziget', freeIcon: 'https://i.imgur.com/8Qp4Z9W.png', prem: 'Metal Keret', premIcon: 'https://i.imgur.com/uX8W4nB.png' },
            { szint: 6, free: '100 PT', freeIcon: 'https://i.imgur.com/w8N4unY.png', prem: '3 Token', premIcon: 'https://i.imgur.com/7T6mXnU.png' },
            { szint: 7, free: '150 PT', freeIcon: 'https://i.ibb.co/zW2hbVgR/v-bucks.png', prem: 'Szuper Láda', premIcon: 'https://i.imgur.com/uX8W4nB.png' },
            { szint: 8, free: '2 Token', freeIcon: 'https://i.imgur.com/7T6mXnU.png', prem: 'Kuromi Keret', premIcon: 'https://i.imgur.com/uX8W4nB.png' },
            { szint: 9, free: '200 PT', freeIcon: 'https://i.imgur.com/w8N4unY.png', prem: '400 PT', premIcon: 'https://i.imgur.com/w8N4unY.png' },
            { szint: 10, free: 'Extra 1K', freeIcon: 'https://i.imgur.com/8Qp4Z9W.png', prem: 'Rick Keret', premIcon: 'https://i.imgur.com/uX8W4nB.png' }
        ];

        const cardWidth = 120;
        const cardHeight = 95;
        const spacing = 15;
        const startX = 160; 
        const iconSize = 34;

        // Kártyák rajzolása
        for (let i = 0; i < bPassStruktura.length; i++) {
            const item = bPassStruktura[i];
            const currentCardX = startX + i * (cardWidth + spacing);
            const elerteASzintet = currentLevel >= item.szint;

            // Szint száma
            ctx.fillStyle = elerteASzintet ? '#ffffff' : '#b38cd9';
            ctx.font = 'italic bold 14px HostingSansBold';
            ctx.textAlign = 'center';
            ctx.fillText(`SZINT ${item.szint}`, currentCardX + (cardWidth / 2), 125);
            ctx.textAlign = 'start';

            // --- INGYENES SÁV KÁRTYÁK ---
            const freeY = 140;
            ctx.save();
            ctx.fillStyle = elerteASzintet ? 'rgba(163, 92, 255, 0.4)' : 'rgba(50, 0, 100, 0.4)';
            ctx.strokeStyle = elerteASzintet ? '#a35cff' : 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = elerteASzintet ? 2 : 1;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(currentCardX, freeY, cardWidth, cardHeight, 4) : ctx.rect(currentCardX, freeY, cardWidth, cardHeight);
            ctx.fill(); ctx.stroke();

            // Kis díszítő lila csík (ha elkészült)
            if (elerteASzintet) {
                ctx.fillStyle = '#a35cff';
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(currentCardX, freeY, 6, cardHeight, [4, 0, 0, 4]) : ctx.rect(currentCardX, freeY, 6, cardHeight);
                ctx.fill();
            }

            if (item.freeIcon) {
                try {
                    const img = await loadImage(item.freeIcon);
                    ctx.drawImage(img, currentCardX + (cardWidth - iconSize) / 2, freeY + 15, iconSize, iconSize);
                } catch (e) {}
            }

            ctx.fillStyle = elerteASzintet ? '#ffffff' : '#a89ebd';
            ctx.font = 'italic bold 12px HostingSansBold';
            ctx.textAlign = 'center';
            ctx.fillText(item.free, currentCardX + (cardWidth / 2), freeY + 72);
            ctx.restore();

            if (elerteASzintet) drawOrangeCheckmark(ctx, currentCardX + cardWidth, freeY + cardHeight);

            // --- PRÉMIUM SÁV KÁRTYÁK ---
            const premY = 260;
            ctx.save();
            
            if (hasPremium && elerteASzintet) {
                ctx.fillStyle = 'rgba(255, 183, 0, 0.25)'; 
                ctx.strokeStyle = '#ffb700'; // Arany keret
                ctx.lineWidth = 2;
            } else if (hasPremium && !elerteASzintet) {
                ctx.fillStyle = 'rgba(255, 183, 0, 0.05)'; 
                ctx.strokeStyle = 'rgba(255, 183, 0, 0.3)';
                ctx.lineWidth = 1;
            } else {
                ctx.fillStyle = 'rgba(50, 0, 100, 0.4)'; 
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
            }

            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(currentCardX, premY, cardWidth, cardHeight, 4) : ctx.rect(currentCardX, premY, cardWidth, cardHeight);
            ctx.fill(); ctx.stroke();

            // Kis díszítő arany csík
            if (hasPremium && elerteASzintet) {
                ctx.fillStyle = '#ffb700';
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(currentCardX, premY, 6, cardHeight, [4, 0, 0, 4]) : ctx.rect(currentCardX, premY, 6, cardHeight);
                ctx.fill();
            }

            if (item.premIcon) {
                try {
                    const img = await loadImage(item.premIcon);
                    if (!hasPremium) ctx.globalAlpha = 0.25; 
                    ctx.drawImage(img, currentCardX + (cardWidth - iconSize) / 2, premY + 15, iconSize, iconSize);
                    ctx.globalAlpha = 1.0;
                } catch (e) {}
            }

            if (hasPremium && elerteASzintet) ctx.fillStyle = '#ffffff';
            else if (hasPremium) ctx.fillStyle = '#ffb700';
            else ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';

            ctx.font = 'italic bold 12px HostingSansBold';
            ctx.textAlign = 'center';
            ctx.fillText(item.prem, currentCardX + (cardWidth / 2), premY + 72);
            ctx.restore();

            if (!hasPremium) {
                drawGoldenLock(ctx, currentCardX + cardWidth, premY + cardHeight);
            } else if (hasPremium && elerteASzintet) {
                drawOrangeCheckmark(ctx, currentCardX + cardWidth, premY + cardHeight);
            }
        }

        // --- TAPASZTALAT SÁV (Progress bar) ---
        ctx.textAlign = 'start';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic bold 16px HostingSansBold';
        ctx.fillText(`TP ${currentXp}/${xpNeeded}`, startX, 435);

        const barX = startX + 110;
        const barY = 422;
        const barWidth = 850;
        const barHeight = 16;

        // Csík háttere
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = '#8238cc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(barX, barY, barWidth, barHeight, 8) : ctx.rect(barX, barY, barWidth, barHeight);
        ctx.fill(); ctx.stroke();
        
        // Csík kitöltése
        const fillWidth = Math.max(0, Math.min((currentXp / xpNeeded) * barWidth, barWidth));
        if (fillWidth > 0) {
            const progGrad = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
            progGrad.addColorStop(0, '#8238cc');
            progGrad.addColorStop(1, '#a35cff');
            ctx.fillStyle = progGrad;
            
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(barX, barY, fillWidth, barHeight, 8) : ctx.rect(barX, barY, fillWidth, barHeight);
            ctx.fill();
        }

        ctx.fillStyle = '#b38cd9';
        ctx.font = '11px HostingSans';
        ctx.fillText('*A maximális szint elérése után minden szint +50 Pontot (PT) ad automatikusan.', startX, 480);

        const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'battlepass.png' });
        
        const bpEmbed = new EmbedBuilder()
            .setTitle('👑 DIMENZIÓ KÖZPONT - BATTLE PASS') // Fejléc cím is stílusba igazítva
            .setDescription(`Statisztikáid sikeresen betöltve, **${message.author.username}**.`)
            .setColor(hasPremium ? '#FFD700' : '#a35cff') // Kék helyett lila szín az Embedben
            .setImage('attachment://battlepass.png')
            .setTimestamp();

        await message.channel.send({ embeds: [bpEmbed], files: [attachment] });
        if (loadingMsg) await loadingMsg.delete().catch(() => {});
    }
};
