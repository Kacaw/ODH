/* global api */
class amiszh_NewAmisMoedict {
    constructor(options) {
        this.options = options;
        this.baseUrl = "https://new-amis.moedict.tw/terms/";
    }

    // 顯示名稱，根據使用者語言環境返回適當名稱
    async displayName() {
        let locale = await api.locale();
        if (locale.indexOf('CN') != -1) return '阿美語萌典 (線上)';
        if (locale.indexOf('TW') != -1) return '阿美語萌典 (線上)';
        return 'New Amis Moedict (Online)';
    }

    // 設置選項（目前未使用，但保留兼容性）
    setOptions(options) {
        this.options = options;
    }

    // 查詢詞彙
    async findTerm(word) {
        this.word = word;
        return this.findAmisWord(word);
    }

    async findAmisWord(word) {
        let notes = [];

        if (!word) return notes;

        try {
            const queryUrl = `${this.baseUrl}${encodeURIComponent(word)}`;
            const response = await fetch(queryUrl);
            if (!response.ok) {
                throw new Error("查詢失敗，HTTP 狀態碼：" + response.status);
            }
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            // 選擇所有字典區域
            const dictionaryElements = doc.querySelectorAll(".dictionaries");
            if (dictionaryElements.length === 0) return notes;

            let definitions = [];
            dictionaryElements.forEach((dict) => {
                // 提取字典名稱
                const dictName = dict.querySelector("div[class*='bg-']")?.innerText.trim() || "未知字典";
                definitions.push(`<div class="dict-name">${dictName}</div>`);

                // 提取詞幹資訊
                const termInfo = dict.querySelector(".term-into .text-gray-500")?.innerText.trim();
                if (termInfo) definitions.push(`<span class="term-info">${termInfo}</span>`);

                // 提取詞頻（如果有）
                const frequency = dict.querySelector(".ilrdf-term-info .text-gray-500")?.innerText.trim();
                if (frequency) definitions.push(`<span class="frequency">${frequency}</span>`);

                // 提取定義、範例和同義詞
                const listItems = dict.querySelectorAll("ol.list-decimal li");
                let defContent = '<ol class="definitions">';
                listItems.forEach((item, i) => {
                    defContent += `<li>${item.innerHTML}</li>`; // 保留 HTML 結構
                });
                defContent += '</ol>';
                definitions.push(defContent);
            });

            // 組裝結果
            const css = this.renderCSS();
            notes.push({
                css,
                expression: word,
                reading: "", // 阿美語無音標，可留空或添加發音資訊
                extrainfo: "",
                definitions,
                audios: [] // 可選：若有音檔可添加
            });

            return notes;
        } catch (error) {
            console.error("查詢過程中發生錯誤：" + error.message);
            return notes;
        }
    }

    // 渲染 CSS 樣式
    renderCSS() {
        return `
            <style>
                .dict-name {font-weight: bold; color: #ffffff; background-color: #0d47a1; padding: 4px 8px; margin-bottom: 5px; border-radius: 3px;}
                .term-info {font-size: 0.9em; color: #6b7280; display: block; margin-bottom: 5px;}
                .frequency {font-size: 0.85em; color: #6b7280; display: block; margin-bottom: 5px;}
                ol.definitions {list-style-type: decimal; margin-left: 20px; padding-left: 0;}
                ol.definitions li {margin-bottom: 10px;}
                ul {list-style-type: disc; margin-left: 20px; padding-left: 0;}
                a {color: #1e40af; text-decoration: underline;}
                a:hover {color: #0070a3; background-color: #e5e7eb;}
                span.bg-stone-500 {background-color: #78716c; color: white; padding: 2px 4px; border-radius: 3px; margin-right: 5px;}
            </style>`;
    }
}
