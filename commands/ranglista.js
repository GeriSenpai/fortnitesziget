const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

module.exports = {
    name: 'leaderboard',
    aliases: ['top', 'ranglista'],
    async execute(message, args, client, leaderboard) {
        const userId = message.author.id;

        const leaderboardArray = Object.keys(leaderboard).map(id => ({ id, ...leaderboard[id] }));
        leaderboardArray.sort((a, b) => (b.points || 0) - (a.points || 0));
        
        const top10 = leaderboardArray.slice(0, 10);
        if (top10.length === 0) return message.reply("📋 A ranglista még üres!");

        const authorRankIndex = leaderboardArray.findIndex(u => u.id === userId);
        const authorInTop10 = authorRankIndex !== -1 && authorRankIndex < 10;
        
        const rowHeight = 70; 
        const spacing = 15;
        const startY = 120;
        const listHeight = top10.length * (rowHeight + spacing);
        const baseHeight = startY + listHeight;
        
        const canvasHeight = authorInTop10 ? baseHeight + 20 : baseHeight + 110; 

        const canvas = createCanvas(800, canvasHeight);
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

        const clipSkewedBox = (x, y, w, h, skew) => {
            ctx.beginPath();
            ctx.moveTo(x + skew, y);
            ctx.lineTo(x + w + skew, y);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x, y + h);
            ctx.closePath();
            ctx.clip();
        };

        const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, '#13002b');
        bgGrad.addColorStop(1, '#270054');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(163, 92, 255, 0.3)';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        ctx.shadowColor = '#a35cff';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff'; 
        ctx.font = 'italic bold 32px HostingSansBold';
        ctx.textAlign = 'center';
        ctx.fillText('SZIGET RANGLISTA', canvas.width / 2, 60);
        ctx.shadowBlur = 0; 

        ctx.fillStyle = '#b38cd9'; 
        ctx.font = 'italic bold 14px HostingSansBold';
        ctx.fillText('A LEGJOBB 10 ÜGYNÖK HÁLÓZATI ADATAI', canvas.width / 2, 85);
        ctx.textAlign = 'start';
        
        ctx.strokeStyle = '#a35cff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(100, 100);
        ctx.lineTo(700, 100);
        ctx.stroke();

        const boxX = 60;
        const boxWidth = 660;
        const skewAmount = 15;

        for (let i = 0; i < top10.length; i++) {
            const userData = top10[i];
            const currentY = startY + i * (rowHeight + spacing);
            
            let rankColor = '#a35cff'; 
            if (i === 0) rankColor = '#FFD700'; 
            else if (i === 1) rankColor = '#C0C0C0'; 
            else if (i === 2) rankColor = '#CD7F32'; 

            const bgUrl = client.config?.ELERHETO_HATTEREK?.[userData.activeBackground || 'alap']?.url;
            
            ctx.save();
            clipSkewedBox(boxX, currentY, boxWidth, rowHeight, skewAmount);
            
            if (bgUrl) {
                try {
                    const rowBgImage = await loadImage(bgUrl);
                    const scale = Math.max(boxWidth / rowBgImage.width, rowHeight / rowBgImage.height);
                    ctx.drawImage(rowBgImage, boxX + (boxWidth - rowBgImage.width * scale) / 2, currentY + (rowHeight - rowBgImage.height * scale) / 2, rowBgImage.width * scale, rowBgImage.height * scale);
                } catch (err) {
                    ctx.fillStyle = 'rgba(50, 0, 100, 0.4)'; ctx.fillRect(boxX, currentY, boxWidth + skewAmount, rowHeight);
                }
            } else {
                ctx.fillStyle = 'rgba(50, 0, 100, 0.4)'; ctx.fillRect(boxX, currentY, boxWidth + skewAmount, rowHeight);
            }
            
            ctx.fillStyle = 'rgba(19, 0, 43, 0.7)'; 
            ctx.fillRect(boxX, currentY, boxWidth + skewAmount, rowHeight); 
            ctx.restore(); 

            ctx.fillStyle = 'transparent';
            ctx.strokeStyle = userData.id === userId ? '#00ffcc' : 'rgba(255, 255, 255, 0.15)'; 
            ctx.lineWidth = userData.id === userId ? 2 : 1;
            drawSkewedBox(boxX, currentY, boxWidth, rowHeight, skewAmount, false, true);

            ctx.fillStyle = rankColor;
            drawSkewedBox(boxX, currentY, 8, rowHeight, skewAmount, true, false);

            ctx.fillStyle = rankColor; 
            ctx.font = 'italic bold 26px HostingSansBold'; 
            ctx.fillText(`#${i + 1}`, boxX + 30, currentY + 45);

            let displayName = userData.username || "Ismeretlen";
            let avatarUrl = null;
            try {
                const member = message.guild.members.cache.get(userData.id) || await message.guild.members.fetch(userData.id).catch(() => null);
                if (member) { 
                    displayName = member.displayName; 
                    avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 128 }); 
                }
            } catch (err) {}

            const avatarX = boxX + 110;
            const avatarY = currentY + 35;
            const avatarRadius = 22;
            const activeBorderKey = userData.activeBorder || 'nincs';
            const hasCustomBorder = activeBorderKey !== 'nincs' && client.config?.ELERHETO_KERETEK?.[activeBorderKey];

            if (avatarUrl) {
                try {
                    const avatarImage = await loadImage(avatarUrl);
                    ctx.save(); ctx.beginPath(); ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true); ctx.closePath(); ctx.clip();
                    ctx.drawImage(avatarImage, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2); ctx.restore();
                    
                    if (hasCustomBorder) {
                        const borderImg = await loadImage(client.config.ELERHETO_KERETEK[activeBorderKey].url);
                        const targetSize = (avatarRadius * 2) * 1.45;
                        let bW = targetSize, bH = targetSize;
                        if (borderImg.width > borderImg.height) bH = targetSize * (borderImg.height / borderImg.width);
                        else if (borderImg.height > borderImg.width) bW = targetSize * (borderImg.width / borderImg.height);
                        ctx.drawImage(borderImg, avatarX - bW / 2, avatarY - bH / 2, bW, bH);
                    }
                } catch (e) { 
                    ctx.fillStyle = '#2f3136'; ctx.beginPath(); ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true); ctx.fill(); 
                }
            }

            if (!hasCustomBorder) {
                ctx.strokeStyle = userData.id === userId ? '#00ffcc' : rankColor; 
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(avatarX, avatarY, avatarRadius + 1, 0, Math.PI * 2, true); ctx.stroke();
            }

            let finalName = userData.id === userId ? `${displayName} (TE)` : displayName;
            const nameY = currentY + 42;

            // --- PRÉMIUM NÉV EFFEKT: ARANY ÁTMENET ---
            if (userData.hasPremium) {
                const goldGradient = ctx.createLinearGradient(avatarX + 45, nameY - 25, avatarX + 45, nameY);
                goldGradient.addColorStop(0, '#ffe55c'); 
                goldGradient.addColorStop(0.5, '#ffb700'); 
                goldGradient.addColorStop(1, '#996515'); 
                ctx.fillStyle = goldGradient;
                ctx.shadowColor = '#ffb700'; 
                ctx.shadowBlur = 12; 
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 0;
            }

            ctx.font = 'italic bold 20px HostingSansBold';
            ctx.fillText(finalName.length > 18 ? finalName.substring(0, 16) + '...' : finalName, avatarX + 45, nameY);
            ctx.shadowBlur = 0; 
            
            ctx.fillStyle = rankColor; 
            ctx.font = 'italic bold 20px HostingSansBold'; 
            ctx.textAlign = 'right';
            ctx.fillText(`${(userData.points || 0).toLocaleString()} PT`, boxX + boxWidth - 20, nameY); 
            ctx.textAlign = 'start'; 
        }

        // --- 4. SAJÁT HELYEZÉS RAJZOLÁSA ---
        if (!authorInTop10) {
            const authorData = leaderboard[userId] || { points: 0, activeBackground: 'alap', activeBorder: 'nincs', hasPremium: false };
            const authorRank = authorRankIndex !== -1 ? authorRankIndex + 1 : leaderboardArray.length + 1;
            const userY = baseHeight + 15; 

            ctx.strokeStyle = '#a35cff'; 
            ctx.lineWidth = 2;
            ctx.shadowColor = '#a35cff';
            ctx.shadowBlur = 10;
            ctx.beginPath(); 
            ctx.moveTo(100, baseHeight - 5); 
            ctx.lineTo(700, baseHeight - 5); 
            ctx.stroke(); 
            ctx.shadowBlur = 0;

            const userBgUrl = client.config?.ELERHETO_HATTEREK?.[authorData.activeBackground || 'alap']?.url;
            
            ctx.save();
            clipSkewedBox(boxX, userY, boxWidth, rowHeight, skewAmount);
            
            if (userBgUrl) {
                try {
                    const uBgImg = await loadImage(userBgUrl);
                    const scale = Math.max(boxWidth / uBgImg.width, rowHeight / uBgImg.height);
                    ctx.drawImage(uBgImg, boxX + (boxWidth - uBgImg.width * scale) / 2, userY + (rowHeight - uBgImg.height * scale) / 2, uBgImg.width * scale, uBgImg.height * scale);
                } catch (e) { 
                    ctx.fillStyle = 'rgba(50, 0, 100, 0.4)'; ctx.fillRect(boxX, userY, boxWidth + skewAmount, rowHeight); 
                }
            } else {
                ctx.fillStyle = 'rgba(50, 0, 100, 0.4)'; ctx.fillRect(boxX, userY, boxWidth + skewAmount, rowHeight);
            }
            
            ctx.fillStyle = 'rgba(19, 0, 43, 0.7)'; 
            ctx.fillRect(boxX, userY, boxWidth + skewAmount, rowHeight); 
            ctx.restore();

            ctx.fillStyle = 'transparent';
            ctx.strokeStyle = '#00ffcc'; 
            ctx.lineWidth = 2; 
            drawSkewedBox(boxX, userY, boxWidth, rowHeight, skewAmount, false, true);
            
            ctx.fillStyle = '#00ffcc';
            drawSkewedBox(boxX, userY, 8, rowHeight, skewAmount, true, false);

            ctx.fillStyle = '#ffffff'; 
            ctx.font = 'italic bold 26px HostingSansBold'; 
            ctx.fillText(`#${authorRank}`, boxX + 30, userY + 45);

            const myAvatarUrl = message.author.displayAvatarURL({ extension: 'png', size: 128 });
            const myHasCustomBorder = authorData.activeBorder !== 'nincs' && client.config?.ELERHETO_KERETEK?.[authorData.activeBorder];
            const avatarX = boxX + 110;
            const avatarY = userY + 35;
            
            if (myAvatarUrl) {
                try {
                    const myAvImg = await loadImage(myAvatarUrl);
                    ctx.save(); ctx.beginPath(); ctx.arc(avatarX, avatarY, 22, 0, Math.PI * 2, true); ctx.closePath(); ctx.clip();
                    ctx.drawImage(myAvImg, avatarX - 22, avatarY - 22, 44, 44); ctx.restore();
                    if (myHasCustomBorder) {
                        const borderImg = await loadImage(client.config.ELERHETO_KERETEK[authorData.activeBorder].url);
                        let bW = 64, bH = 64;
                        if (borderImg.width > borderImg.height) bH = 64 * (borderImg.height / borderImg.width);
                        else if (borderImg.height > borderImg.width) bW = 64 * (borderImg.width / borderImg.height);
                        ctx.drawImage(borderImg, avatarX - bW / 2, avatarY - bH / 2, bW, bH);
                    }
                } catch (e) {}
            }
            if (!myHasCustomBorder) {
                ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(avatarX, avatarY, 23, 0, Math.PI * 2, true); ctx.stroke();
            }

            let myName = message.member ? message.member.displayName : message.author.username;
            let finalMyName = `${myName.length > 16 ? myName.substring(0, 14) + '...' : myName} (TE)`;
            const myNameY = userY + 42;

            // --- SAJÁT NÉV PRÉMIUM EFFEKT: ARANY ÁTMENET ---
            if (authorData.hasPremium) {
                const goldGradient = ctx.createLinearGradient(avatarX + 45, myNameY - 25, avatarX + 45, myNameY);
                goldGradient.addColorStop(0, '#ffe55c'); 
                goldGradient.addColorStop(0.5, '#ffb700'); 
                goldGradient.addColorStop(1, '#996515'); 
                ctx.fillStyle = goldGradient;
                ctx.shadowColor = '#ffb700'; 
                ctx.shadowBlur = 12; 
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 0;
            }

            ctx.font = 'italic bold 20px HostingSansBold';
            ctx.fillText(finalMyName, avatarX + 45, myNameY);
            ctx.shadowBlur = 0; 
            
            ctx.fillStyle = '#00ffcc'; 
            ctx.font = 'italic bold 20px HostingSansBold'; 
            ctx.textAlign = 'right';
            ctx.fillText(`${(authorData.points || 0).toLocaleString()} PT`, boxX + boxWidth - 20, myNameY); 
            ctx.textAlign = 'start';
        }

        const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'ranglista.png' });
        message.reply({ files: [attachment] });
    }
};
