/* global api */
class amiszh_NewAmisMoedict {
    constructor(options) {
        this.options = options;
        this.baseUrl = "https://new-amis.moedict.tw/terms/";
    }

    async displayName() {
        let locale = await api.locale();
        if (locale.indexOf('CN') != -1) return '阿美語萌典 (線上)';
        if (locale.indexOf('TW') != -1) return '阿美語萌典 (線上)';
        return 'New Amis Moedict (Online)';
    }

    setOptions(options) {
        this.options = options;
    }

    async findTerm(word) {
        console.log("Finding term:", word); // 記錄查詢詞
        this.word = word;
        return this.findAmisWord(word);
    }

    async findAmisWord(word) {
        let notes = [];
        console.log("Starting findAmisWord for:", word);

        if (!word) {
            console.log("No word provided");
            return notes;
        }

        try {
            const queryUrl = `${this.baseUrl}${encodeURIComponent(word)}`;
            console.log("Fetching URL:", queryUrl);
            const response = await fetch(queryUrl, { mode: 'cors' });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            console.log("Fetched HTML length:", html.length);
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            const dictionaryElements = doc.querySelectorAll(".dictionaries");
            if (dictionaryElements.length === 0) {
                console.log("No dictionary elements found");
                return notes;
            }

            let definitions = [];
            dictionaryElements.forEach((dict) => {
                const dictName = dict.querySelector("div[class*='bg-']")?.innerText.trim() || "未知字典";
                definitions.push(`<div class="dict-name">${dictName}</div>`);

                const termInfo = dict.querySelector(".term-into .text-gray-500")?.innerText.trim();
                if (termInfo) definitions.push(`<span class="term-info">${termInfo}</span>`);

                const frequency = dict.querySelector(".ilrdf-term-info .text-gray-500")?.innerText.trim();
                if (frequency) definitions.push(`<span class="frequency">${frequency}</span>`);

                const listItems = dict.querySelectorAll("ol.list-decimal li");
                let defContent = '<ol class="definitions">';
                listItems.forEach((item, i) => {
                    defContent += `<li>${item.innerHTML}</li>`;
                });
                defContent += '</ol>';
                definitions.push(defContent);
            });

            const css = this.renderCSS();
            notes.push({
                css,
                expression: word,
                reading: "",
                extrainfo: "",
                definitions,
                audios: []
            });
            console.log("Returning notes:", notes);
            return notes;
        } catch (error) {
            console.error("Error in findAmisWord:", error);
            return notes;
        }
    }

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
