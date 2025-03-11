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
        let promises = [this.findMoedict(word)]; // 只保留 findMoedict，因為 Suisiann 是台語專用
        let results = await Promise.all(promises);
        return [].concat(...results).filter(x => x);
    }

    async findMoedict(word) {
        let notes = [];
        if (!word) return notes; // return empty notes

        function T(node) {
            if (!node)
                return '';
            else
                return node.innerText.trim();
        }

        let base = "https://new-amis.moedict.tw/terms/api/dictionary/";
        let url = base + encodeURIComponent(word);
        let doc = '';
        try {
            let data = await api.fetch(url);
            let parser = new DOMParser();
            doc = parser.parseFromString(data, 'text/html');
        } catch (err) {
            return [];
        }

        let entries = doc.querySelectorAll('#result>div>div:not(.xrefs)') || [];

        for (const entry of entries) {
            let definitions = [];
            let audios = [];
            
            let expression = '' ;
            let allWords = entry.querySelectorAll('h1 rb');
            for(const innerWords of allWords){
                expression += T(innerWords);
            }

            let reading = '';
            let readings = entry.querySelectorAll('h1 rt');
            reading = T(readings[0]);
            
            // 其它發音
            let alternatives = entry.querySelectorAll('h1>small.alternative>.pinyin');
            for(const innerWords of alternatives){
                reading += ", " + T(innerWords);
            }            
            
            let entryItem = entry.querySelectorAll('.entry-item') || [];
            
            for (const ent of entryItem) {
                let definition = '';
                
                // 同音不同詞性部份
                let partOfSpeech = ent.querySelectorAll('.part-of-speech') ;
                let pos = T(partOfSpeech[0]);
                pos = pos ? `<span class='pos'>${pos}</span><br>` : '';
                definition += pos;
                
                let moeDefines = ent.querySelectorAll('.definition') ;
                for (const moeDefine of moeDefines){
                    let defExp = moeDefine.querySelectorAll('.def') ;
                    let eng_tran = T(defExp[0]);
                    let tran = `<span class='tran'>${eng_tran}</span>`
                    definition += tran ;
                    
                    let examples = moeDefine.querySelectorAll('.example') ;
                    if ( examples.length > 0 ){
                        definition += '<ul class="sents">';
                        for (const example of examples){
                            // 假設阿美語也有類似結構，保留原始邏輯
                            let exampleHref = example.querySelectorAll('hruby a');
                            let exampleSentences = "";
                            for (const word of exampleHref ){
                                exampleSentences += T(word) ;
                            }
                            
                            let exampleRts = example.querySelectorAll('rt');
                            let examplePronouciation = "";
                            for (const exampleRt of exampleRts ){
                                let dirtyWord = T(exampleRt);
                                examplePronouciation += dirtyWord + " " ;
                            }                        
                            
                            let exampleMandrin = example.querySelectorAll('.mandarin');
                            let exampleMandrinStr = T(exampleMandrin[0]);
                            
                            definition += `<li class='sent'><span class='eng_sent'>${exampleSentences.replace(RegExp(expression, 'gi'),`<b>${expression}</b>`)}</span><br><span class='chn_sent'>${examplePronouciation}</span><br><span class='mdn_sent'>${exampleMandrinStr}</span></li>`;
                        }
                        definition += '</ul>';
                    }
                }
                definition && definitions.push(definition);
            }
            let css = this.renderCSS();
            notes.push({
                css,
                expression,
                reading,
                definitions,
                audios
            });
        }
        return notes;
    }

    renderCSS() {
        let css = `
            <style>
                div.phrasehead{margin: 2px 0;font-weight: bold;}
                span.star {color: #FFBB00;}
                span.pos  {text-transform:lowercase; font-size:0.9em; margin-right:5px; padding:2px 4px; color:white; background-color:#0d47a1; border-radius:3px;}
                span.tran {margin:0; padding:0;}
                span.eng_tran {margin-right:3px; padding:0;}
                span.chn_tran {color:#0d47a1;}
                ul.sents {font-size:0.8em; list-style:square inside; margin:3px 0;padding:5px;background:rgba(13,71,161,0.1); border-radius:5px;}
                li.sent  {margin:0; padding:0;}
                span.eng_sent {margin-right:5px;}
                span.chn_sent {color:#0d47a1;}
                span.mdn_sent {color:#7d7979;}
            </style>`;
        return css;
    }
}
