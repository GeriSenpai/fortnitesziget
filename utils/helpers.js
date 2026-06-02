const fs = require('fs');
const path = require('path');
const https = require('https');
const { EmbedBuilder } = require('discord.js');
const { GlobalFonts, loadImage } = require('@napi-rs/canvas');
const config = require('../config');

const LEADERBOARD_FILE = './leaderboard.json';

// --- ADATBÁZIS KEZELÉS ---
function loadLeaderboard() {
    if (!fs.existsSync(LEADERBOARD_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf-8')); } catch (err) { return {}; }
}

function saveLeaderboard(data) {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(data, null, 2));
}

// --- ÚJ LOKÁLIS KÉPBETÖLTŐ (EZ HIÁNYZOTT!) ---
async function loadAsset(fileName) {
    if (!fileName) return null;
    const filePath = path.join(config.ASSET_PATH, fileName);
    if (!fs.existsSync(filePath)) return null;
    return await loadImage(filePath);
}

// --- FONT BETÖLTŐ ---
function downloadFont(url, dest, fontName) {
    if (fs.existsSync(dest)) { GlobalFonts.registerFromPath(dest, fontName); return; }
    const file = fs.createWriteStream(dest);
    https.get(url, response => {
        response.pipe(file);
        file.on('finish', () => { file.close(); GlobalFonts.registerFromPath(dest, fontName); console.log(`[FONT] ${fontName} regisztrálva!`); });
    }).on('error', () => fs.unlink(dest, () => {}));
}

// --- CANVAS RAJZOLÓK ---
function drawOrangeCheckmark(ctx, x, y) {
    ctx.save(); ctx.fillStyle = '#f06414'; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x - 1, y + 4); ctx.lineTo(x + 5, y - 4); ctx.stroke(); ctx.restore();
}

function drawGoldenLock(ctx, x, y) {
    ctx.save(); ctx.fillStyle = '#f3ca44'; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1c2430'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y - 2, 4, Math.PI, 0, false); ctx.stroke();
    ctx.fillStyle = '#1c2430'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 5, y - 2, 10, 8, 1) : ctx.rect(x - 5, y - 2, 10, 8); ctx.fill(); ctx.restore();
}

// --- TAGSÁG KEZELŐ ---
function getMembershipMilestone(joinedAt) {
    const diffDays = Math.ceil(Math.abs(new Date() - joinedAt) / (1000 * 60 * 60 * 24));
    if (diffDays >= 1825) return { name: "5 éve tag", id: config.ROLES.FIVE_YEARS };
    if (diffDays >= 1095) return { name: "3 éve tag", id: config.ROLES.THREE_YEARS };
    if (diffDays >= 730) return { name: "2 éve tag", id: config.ROLES.TWO_YEARS };
    if (diffDays >= 365) return { name: "1 éve tag", id: config.ROLES.ONE_YEAR };
    if (diffDays >= 180) return { name: "6 hónapja tag", id: config.ROLES.SIX_MONTHS };
    if (diffDays >= 90) return { name: "3 hónapja tag", id: config.ROLES.THREE_MONTHS };
    if (diffDays >= 60) return { name: "2 hónapja tag", id: config.ROLES.TWO_MONTHS };
    if (diffDays >= 30) return { name: "1 hónapja tag", id: config.ROLES.ONE_MONTH };
    return { name: "Új Tag", id: null };
}

// --- BATTLE PASS LOGIKA (V-sharddal frissítve) ---
function checkBattlePassLevelUp(message, userId, client) {
    const lb = loadLeaderboard();
    const xpPerTier = 100; 
    let leveledUp = false; let rewardMessages = [];

    while (lb[userId].xp >= xpPerTier) {
        lb[userId].xp -= xpPerTier; lb[userId].level += 1; leveledUp = true;
        const currentTier = lb[userId].level;
        const isPremium = lb[userId].hasPremium;
        const jutalom = config.BATTLE_PASS_REWARDS[currentTier];

        if (jutalom) {
            const freeLoot = jutalom.free;
            if (freeLoot.type === 'points') { lb[userId].points += freeLoot.val; rewardMessages.push(`⚪ **Tier ${currentTier}:** +${freeLoot.val} PT`); }
            else if (freeLoot.type === 'tokens') { lb[userId].vshard += freeLoot.val; rewardMessages.push(`⚪ **Tier ${currentTier}:** +${freeLoot.val} ${config.VSHARD_EMOJI || 'V-shard'}`); }
            else if (freeLoot.type === 'bg') { if (!lb[userId].inventory.includes(freeLoot.val)) lb[userId].inventory.push(freeLoot.val); rewardMessages.push(`⚪ **Tier ${currentTier}:** ${freeLoot.name}`); }

            if (isPremium && jutalom.prem) {
                const premLoot = jutalom.prem;
                if (premLoot.type === 'points') { lb[userId].points += premLoot.val; rewardMessages.push(`👑 **Prémium Tier ${currentTier}:** +${premLoot.val} PT`); }
                else if (premLoot.type === 'tokens') { lb[userId].vshard += premLoot.val; rewardMessages.push(`👑 **Prémium Tier ${currentTier}:** +${premLoot.val} ${config.VSHARD_EMOJI || 'V-shard'}`); }
                else if (premLoot.type === 'bg') { if (!lb[userId].inventory.includes(premLoot.val)) lb[userId].inventory.push(premLoot.val); rewardMessages.push(`👑 **Prémium Tier ${currentTier}:** ${premLoot.name}`); }
                else if (premLoot.type === 'border') { if (!lb[userId].borderInventory.includes(premLoot.val)) lb[userId].borderInventory.push(premLoot.val); rewardMessages.push(`👑 **Prémium Tier ${currentTier}:** ${premLoot.name}`); }
            }
        } else {
            lb[userId].points += 50; rewardMessages.push(`⚪ **Tier ${currentTier}:** +50 PT`);
            if (isPremium) { lb[userId].points += 50; rewardMessages.push(`👑 **Prémium Tier ${currentTier}:** +50 extra PT`); }
        }
    }

    if (leveledUp) {
        saveLeaderboard(lb);
        const bpUpEmbed = new EmbedBuilder().setTitle('🌟 HARCI PASSZ SZINTLÉPÉS!').setDescription(`Szép volt <@${userId}>!\n⭐ Új szinted: **Tier ${lb[userId].level}**\n\n**Jutalmak:**\n${rewardMessages.join('\n')}`).setColor('#FFD700');
        message.channel.send({ content: `<@${userId}>`, embeds: [bpUpEmbed] });
    }
}

// MINDEN FÜGGVÉNY EXPORTÁLÁSA
module.exports = { 
    loadLeaderboard, 
    saveLeaderboard, 
    loadAsset, 
    downloadFont, 
    drawOrangeCheckmark, 
    drawGoldenLock, 
    getMembershipMilestone, 
    checkBattlePassLevelUp 
};
