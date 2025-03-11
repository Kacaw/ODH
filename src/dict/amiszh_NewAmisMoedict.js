/* global api */
class amiszh_NewAmisMoedict {
    constructor(options) {
        this.options = options || {};
        this.baseUrl = "https://new-amis.moedict.tw/terms/";
        console.log("Constructor initialized");
    }

    async displayName() {
        try {
            let locale = await api.locale();
            console.log("Locale:", locale);
            if (locale.indexOf('CN') != -1) return '阿美語萌典 (線上)';
            if (locale.indexOf('TW') != -1) return '阿美語萌典 (線上)';
            return 'New Amis Moedict (Online)';
        } catch (e) {
            console.error("Error in displayName:", e);
            return 'New Amis Moedict (Online)';
        }
    }

    setOptions(options) {
        this.options = options || {};
        console.log("Options set:", options);
    }

    async findTerm(word) {
        console.log("Finding term:", word);
        if (!word) {
            console.log("No word provided");
            return [];
        }
        this.word = word;
        return this.findAmisWord(word);
    }

    async findAmisWord(word) {
        console.log("Starting findAmisWord for:", word);
        let notes = [];

        try {
            if (!api || typeof api.requestXHR !== 'function') {
                console.error("API not available");
                return notes;
            }

            const queryUrl = `${this.baseUrl}${encodeURIComponent(word)}`;
            console.log("Requesting URL:", queryUrl);
            const html = await api.requestXHR(queryUrl);
            console.log("Received HTML length:", html ? html.length : 0);

            if (!html) {
                console.log("No HTML received");
                return notes;
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const dictName = doc.querySelector("div[class*='bg-']")?.innerText.trim() || "無字典";
            const definition = doc.querySelector("ol.list-decimal li p")?.innerText || "無定義";

            const css = this.renderCSS();
            notes.push({
                css,
                expression: word,
                reading: "",
                extrainfo: "",
                definitions: [`<div class="dict-name">${dictName}</div>`, `<p>${definition}</p>`],
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
                p {margin: 5px 0;}
            </style>`;
    }
}
