/* global api */
class twtw_moedict {
    constructor(options) {
        this.options = options;
        this.maxexample = 2;
        this.word = '';
    }

    async displayName() {
        let locale = await api.locale();
        if (locale.indexOf('TW') != -1) return '萌典台語詞典';
        if (locale.indexOf('ZH') != -1) return '萌典台语词典';
        return 'Taiwanese Dictionary';
    }

    setOptions(options) {
        this.options = options;
        this.maxexample = options.maxexample;
    }

    async findTerm(word) {
        this.word = word;
        let results = [];
        if (!word) return results; // empty query

        let base = 'https://www.moedict.tw/t/';
        let url = `${base}${word}.json`;
        try {
            let data = await api.fetch(url);
            let json = JSON.parse(data);
            if (json && json.h) {
                let expressions = json.h.map(entry => this.parseExpression(entry));
                results = results.concat(expressions.filter(exp => exp));
            }
            return results;
        } catch (err) {
            return [];
        }
    }

    parseExpression(entry) {
        if (!entry.d) return;
        let expression = '';
        let definitions = [];
        for (let d of entry.d) {
            if (d.f) {
                definitions.push(`<span class='def'>${d.f}</span>`);
            }
        }
        if (definitions.length > 0) {
            expression = `<div class='twtw_moedict'>${definitions.join('')}</div>`;
        }
        return expression;
    }
}
