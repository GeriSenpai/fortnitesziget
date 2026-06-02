const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { getMembershipMilestone } = require('../utils/helpers');

module.exports = {
    name: 'profil',
    aliases: ['p'],
    async execute(message, args, client, leaderboard) {
        const targetUser = message.mentions.users.first() || message.author;
        const targetUserId = targetUser.id; 
        const userData = leaderboard[targetUserId];
        
        if (!userData) return message.reply("❌ Nem találom az adatokat az adatbázisban!");
        
        const pts = userData.points || 0;
        const isPremium = userData.hasPremium || false;
        const member = await message.guild.members.fetch(targetUserId).catch(() => null);
        
        let milestoneName = member ? getMembershipMilestone(member.joinedAt).name : "Ismeretlen";
        
        let rankName = "KEZDŐ ÜGYNÖK"; 
        let tierColor = "#a35cff"; 
        
        if (pts >= 500 && pts < 1500) { rankName = "RITKA TÚLÉLŐ"; tierColor = "#0070FF"; } 
        else if (pts >= 1500 && pts < 5000) { rankName = "EPIKUS HARCOS"; tierColor = "#A335EE"; } 
        else if (pts >= 5000) { rankName = "MITIKUS LEGENDA"; tierColor = "#ffb700"; } 

        const canvas = createCanvas(800, 480);
        const ctx = canvas.getContext('2d');

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

        const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, '#13002b');
        bgGrad.addColorStop(1, '#270054');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(163, 92, 255, 0.3)';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        const bgUrl = client.config.ELERHETO_HATTEREK[userData.activeBackground || 'alap']?.url || client.config.ELERHETO_HATTEREK['alap'].url;
        try {
            const bgImage = await loadImage(bgUrl);
            ctx.save(); 
            ctx.beginPath(); 
            ctx.rect(10, 10, canvas.width - 20, 130); 
            ctx.clip();
            const scale = Math.max(canvas.width / bgImage.width, 130 / bgImage.height);
            ctx.drawImage(bgImage, (canvas.width - bgImage.width * scale) / 2, (130 - bgImage.height * scale) / 2, bgImage.width * scale, bgImage.height * scale);
            
            const bannerGradient = ctx.createLinearGradient(0, 50, 0, 140);
            bannerGradient.addColorStop(0, 'rgba(19, 0, 43, 0)');
            bannerGradient.addColorStop(1, 'rgba(19, 0, 43, 1)');
            ctx.fillStyle = bannerGradient;
            ctx.fillRect(10, 10, canvas.width - 20, 130);
            
            ctx.restore();
        } catch (err) {}

        ctx.fillStyle = tierColor; 
        ctx.fillRect(10, 140, canvas.width - 20, 3);
        ctx.shadowColor = tierColor;
        ctx.shadowBlur = 10;
        ctx.fillRect(10, 140, canvas.width - 20, 3); 
        ctx.shadowBlur = 0;

        const activeBorderKey = userData.activeBorder || 'nincs';
        const avatarRadius = 65;
        const avatarX = 110;
        const avatarY = 140;

        try {
            const avatarImage = await loadImage(targetUser.displayAvatarURL({ extension: 'png', size: 256 }));
            ctx.save(); 
            ctx.beginPath(); 
            ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true); 
            ctx.closePath(); 
            ctx.clip();
            ctx.drawImage(avatarImage, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2); 
            ctx.restore();

            if (activeBorderKey !== 'nincs') {
                const borderImg = await loadImage(client.config.ELERHETO_KERETEK[activeBorderKey].url);
                ctx.drawImage(borderImg, avatarX - 80, avatarY - 80, 160, 160);
            } else {
                ctx.strokeStyle = tierColor;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
                ctx.stroke();
            }
        } catch (e) { 
            ctx.fillStyle = '#2f3136'; 
            ctx.beginPath(); 
            ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true); 
            ctx.fill(); 
        }

        const nameY = 250;
        
        // --- PRÉMIUM NÉV EFFEKT: ARANY ÁTMENET ---
        if (isPremium) {
            const goldGradient = ctx.createLinearGradient(40, nameY - 30, 40, nameY);
            goldGradient.addColorStop(0, '#ffe55c'); // Világos arany
            goldGradient.addColorStop(0.5, '#ffb700'); // Sima arany
            goldGradient.addColorStop(1, '#996515'); // Sötét arany
            ctx.fillStyle = goldGradient;
            ctx.shadowColor = '#ffb700'; // Arany ragyogás
            ctx.shadowBlur = 15; 
        } else { 
            ctx.fillStyle = '#ffffff'; 
            ctx.shadowBlur = 0; 
        }
        
        ctx.font = '32px HostingSansBold'; 
        ctx.fillText(member ? member.displayName : targetUser.username, 40, nameY);
        ctx.shadowBlur = 0; 

        ctx.fillStyle = '#b38cd9'; 
        ctx.font = '16px HostingSans'; 
        ctx.fillText(`@${targetUser.username}`, 40, nameY + 25);
        
        ctx.fillStyle = tierColor; 
        ctx.font = 'italic bold 20px HostingSansBold'; 
        ctx.fillText(rankName, 40, nameY + 60);

        const rightX = 350;

        ctx.fillStyle = 'rgba(50, 0, 100, 0.4)';
        ctx.strokeStyle = '#8238cc';
        ctx.lineWidth = 1;
        drawSkewedBox(rightX, 160, 400, 90, 15);

        ctx.fillStyle = tierColor;
        drawSkewedBox(rightX, 160, 8, 90, 15, true, false); 

        ctx.fillStyle = '#b38cd9'; 
        ctx.font = 'italic bold 14px HostingSansBold'; 
        ctx.fillText('AKTÍV KITŰZŐK ÉS TÁRGYAK', rightX + 35, 185);
        
        const osszesTargy = [...(userData.inventory || []), ...(userData.borderInventory || [])].filter(t => t !== 'alap' && t !== 'nincs');
        
        if (osszesTargy.length === 0) { 
            ctx.fillStyle = '#80848e'; 
            ctx.font = '14px HostingSans'; 
            ctx.fillText('Üres az eszköztár.', rightX + 35, 215); 
        } else {
            let startX = rightX + 35;
            for (let i = 0; i < Math.min(osszesTargy.length, 6); i++) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; 
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                
                ctx.beginPath();
                ctx.moveTo(startX + 5, 200); ctx.lineTo(startX + 45 + 5, 200);
                ctx.lineTo(startX + 45, 240); ctx.lineTo(startX, 240); ctx.closePath();
                ctx.fill(); ctx.stroke();
                
                ctx.fillStyle = '#ffffff'; 
                ctx.textAlign = 'center'; 
                ctx.font = 'bold 12px HostingSansBold';
                ctx.fillText(osszesTargy[i].substring(0, 2).toUpperCase(), startX + 25, 225); 
                ctx.textAlign = 'start';
                startX += 55;
            }
        }

        ctx.fillStyle = 'rgba(50, 0, 100, 0.4)';
        ctx.strokeStyle = '#8238cc';
        drawSkewedBox(rightX - 10, 265, 400, 75, 15);

        ctx.fillStyle = tierColor;
        drawSkewedBox(rightX - 10, 265, 8, 75, 15, true, false);

        ctx.fillStyle = '#b38cd9'; 
        ctx.font = 'italic bold 14px HostingSansBold'; 
        ctx.fillText('TAGSÁG & BATTLEPASS', rightX + 25, 290);
        
        ctx.fillStyle = '#ffffff'; 
        ctx.font = 'italic bold 20px HostingSansBold'; 
        ctx.fillText(`${milestoneName.toUpperCase()}`, rightX + 25, 320);
        
        ctx.fillStyle = '#ffb700'; 
        ctx.fillText(`BP SZINT: ${userData.level || 1}`, rightX + 225, 320);

        ctx.fillStyle = 'rgba(50, 0, 100, 0.4)';
        ctx.strokeStyle = '#8238cc';
        drawSkewedBox(rightX - 20, 355, 400, 95, 15);

        ctx.fillStyle = tierColor;
        drawSkewedBox(rightX - 20, 355, 8, 95, 15, true, false);

        ctx.fillStyle = '#b38cd9'; 
        ctx.font = 'italic bold 14px HostingSansBold'; 
        ctx.fillText('LOOT & PROGRESSZIÓ', rightX + 15, 380);
        
        ctx.fillStyle = '#ffffff'; 
        ctx.font = 'italic bold 22px HostingSansBold'; 
        ctx.fillText(`${pts} PT`, rightX + 15, 410);
        
        ctx.fillStyle = '#00ffcc'; 
        ctx.font = 'italic bold 16px HostingSansBold'; 
        ctx.fillText(`${userData.tokens || 0} TOKEN`, rightX + 130, 410);

        ctx.fillStyle = '#ff8c00'; 
        ctx.fillText(`${userData.xp || 0} XP`, rightX + 250, 410);
        
        const xpNeeded = (userData.level || 1) * 500; 
        const currentXp = userData.xp || 0;
        const progressPercent = Math.min(currentXp / xpNeeded, 1);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = '#8238cc';
        drawSkewedBox(rightX + 15, 425, 340, 10, 5);
        
        if (progressPercent > 0) {
            ctx.fillStyle = tierColor; 
            drawSkewedBox(rightX + 15, 425, 340 * progressPercent, 10, 5, true, false);
        }

        message.reply({ files: [new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'profil.png' })] });
    }
};
