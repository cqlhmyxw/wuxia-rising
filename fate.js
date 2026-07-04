/* =============================================
   武侠·崛起 — 先天命格 + 后天命格 系统
   ============================================= */

// 15种先天命格
const INNATE_FATES = [
    { id:'tianlinggen', name:'天灵根', rarity:'S', weight:1, desc:'修炼速度+50%', effects:{cultSpeed:1.5} },
    { id:'hundunzhiti', name:'混沌之体', rarity:'S', weight:1, desc:'全系可兼修', effects:{allTypes:true} },
    { id:'jueshiwuxing', name:'绝世悟性', rarity:'S', weight:1, desc:'突破概率+30%', effects:{breakthrough:0.3} },
    { id:'tianshengshenli', name:'天生神力', rarity:'A', weight:5, desc:'基础攻击+20%', effects:{atkBonus:0.2} },
    { id:'fuxinggaozhao', name:'福星高照', rarity:'A', weight:5, desc:'奇遇概率+50%', effects:{luckBonus:0.5} },
    { id:'baidubujin', name:'百毒不侵', rarity:'A', weight:5, desc:'毒抗+80%', effects:{poisonResist:0.8} },
    { id:'gangjintiegu', name:'钢筋铁骨', rarity:'B', weight:15, desc:'防御+20%', effects:{defBonus:0.2} },
    { id:'shenxingbaibian', name:'神行百变', rarity:'B', weight:15, desc:'闪避+15%', effects:{dodgeBonus:0.15} },
    { id:'guomubuwang', name:'过目不忘', rarity:'B', weight:15, desc:'读书收益+30%', effects:{readBonus:0.3} },
    { id:'tianshaguxing', name:'天煞孤星', rarity:'B', weight:15, desc:'社交减半独修+30%', effects:{soloBonus:0.3, socialPenalty:0.5} },
    { id:'caiyunhengtong', name:'财运亨通', rarity:'C', weight:30, desc:'银两获取+30%', effects:{moneyBonus:0.3} },
    { id:'lingchanzhixi', name:'灵蝉之息', rarity:'C', weight:30, desc:'内力恢复+25%', effects:{neiliRegen:0.25} },
    { id:'tianshengmeigu', name:'天生魅骨', rarity:'C', weight:30, desc:'NPC好感+50%', effects:{charmBonus:0.5} },
    { id:'fanti', name:'凡体', rarity:'D', weight:49, desc:'无加成，后天触发×2', effects:{latentMultiplier:2, dayHalved:true} },
    { id:'pingpinganan', name:'平平安安', rarity:'D', weight:49, desc:'免负面事件，后天触发×2', effects:{noBadEvent:true, latentMultiplier:2, dayHalved:true} },
];

// 抽取先天命格
function drawInnateFate() {
    const pool = [];
    INNATE_FATES.forEach(f => { for(let i=0; i<f.weight; i++) pool.push(f); });
    return pool[Math.floor(Math.random() * pool.length)];
}

// 4种后天命格
const LATENT_FATES = [
    {
        id:'tiandaochouqin', name:'天道酬勤', desc:'全修炼速度+20%',
        check: function(g) { return g.days >= 100; },
        getThreshold: function(g) { return g.innateFate?.effects?.dayHalved ? 50 : 100; },
        effect: {cultSpeedAll:0.2}
    },
    {
        id:'santianzhangyu', name:'三天打鱼两天晒网', desc:'休闲武功修炼+50%',
        check: function(g) {
            const recent = (g.actionLog || []).slice(-5);
            if(recent.length < 5) return false;
            const fishDays = recent.filter(a => a ==='练功').length;
            const netDays = recent.filter(a => a ==='休息'||a==='钓鱼'||a==='看书').length;
            return fishDays === 3 && netDays === 2;
        },
        effect: {leisureBonus:0.5}
    },
    {
        id:'shinianmojian', name:'十年磨一剑', desc:'同一武功威力+100%',
        check: function(g) {
            const max = Math.max(...(g.skillDays || [0]));
            const threshold = g.innateFate?.effects?.dayHalved ? 50 : 100;
            return max >= threshold;
        },
        effect: {oneSkillMastery:2.0}
    },
    {
        id:'xinrushuizhi', name:'心如止水', desc:'突破概率+20%',
        check: function(g) {
            const recent = (g.actionLog || []).slice(-30);
            if(recent.length < 30) return false;
            return recent.every(a => a === '打坐');
        },
        getThreshold: function(g) { return g.innateFate?.effects?.dayHalved ? 15 : 30; },
        effect: {breakthroughBonus:0.2}
    }
];

// 检查所有后天命格
function checkLatentFates(gameState) {
    const result = [];
    LATENT_FATES.forEach(f => {
        if(!gameState.awakenedFates) gameState.awakenedFates = [];
        if(gameState.awakenedFates.includes(f.id)) return;
        // 补偿机制：凡体和平安安触发概率×2
        let prob = 1.0;
        if(gameState.innateFate?.effects?.latentMultiplier) {
            prob *= gameState.innateFate.effects.latentMultiplier;
        }
        if(f.check(gameState) && Math.random() < prob) {
            gameState.awakenedFates.push(f.id);
            result.push(f);
        }
    });
    return result;
}
