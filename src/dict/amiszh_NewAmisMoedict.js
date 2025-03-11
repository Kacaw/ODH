/* global api */
class amis_moedict {
    constructor(options) {
        this.options = options;
        this.maxexample = 2;
        this.word = '';
    }

    async displayName() {
        let locale = await api.locale();
        if (locale.indexOf('CN') != -1) return '阿美語萌典（繁體）';
        if (locale.indexOf('TW') != -1) return '阿美語萌典（繁體）';
        return 'Moedict Amis Dictionary (TC)';
    }

    setOptions(options) {
        this.options = options;
        this.maxexample = options.maxexample;
    }

    async findTerm(word) {
        this.word = word;
        let results = await this.findMoedict(word);
        return results.filter(x => x);
    }

    async findMoedict(word) {
        let notes = [];
        if (!word) return notes;

        function T(node) {
            if (!node) return '';
            return node.innerText.trim();
        }

        let base = "https://new-amis.moedict.tw/terms/";
        let url = base + encodeURIComponent(word);
        let doc = '';
        try {
            let data = await api.fetch(url);
            let parser = new DOMParser();
            doc = parser.parseFromString(data, 'text/html');
        } catch (err) {
            return [];
        }

        // 詞條名稱
        let expression = T(doc.querySelector('h1')) || word;
        expression = expression.replace(/（詞幹）/, '').trim();

        // 所有字典區塊
        let entries = doc.querySelectorAll('.dictionaries') || [];
        for (const entry of entries) {
            let definitions = [];
            let audios = [];

            // 字典名稱
            let dictName = T(entry.querySelector('.p-2')) || '未知字典';

            // 發音（如果有）
            let reading = '';
            let readingNode = entry.querySelector('.term-into .text-slate-400');
            if (readingNode) reading = T(readingNode);

            // 音訊
            let audioNode = entry.querySelector('audio');
            if (audioNode) audios.push(audioNode.getAttribute('src'));

            // 詞頻（如果有）
            let freqNode = entry.querySelector('.ilrdf-term-info .text-sm');
            let frequency = freqNode ? T(freqNode) : '';

            // 定義列表
            let defList = entry.querySelector('ol.list-decimal');
            if (defList) {
                let defItems = defList.querySelectorAll('li');
                for (const item of defItems) {
                    let definition = '';

                    // 主定義
                    let mainDef = T(item.querySelector('p:first-child')) || '';
                    definition += `<span class='tran'>${mainDef}</span>`;

                    // 例句或子定義
                    let subList = item.querySelector('ul.list-disc');
                    if (subList) {
                        definition += '<ul class="sents">';
                        let examples = subList.querySelectorAll('li');
                        for (const [index, example] of examples.entries()) {
                            if (index >= this.maxexample) break;
                            let exampleText = T(example).replace(RegExp(expression, 'gi'), `<b>${expression}</b>`);
                            definition += `<li class='sent'><span class='eng_sent'>${exampleText}</span></li>`;
                        }
                        definition += '</ul>';
                    }

                    // 同義詞（如果有）
                    let synonymNode = item.querySelector('p .bg-stone-500');
                    if (synonymNode) {
                        let synonyms = Array.from(item.querySelectorAll('p a')).map(a => T(a)).join('、');
                        definition += `<br><span class='synonym'>同 ${synonyms}</span>`;
                    }

                    definitions.push(definition);
                }
            }

            let css = this.renderCSS();
            notes.push({
                css,
                expression: `${dictName}: ${expression}`,
                reading: reading + (frequency ? ` ${frequency}` : ''),
                definitions,
                audios
            });
        }
        return notes;
    }

    renderCSS() {
        return `
            <style>
                div.phrasehead {margin: 2px 0; font-weight: bold;}
                span.star {color: #FFBB00;}
                span.pos {text-transform: lowercase; font-size: 0.9em; margin-right: 5px; padding: 2px 4px; color: white; background-color: #0d47a1; border-radius: 3px;}
                span.tran {margin: 0; padding: 0;}
                span.eng_tran {margin-right: 3px; padding: 0;}
                span.chn_tran {color: #0d47a1;}
                span.synonym {color: #666; font-size: 0.9em;}
                ul.sents {font-size: 0.8em; list-style: square inside; margin: 3px 0; padding: 5px; background: rgba(13,71,161,0.1); border-radius: 5px;}
                li.sent {margin: 0; padding: 0;}
                span.eng_sent {margin-right: 5px;}
                span.chn_sent {color: #0d47a1;}
                span.mdn_sent {color: #7d7979;}
            </style>`;
    }
}
