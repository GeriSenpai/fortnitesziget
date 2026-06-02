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
        const xpNeeded = 100;

        const canvas = createCanvas(1540, 520);
        const ctx = canvas.getContext('2d');

        // Háttér színátmenet
        const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, '#568fec');
        bgGrad.addColorStop(1, '#79a7f1');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Díszítő elemek
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(60, 110, 50, 15);
        ctx.fillRect(500, 65, 140, 20);
        ctx.fillRect(1350, 140, 100, 25);

        // Cím
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic bold 38px HostingSansBold';
        ctx.fillText('SEASON BETA', canvas.width / 2, 65);

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
        ctx.fillStyle = '#ffe600'; 
        ctx.font = 'italic bold 13px HostingSansBold';
        ctx.fillText(bpCountdown, 1500, 68);
        ctx.textAlign = 'start';

        // Prémium gomb ikonja (ha nincs prémium)
        if (!hasPremium) {
            ctx.save();
            ctx.fillStyle = '#f07e26'; 
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(40, 30, 110, 45, 4) : ctx.rect(40, 30, 110, 45);
            ctx.fill();
            
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'italic bold 12px HostingSansBold';
            ctx.fillText('PRÉMIUM', 95, 48);
            ctx.font = 'italic bold 10px HostingSans';
            ctx.fillText('!premium', 95, 62);
            ctx.restore();
        }

        // Oldalsó feliratok
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic bold 24px HostingSansBold';
        ctx.fillText('INGYENES', 140, 205);

        ctx.fillStyle = '#f3ca44';
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

            ctx.fillStyle = elerteASzintet ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
            ctx.font = 'italic bold 14px HostingSansBold';
            ctx.textAlign = 'center';
            ctx.fillText(`SZINT ${item.szint}`, currentCardX + (cardWidth / 2), 125);
            ctx.textAlign = 'start';

            // Ingyenes sáv
            const freeY = 140;
            ctx.save();
            ctx.fillStyle = elerteASzintet ? '#cedef2' : '#93b3dc';
            ctx.strokeStyle = elerteASzintet ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = elerteASzintet ? 2 : 1;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(currentCardX, freeY, cardWidth, cardHeight, 4) : ctx.rect(currentCardX, freeY, cardWidth, cardHeight);
            ctx.fill(); ctx.stroke();

            if (item.freeIcon) {
                try {
                    const img = await loadImage(item.freeIcon);
                    ctx.drawImage(img, currentCardX + (cardWidth - iconSize) / 2, freeY + 15, iconSize, iconSize);
                } catch (e) {}
            }

            ctx.fillStyle = elerteASzintet ? '#1c2430' : '#4a5b73';
            ctx.font = 'italic bold 12px HostingSansBold';
            ctx.textAlign = 'center';
            ctx.fillText(item.free, currentCardX + (cardWidth / 2), freeY + 72);
            ctx.restore();

            if (elerteASzintet) drawOrangeCheckmark(ctx, currentCardX + cardWidth, freeY + cardHeight);

            // Prémium sáv
            const premY = 260;
            ctx.save();
            
            if (hasPremium && elerteASzintet) {
                ctx.fillStyle = '#d1c295'; 
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
            } else if (hasPremium && !elerteASzintet) {
                ctx.fillStyle = '#948b6f'; 
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
            } else {
                ctx.fillStyle = '#524d3e'; 
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
                ctx.lineWidth = 1;
            }

            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(currentCardX, premY, cardWidth, cardHeight, 4) : ctx.rect(currentCardX, premY, cardWidth, cardHeight);
            ctx.fill(); ctx.stroke();

            if (item.premIcon) {
                try {
                    const img = await loadImage(item.premIcon);
                    if (!hasPremium) ctx.globalAlpha = 0.25; 
                    ctx.drawImage(img, currentCardX + (cardWidth - iconSize) / 2, premY + 15, iconSize, iconSize);
                    ctx.globalAlpha = 1.0;
                } catch (e) {}
            }

            if (hasPremium && elerteASzintet) ctx.fillStyle = '#1c2430';
            else if (hasPremium) ctx.fillStyle = '#ffffff';
            else ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';

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

        // Tapasztalat sáv rajzolása
        ctx.textAlign = 'start';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic bold 16px HostingSansBold';
        ctx.fillText(`TP ${currentXp}/${xpNeeded}`, startX, 435);

        const barX = startX + 110;
        const barY = 422;
        const barWidth = 850;
        const barHeight = 16;

        ctx.fillStyle = '#3762a7';
        ctx.roundRect ? (ctx.beginPath(), ctx.roundRect(barX, barY, barWidth, barHeight, 8), ctx.fill()) : ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const fillWidth = Math.min((currentXp / xpNeeded) * barWidth, barWidth);
        if (fillWidth > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.roundRect ? (ctx.beginPath(), ctx.roundRect(barX, barY, fillWidth, barHeight, 8), ctx.fill()) : ctx.fillRect(barX, barY, fillWidth, barHeight);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '11px HostingSans';
        ctx.fillText('*A maximális szint elérése után minden szint +50 Pontot (PT) ad automatikusan.', startX, 480);

        const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'battlepass.png' });
        
        const bpEmbed = new EmbedBuilder()
            .setTitle('👑 FORTNITE SZIGET - BATTLE PASS')
            .setDescription(`Statisztikáid sikeresen betöltve, **${message.author.username}**.`)
            .setColor(hasPremium ? '#FFD700' : '#568fec')
            .setImage('attachment://battlepass.png')
            .setTimestamp();

        await message.channel.send({ embeds: [bpEmbed], files: [attachment] });
        if (loadingMsg) await loadingMsg.delete().catch(() => {});
    }
};
