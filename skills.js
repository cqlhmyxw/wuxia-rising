/**
 * 武侠·崛起 — 武功系统
 * 15种武功 + 10层熟练度体系
 * 数据导出为 window.skillsData
 */

(function () {

    // ========== 熟练度等级 ==========
    const MASTERY_LEVELS = [
        { id: 0,  name: '初学乍练',   min: 0,    max: 99 },
        { id: 1,  name: '粗通皮毛',   min: 100,  max: 299 },
        { id: 2,  name: '略有小成',   min: 300,  max: 599 },
        { id: 3,  name: '驾轻就熟',   min: 600,  max: 999 },
        { id: 4,  name: '融会贯通',   min: 1000, max: 1499 },
        { id: 5,  name: '炉火纯青',   min: 1500, max: 2099 },
        { id: 6,  name: '登峰造极',   min: 2100, max: 2799 },
        { id: 7,  name: '出神入化',   min: 2800, max: 3599 },
        { id: 8,  name: '超凡入圣',   min: 3600, max: 4499 },
        { id: 9,  name: '返璞归真',   min: 4500, max: 5000 }
    ];

    function getMasteryLevel(exp) {
        for (let i = MASTERY_LEVELS.length - 1; i >= 0; i--) {
            if (exp >= MASTERY_LEVELS[i].min) return MASTERY_LEVELS[i];
        }
        return MASTERY_LEVELS[0];
    }

    function getMasteryLevelById(id) {
        return MASTERY_LEVELS[id] || MASTERY_LEVELS[0];
    }

    // ========== 武功定义 ==========
    // 类型：拳掌、剑法、刀法、内功、轻功
    const SKILLS_DEF = [
        // ---- 拳掌 ----
        {
            id: 'basic_fist',
            name: '基础拳法',
            type: '拳掌',
            description: '武林入门的拳脚功夫，招式简单但根基所在。每一拳都蕴含着最朴素的发力之道。',
            power: 10,
            speed: 15,
            cost: 5,
            practiceSpeed: 15,  // 每次练功增加熟练度
            practiceDesc: [
                '你扎稳马步，一记冲拳直击木人桩！砰——',
                '左拳虚晃，右拳实击，木人摇晃不止。',
                '你反复练习冲、劈、砸三式，汗如雨下。',
                '拳风渐起，木人身上留下浅浅印记。'
            ]
        },
        {
            id: 'taiji',
            name: '太极拳',
            type: '拳掌',
            description: '以柔克刚、四两拨千斤的上乘拳法。招式圆融连绵，看似缓慢实则暗藏杀机。',
            power: 45,
            speed: 30,
            cost: 25,
            practiceSpeed: 10,
            practiceDesc: [
                '你缓缓起势，如抱太极，气沉丹田。',
                '云手推转，木人的反击被你轻轻带偏。',
                '一记揽雀尾，劲力吞吐间木人发出闷响。',
                '拳意绵绵，如行云流水，木人上的掌印层层叠叠。'
            ]
        },
        {
            id: 'xianglong',
            name: '降龙十八掌',
            type: '拳掌',
            description: '天下至刚至猛的掌法，一掌既出犹如巨龙降世。江湖传言：降龙一出，谁与争锋。',
            power: 95,
            speed: 40,
            cost: 50,
            practiceSpeed: 6,
            practiceDesc: [
                '你运转内力，双掌隐隐泛出金光！',
                '一掌「亢龙有悔」拍出，木人剧烈震颤！',
                '「飞龙在天」！你腾空而起，掌力自上而下倾泻。',
                '龙吟之声隐隐传出，木人桩表面裂开细纹。'
            ]
        },

        // ---- 剑法 ----
        {
            id: 'basic_sword',
            name: '基础剑法',
            type: '剑法',
            description: '剑道入门功夫，包含刺、挑、抹、劈等基本剑式。虽平凡，却是万剑之源。',
            power: 12,
            speed: 18,
            cost: 5,
            practiceSpeed: 15,
            practiceDesc: [
                '你手腕一抖，长剑直刺木人心口。',
                '回剑横削，剑光如练划过木人腰间。',
                '挑、抹、劈、刺，四式连贯一气呵成。',
                '剑尖在木人身上留下细密剑痕。'
            ]
        },
        {
            id: 'dugu',
            name: '独孤九剑',
            type: '剑法',
            description: '剑魔独孤求败所创的无上剑法，讲究"无招胜有招"，破尽天下武功。',
            power: 80,
            speed: 85,
            cost: 40,
            practiceSpeed: 7,
            practiceDesc: [
                '你凝神聚气，剑意随心而动，无招无式。',
                '「破剑式」！剑光一闪，后发先至。',
                '「破气式」！剑气破空，直取木人罩门。',
                '剑随意走，已分不清是人御剑还是剑御人。'
            ]
        },
        {
            id: 'xuantie',
            name: '玄铁剑法',
            type: '剑法',
            description: '杨过在剑冢中所悟，重剑无锋、大巧不工。以浑厚内力驱动，一剑之威重逾千钧。',
            power: 75,
            speed: 25,
            cost: 45,
            practiceSpeed: 8,
            practiceDesc: [
                '你双手握剑，沉肩坠肘，剑势如山。',
                '玄铁剑缓缓挥出，带起沉闷的风声。',
                '一剑劈下，木人桩被砸得深深一陷！',
                '大巧不工——你已领悟到真正的力量不需要锋芒。'
            ]
        },

        // ---- 刀法 ----
        {
            id: 'basic_blade',
            name: '基础刀法',
            type: '刀法',
            description: '刀为百兵之胆，基础刀法讲究挥、砍、劈、撩，势大力沉。',
            power: 13,
            speed: 14,
            cost: 6,
            practiceSpeed: 15,
            practiceDesc: [
                '你大喝一声，单刀抡圆劈下！',
                '刀光一闪，横削木人腰部。',
                '缠头裹脑，刀花翻滚护住周身。',
                '刀锋所过，木屑纷飞。'
            ]
        },
        {
            id: 'hujia',
            name: '胡家刀法',
            type: '刀法',
            description: '胡家世代相传的刀法绝学，刀法精奇，变化莫测。一招三式，式式相连。',
            power: 55,
            speed: 50,
            cost: 30,
            practiceSpeed: 10,
            practiceDesc: [
                '你身形一矮，「穿掌进步刀」直取中路。',
                '「鹞子翻身」！刀随身转，寒光四射。',
                '「闭门铁扇」！刀花密不透风，木人被刀气笼罩。',
                '胡家刀法讲究快准狠，木人上的刀痕越来越深。'
            ]
        },
        {
            id: 'qinglong',
            name: '青龙刀法',
            type: '刀法',
            description: '关家嫡传的霸道刀法，相传为武圣所创。大开大阖，有横扫千军之势。',
            power: 70,
            speed: 35,
            cost: 40,
            practiceSpeed: 7,
            practiceDesc: [
                '你横刀立马，一股锐利刀气破体而出！',
                '「青龙出水」！长刀如龙，横扫千军。',
                '「斩将夺旗」！刀光一闪，雷霆万钧。',
                '青龙刀法霸道无匹，木人已被刀气震得嗡嗡作响。'
            ]
        },

        // ---- 内功 ----
        {
            id: 'tuna',
            name: '吐纳心法',
            type: '内功',
            description: '最基础的呼吸运气之法，调理经脉，培元固本。内功修炼的起点。',
            power: 8,
            speed: 5,
            cost: 3,
            practiceSpeed: 20,
            practiceDesc: [
                '你盘膝而坐，眼观鼻、鼻观心，缓缓吐纳。',
                '一呼一吸之间，丹田微微发热。',
                '真气沿着经脉缓缓流转，周身暖意融融。',
                '吐纳日久，气息愈发绵长沉稳。'
            ]
        },
        {
            id: 'yijinjing',
            name: '易筋经',
            type: '内功',
            description: '少林镇寺之宝，能易筋洗髓、脱胎换骨。习练者可拥有金刚不坏之体。',
            power: 60,
            speed: 10,
            cost: 35,
            practiceSpeed: 8,
            practiceDesc: [
                '你结跏趺坐，双手结印，默诵易筋经口诀。',
                '真气在经脉中奔涌，筋骨发出细微的噼啪声。',
                '洗髓伐脉！你感到每一寸肌肉都在重塑。',
                '易筋经运转大周天，周身金光隐现。'
            ]
        },
        {
            id: 'jiuyang',
            name: '九阳神功',
            type: '内功',
            description: '至高无上的内功心法，练成后内力生生不息、护体真气自生。九阳一出，寒冰立消。',
            power: 90,
            speed: 15,
            cost: 60,
            practiceSpeed: 5,
            practiceDesc: [
                '你运转九阳真气，丹田如烈日般灼热！',
                '真气在奇经八脉中汹涌奔腾，周身白气蒸腾。',
                '「九阳归元」！内力如大江大河般在体内循环。',
                '你感到体内仿佛升起一轮骄阳，真气取之不尽用之不竭！'
            ]
        },

        // ---- 轻功 ----
        {
            id: 'basic_lightness',
            name: '基础轻功',
            type: '轻功',
            description: '最基本的提气轻身之法，是上乘轻功的根基。练好了可身轻如燕。',
            power: 5,
            speed: 20,
            cost: 8,
            practiceSpeed: 18,
            practiceDesc: [
                '你深吸一口气，脚尖轻点地面，身形微提。',
                '提气纵跃，虽不过三尺，但落地轻盈无声。',
                '你在木人桩周围来回穿梭，步伐渐快。',
                '身法越来越灵活，落地如羽毛般无声。'
            ]
        },
        {
            id: 'tiyun',
            name: '梯云纵',
            type: '轻功',
            description: '武当派轻功绝学，能在空中接力腾跃，如登天梯。武当有"梯云纵，步步高"之说。',
            power: 15,
            speed: 60,
            cost: 25,
            practiceSpeed: 12,
            practiceDesc: [
                '你足尖一点，身形拔地而起！',
                '左脚踩右脚，凭空再次借力腾升！',
                '你在空中连续三次纵跃，如登天梯。',
                '梯云纵已臻化境，身在空中如履平地。'
            ]
        },
        {
            id: 'lingbo',
            name: '凌波微步',
            type: '轻功',
            description: '逍遥派镇派轻功，按伏羲六十四卦方位踏行。施展时如凌波仙子，潇洒飘逸。',
            power: 20,
            speed: 95,
            cost: 35,
            practiceSpeed: 8,
            practiceDesc: [
                '你脚踏八卦方位，身形飘忽不定。',
                '「凌波微步，罗袜生尘」——身影在木人桩间穿梭。',
                '你步伐越来越快，原地留下数道残影！',
                '大有逍遥游之意，木人桩连你的衣角都碰不到。'
            ]
        }
    ];

    // ========== 技能类 ==========
    class Skill {
        constructor(def) {
            this.id = def.id;
            this.name = def.name;
            this.type = def.type;
            this.description = def.description;
            this.power = def.power;
            this.speed = def.speed;
            this.cost = def.cost;
            this.practiceSpeed = def.practiceSpeed;
            this.practiceDesc = def.practiceDesc;

            // 练功状态
            this.exp = 0;
            this.practiceCount = 0;
        }

        get mastery() {
            return getMasteryLevel(this.exp);
        }

        get masteryName() {
            return this.mastery.name;
        }

        get masteryLevel() {
            return this.mastery.id;
        }

        get isMaxMastery() {
            return this.mastery.id >= MASTERY_LEVELS.length - 1 && this.exp >= MASTERY_LEVELS[MASTERY_LEVELS.length - 1].max;
        }

        get progress() {
            const current = this.mastery;
            const range = current.max - current.min;
            const done = this.exp - current.min;
            return range > 0 ? Math.min(done / range, 1) : 1;
        }

        // 当前总进度百分比
        get totalProgress() {
            const maxExp = MASTERY_LEVELS[MASTERY_LEVELS.length - 1].max;
            return Math.min(this.exp / maxExp, 1);
        }

        // 练功一次
        practice() {
            if (this.isMaxMastery) {
                return { desc: `${this.name}已达「${this.masteryName}」之境，无需再练。`, gained: 0 };
            }

            // 基础熟练度增量 + 小随机波动
            let gained = Math.round(this.practiceSpeed * (0.85 + Math.random() * 0.3));
            // 高熟练度时适当衰减成长速度（但保留基础值）
            if (this.masteryLevel >= 5) {
                gained = Math.max(1, Math.round(gained * 0.8));
            }
            if (this.masteryLevel >= 8) {
                gained = Math.max(1, Math.round(gained * 0.6));
            }

            const oldMastery = this.masteryName;
            this.exp = Math.min(this.exp + gained, MASTERY_LEVELS[MASTERY_LEVELS.length - 1].max);
            this.practiceCount++;

            const newMastery = this.masteryName;
            const descLines = this.practiceDesc[this.practiceCount % this.practiceDesc.length];

            let result = {
                desc: descLines,
                gained: gained,
                oldMastery: oldMastery,
                newMastery: newMastery,
                levelUp: oldMastery !== newMastery
            };

            return result;
        }

        // 导出为普通对象
        toJSON() {
            return {
                id: this.id,
                name: this.name,
                type: this.type,
                description: this.description,
                power: this.power,
                speed: this.speed,
                cost: this.cost,
                practiceSpeed: this.practiceSpeed,
                exp: this.exp,
                practiceCount: this.practiceCount,
                masteryName: this.masteryName,
                masteryLevel: this.masteryLevel,
                progress: this.progress,
                totalProgress: this.totalProgress,
                isMaxMastery: this.isMaxMastery
            };
        }
    }

    // ========== 武功管理器 ==========
    class SkillsManager {
        constructor() {
            this.skills = {};
            this.learnedSkills = {};  // 已习得的技能
            this.initSkills();
        }

        initSkills() {
            SKILLS_DEF.forEach(def => {
                this.skills[def.id] = new Skill(def);
            });
        }

        getAllSkills() {
            return Object.values(this.skills).map(s => s.toJSON());
        }

        getSkill(id) {
            return this.skills[id] || null;
        }

        learnSkill(id) {
            if (!this.skills[id]) return false;
            this.learnedSkills[id] = true;
            return true;
        }

        forgetSkill(id) {
            delete this.learnedSkills[id];
        }

        hasLearned(id) {
            return !!this.learnedSkills[id];
        }

        practice(id) {
            const skill = this.skills[id];
            if (!skill) return null;
            return skill.practice();
        }

        resetAll() {
            this.skills = {};
            this.learnedSkills = {};
            this.initSkills();
        }

        getStats() {
            const all = this.getAllSkills();
            let totalExp = 0;
            let totalMaxExp = 0;
            const maxExp = MASTERY_LEVELS[MASTERY_LEVELS.length - 1].max;

            all.forEach(s => {
                totalExp += s.exp;
                totalMaxExp += maxExp;
            });

            return {
                totalSkills: all.length,
                learnedSkills: Object.keys(this.learnedSkills).length,
                totalExp,
                totalMaxExp,
                overallProgress: totalMaxExp > 0 ? totalExp / totalMaxExp : 0,
                masteryLevels: MASTERY_LEVELS
            };
        }

        exportData() {
            return {
                version: '1.0.0',
                masteryLevels: MASTERY_LEVELS.map(m => ({ id: m.id, name: m.name })),
                skills: this.getAllSkills(),
                learnedSkillIds: Object.keys(this.learnedSkills),
                stats: this.getStats()
            };
        }
    }

    // ========== 木人桩渲染（HTML UI） ==========
    function createWoodenDummyUI(containerEl) {
        if (!containerEl) return null;

        const style = document.createElement('style');
        style.textContent = `
            .wuxia-dummy-container {
                font-family: 'KaiTi', 'STKaiti', 'SimSun', serif;
                background: linear-gradient(135deg, #1a0a00 0%, #2d1810 100%);
                border: 3px solid #8B4513;
                border-radius: 16px;
                padding: 24px;
                color: #f5e6c8;
                max-width: 900px;
                margin: 0 auto;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6);
            }
            .wuxia-dummy-title {
                text-align: center;
                font-size: 28px;
                font-weight: bold;
                color: #ffd700;
                text-shadow: 0 0 20px rgba(255,215,0,0.3);
                margin-bottom: 8px;
                letter-spacing: 6px;
            }
            .wuxia-dummy-subtitle {
                text-align: center;
                font-size: 14px;
                color: #a08060;
                margin-bottom: 20px;
                border-bottom: 1px solid #5a3a1a;
                padding-bottom: 12px;
            }
            .wuxia-dummy-arena {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
            }
            /* 木人桩 SVG 区域 */
            .wuxia-dummy-figure {
                flex: 0 0 220px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: #1e0e06;
                border: 2px solid #5a3a1a;
                border-radius: 12px;
                padding: 12px;
                position: relative;
                min-height: 260px;
            }
            .wuxia-dummy-figure svg {
                width: 160px;
                height: 220px;
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
            }
            .wuxia-dummy-hit {
                position: absolute;
                color: #ff4500;
                font-size: 22px;
                font-weight: bold;
                text-shadow: 0 0 15px rgba(255,69,0,0.8);
                pointer-events: none;
                animation: dummyHitAnim 1s ease-out forwards;
            }
            @keyframes dummyHitAnim {
                0% { opacity: 1; transform: translateY(0) scale(1); }
                100% { opacity: 0; transform: translateY(-40px) scale(1.5); }
            }
            .wuxia-dummy-shake {
                animation: dummyShake 0.3s ease;
            }
            @keyframes dummyShake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px) rotate(-2deg); }
                75% { transform: translateX(5px) rotate(2deg); }
            }

            /* 右侧技能面板 */
            .wuxia-dummy-panel {
                flex: 1;
                background: rgba(30, 14, 6, 0.8);
                border: 1px solid #5a3a1a;
                border-radius: 10px;
                padding: 14px;
                overflow-y: auto;
                max-height: 300px;
            }
            .wuxia-dummy-panel h3 {
                margin: 0 0 8px 0;
                color: #d4a574;
                font-size: 16px;
                border-bottom: 1px solid #3a2210;
                padding-bottom: 6px;
            }
            .wuxia-skill-card {
                display: inline-block;
                margin: 4px 3px;
                padding: 4px 10px;
                border: 1px solid #4a2a10;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
                background: rgba(40, 20, 8, 0.6);
                user-select: none;
            }
            .wuxia-skill-card:hover {
                background: rgba(80, 40, 16, 0.8);
                border-color: #b8860b;
            }
            .wuxia-skill-card.active {
                background: #5a2a0a;
                border-color: #ffd700;
                color: #ffd700;
            }
            .wuxia-skill-card.learned {
                border-color: #8B6914;
            }
            .wuxia-skill-card .type-tag {
                font-size: 10px;
                opacity: 0.7;
                margin-left: 4px;
            }

            .wuxia-skill-detail {
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid #3a2210;
            }
            .wuxia-skill-name {
                font-size: 20px;
                font-weight: bold;
                color: #ffd700;
            }
            .wuxia-skill-type {
                font-size: 12px;
                color: #a08060;
                margin-left: 8px;
            }
            .wuxia-skill-desc {
                font-size: 13px;
                color: #c8b898;
                margin: 6px 0;
                line-height: 1.5;
            }
            .wuxia-skill-stats {
                display: flex;
                gap: 16px;
                margin: 6px 0;
                font-size: 13px;
            }
            .wuxia-skill-stats span {
                background: rgba(0,0,0,0.3);
                padding: 2px 10px;
                border-radius: 4px;
            }
            .stat-power { color: #ff6b35; }
            .stat-speed { color: #4fc3f7; }
            .stat-cost  { color: #81c784; }
            .stat-exp   { color: #ffd54f; }

            .wuxia-mastery-bar {
                margin: 8px 0;
                height: 18px;
                background: #1a0a00;
                border: 1px solid #5a3a1a;
                border-radius: 9px;
                overflow: hidden;
                position: relative;
            }
            .wuxia-mastery-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #8B4513, #ffd700);
                border-radius: 9px;
                transition: width 0.3s ease;
                width: 0%;
            }
            .wuxia-mastery-bar-text {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                color: #fff;
                text-shadow: 0 1px 3px rgba(0,0,0,0.8);
                font-weight: bold;
            }

            .wuxia-practice-btn {
                display: block;
                width: 100%;
                padding: 10px;
                margin-top: 8px;
                background: linear-gradient(180deg, #8B4513, #5a2a0a);
                border: 2px solid #b8860b;
                border-radius: 8px;
                color: #ffd700;
                font-size: 16px;
                font-weight: bold;
                font-family: inherit;
                cursor: pointer;
                transition: all 0.2s;
                letter-spacing: 2px;
            }
            .wuxia-practice-btn:hover {
                background: linear-gradient(180deg, #a0522d, #6b3010);
                border-color: #ffd700;
                box-shadow: 0 0 20px rgba(255,215,0,0.2);
            }
            .wuxia-practice-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .wuxia-practice-log {
                margin-top: 12px;
                padding: 10px;
                background: rgba(0,0,0,0.4);
                border: 1px solid #3a2210;
                border-radius: 8px;
                font-size: 14px;
                min-height: 48px;
                line-height: 1.6;
                color: #d4c4a0;
            }
            .wuxia-practice-log .level-up {
                color: #ffd700;
                font-weight: bold;
                animation: glowPulse 1s ease infinite;
            }
            @keyframes glowPulse {
                0%, 100% { text-shadow: 0 0 5px rgba(255,215,0,0.3); }
                50% { text-shadow: 0 0 20px rgba(255,215,0,0.8); }
            }

            .wuxia-dummy-footer {
                text-align: center;
                font-size: 11px;
                color: #5a3a1a;
                margin-top: 12px;
                padding-top: 10px;
                border-top: 1px solid #3a2210;
            }
            .wuxia-dummy-footer button {
                background: none;
                border: 1px solid #3a2210;
                color: #8a6a4a;
                padding: 4px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                font-family: inherit;
                margin-left: 6px;
            }
            .wuxia-dummy-footer button:hover {
                background: #3a2210;
                color: #c8a878;
            }
        `;
        document.head.appendChild(style);

        // 容器
        const container = document.createElement('div');
        container.className = 'wuxia-dummy-container';
        container.innerHTML = `
            <div class="wuxia-dummy-title">🥋 练功房</div>
            <div class="wuxia-dummy-subtitle">—— 木人桩 ——</div>
            <div class="wuxia-dummy-arena">
                <div class="wuxia-dummy-figure" id="wuxia-dummy-figure">
                    <svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg">
                        <!-- 底座 -->
                        <rect x="50" y="200" width="60" height="15" rx="3" fill="#5a3a1a" stroke="#8B4513" stroke-width="2"/>
                        <rect x="65" y="195" width="30" height="10" rx="2" fill="#4a2a10"/>
                        <!-- 主桩柱 -->
                        <rect x="72" y="50" width="16" height="148" rx="3" fill="#8B4513" stroke="#a0522d" stroke-width="1.5"/>
                        <!-- 横木（手臂） -->
                        <rect x="10" y="80" width="140" height="12" rx="4" fill="#7a3a13" stroke="#a0522d" stroke-width="1.5"/>
                        <!-- 左侧出手臂 -->
                        <rect x="2" y="78" width="20" height="16" rx="5" fill="#8B4513" stroke="#a0522d" stroke-width="1"/>
                        <!-- 右侧出手臂 -->
                        <rect x="138" y="78" width="20" height="16" rx="5" fill="#8B4513" stroke="#a0522d" stroke-width="1"/>
                        <!-- 头部 -->
                        <circle cx="80" cy="35" r="22" fill="#7a3a13" stroke="#a0522d" stroke-width="2"/>
                        <!-- 面部刻线 -->
                        <line x1="70" y1="32" x2="75" y2="32" stroke="#5a2a0a" stroke-width="1.5" stroke-linecap="round"/>
                        <line x1="85" y1="32" x2="90" y2="32" stroke="#5a2a0a" stroke-width="1.5" stroke-linecap="round"/>
                        <line x1="74" y1="42" x2="86" y2="42" stroke="#5a2a0a" stroke-width="1.5" stroke-linecap="round"/>
                        <!-- 木纹 -->
                        <line x1="76" y1="100" x2="84" y2="100" stroke="#6a3a13" stroke-width="0.8" opacity="0.5"/>
                        <line x1="75" y1="130" x2="85" y2="130" stroke="#6a3a13" stroke-width="0.8" opacity="0.5"/>
                        <line x1="77" y1="160" x2="83" y2="160" stroke="#6a3a13" stroke-width="0.8" opacity="0.5"/>
                        <line x1="76" y1="180" x2="84" y2="180" stroke="#6a3a13" stroke-width="0.8" opacity="0.5"/>
                        <!-- 横木上的凹痕 -->
                        <circle cx="40" cy="86" r="2" fill="#5a2a0a" opacity="0.4"/>
                        <circle cx="80" cy="86" r="2" fill="#5a2a0a" opacity="0.4"/>
                        <circle cx="120" cy="86" r="2" fill="#5a2a0a" opacity="0.4"/>
                    </svg>
                    <div style="font-size:11px;color:#8a6a4a;margin-top:4px;">木人桩</div>
                </div>

                <div class="wuxia-dummy-panel" id="wuxia-dummy-panel">
                    <h3>📜 武功列表</h3>
                    <div id="wuxia-skill-list"></div>
                    <div class="wuxia-skill-detail" id="wuxia-skill-detail">
                        <div style="color:#8a6a4a;text-align:center;padding:20px 0;">← 点击选择一门武功开始修炼</div>
                    </div>
                </div>
            </div>

            <div class="wuxia-practice-log" id="wuxia-practice-log">
                🥋 静候出招...
            </div>
            <div class="wuxia-dummy-footer">
                <span id="wuxia-stats-info">共 15 门武功</span>
                <button id="wuxia-reset-btn">🗑 重置</button>
            </div>
        `;

        containerEl.appendChild(container);

        // ---- 绑定逻辑 ----
        const figureEl = container.querySelector('#wuxia-dummy-figure');
        const skillListEl = container.querySelector('#wuxia-skill-list');
        const detailEl = container.querySelector('#wuxia-skill-detail');
        const logEl = container.querySelector('#wuxia-practice-log');
        const statsEl = container.querySelector('#wuxia-stats-info');
        const resetBtn = container.querySelector('#wuxia-reset-btn');

        const manager = new SkillsManager();
        let currentSkillId = null;

        function typeColor(type) {
            const map = {
                '拳掌': '#ff6b35',
                '剑法': '#4fc3f7',
                '刀法': '#81c784',
                '内功': '#ffd54f',
                '轻功': '#ce93d8'
            };
            return map[type] || '#aaa';
        }

        function renderSkillList() {
            const all = manager.getAllSkills();
            let html = '';
            const typeOrder = ['拳掌', '剑法', '刀法', '内功', '轻功'];
            for (const t of typeOrder) {
                const group = all.filter(s => s.type === t);
                if (group.length === 0) continue;
                html += `<div style="font-size:11px;color:#8a6a4a;margin:4px 0 2px 0;">【${t}】</div>`;
                group.forEach(s => {
                    const active = s.id === currentSkillId ? 'active' : '';
                    const learned = manager.hasLearned(s.id) ? 'learned' : '';
                    html += `<div class="wuxia-skill-card ${active} ${learned}" data-id="${s.id}" style="border-left:3px solid ${typeColor(s.type)};">
                        ${s.name}
                        <span class="type-tag">Lv.${s.masteryLevel} ${s.masteryName}</span>
                    </div>`;
                });
            }
            skillListEl.innerHTML = html;

            // 事件绑定
            skillListEl.querySelectorAll('.wuxia-skill-card').forEach(el => {
                el.addEventListener('click', () => {
                    const id = el.dataset.id;
                    selectSkill(id);
                });
            });
        }

        function selectSkill(id) {
            currentSkillId = id;
            manager.learnSkill(id);
            renderSkillList();
            renderDetail(id);
        }

        function renderDetail(id) {
            const skill = manager.getSkill(id);
            if (!skill) {
                detailEl.innerHTML = `<div style="color:#8a6a4a;text-align:center;padding:20px 0;">← 点击选择一门武功开始修炼</div>`;
                return;
            }
            const data = skill.toJSON();
            const progressPct = Math.round(data.totalProgress * 100);
            const masteryPct = Math.round(data.progress * 100);

            detailEl.innerHTML = `
                <div class="wuxia-skill-name">${data.name}<span class="wuxia-skill-type" style="color:${typeColor(data.type)};">【${data.type}】</span></div>
                <div class="wuxia-skill-desc">${data.description}</div>
                <div class="wuxia-skill-stats">
                    <span class="stat-power">⚔ 威力 ${data.power}</span>
                    <span class="stat-speed">💨 速度 ${data.speed}</span>
                    <span class="stat-cost">🔋 消耗 ${data.cost}</span>
                    <span class="stat-exp">📈 熟练 ${data.exp}</span>
                </div>
                <div style="font-size:13px;color:#d4a574;margin:4px 0;">
                    境界：${data.masteryName}（Lv.${data.masteryLevel}）
                    ${data.isMaxMastery ? '👑 已臻化境！' : ''}
                </div>
                <div class="wuxia-mastery-bar">
                    <div class="wuxia-mastery-bar-fill" style="width:${masteryPct}%;"></div>
                    <div class="wuxia-mastery-bar-text">${masteryPct}% → ${data.masteryName}</div>
                </div>
                <div style="font-size:11px;color:#8a6a4a;margin:2px 0;">总进度 ${progressPct}% (${data.exp}/5000)</div>
                <button class="wuxia-practice-btn" id="wuxia-practice-btn" ${data.isMaxMastery ? 'disabled' : ''}>
                    ${data.isMaxMastery ? '👑 已达圆满' : '🥋 练功'}
                </button>
            `;

            const practiceBtn = detailEl.querySelector('#wuxia-practice-btn');
            if (practiceBtn) {
                practiceBtn.addEventListener('click', () => doPractice(id));
            }
        }

        function doPractice(id) {
            const result = manager.practice(id);
            if (!result) return;

            // 木人桩动画
            figureEl.classList.remove('wuxia-dummy-shake');
            void figureEl.offsetWidth; // reflow
            figureEl.classList.add('wuxia-dummy-shake');

            // 飘字
            const hitEl = document.createElement('div');
            hitEl.className = 'wuxia-dummy-hit';
            hitEl.textContent = `+${result.gained}`;
            hitEl.style.left = (40 + Math.random() * 100) + 'px';
            hitEl.style.top = (30 + Math.random() * 80) + 'px';
            figureEl.appendChild(hitEl);
            setTimeout(() => hitEl.remove(), 1000);

            // 日志
            let logHtml = `${result.desc}`;
            if (result.levelUp) {
                logHtml += `<br><span class="level-up">✦✦✦ 突破！${result.oldMastery} → ${result.newMastery} ✦✦✦</span>`;
            }
            logHtml += ` <span style="font-size:11px;color:#8a6a4a;">（熟练度 +${result.gained}）</span>`;
            logEl.innerHTML = logHtml;

            // 更新界面
            renderSkillList();
            renderDetail(id);
            updateStats();
        }

        function updateStats() {
            const stats = manager.getStats();
            statsEl.textContent = `共 ${stats.totalSkills} 门武功 · 已习 ${stats.learnedSkills} 门 · 总进度 ${Math.round(stats.overallProgress * 100)}%`;
        }

        function resetAll() {
            manager.resetAll();
            currentSkillId = null;
            renderSkillList();
            detailEl.innerHTML = `<div style="color:#8a6a4a;text-align:center;padding:20px 0;">← 点击选择一门武功开始修炼</div>`;
            logEl.innerHTML = '🥋 一切归零，重新开始修炼...';
            updateStats();
        }

        resetBtn.addEventListener('click', () => {
            if (confirm('确定要重置所有武功进度吗？')) {
                resetAll();
            }
        });

        // 初始化
        renderSkillList();
        updateStats();

        // 默认选中第一个
        const all = manager.getAllSkills();
        if (all.length > 0) {
            selectSkill(all[0].id);
        }

        // 导出数据
        window.skillsData = manager.exportData();

        return {
            manager,
            container,
            selectSkill,
            doPractice,
            reset: resetAll
        };
    }

    // ========== 独立初始化 ==========
    window.wuxiaSkills = {
        Skill,
        SkillsManager,
        MASTERY_LEVELS,
        createWoodenDummyUI,
        SKILLS_DEF
    };

    // 自动导出数据
    const _defaultManager = new SkillsManager();
    window.skillsData = _defaultManager.exportData();

    console.log('📜 武侠·崛起 — 武功系统已加载');
    console.log(`📊 共 ${_defaultManager.getAllSkills().length} 门武功，${MASTERY_LEVELS.length} 层熟练度`);

})();
