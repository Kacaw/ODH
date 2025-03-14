/* global api */
class twtw_moedict {
    constructor(options) {
        this.options = options;
        this.maxexample = 2;
        this.word = '';
    }

    async displayName() {
        let locale = await api.locale();
        if (locale.indexOf('CN') != -1) return '台语萌典（繁体）';
        if (locale.indexOf('TW') != -1) return '臺語萌典（繁體）';
        return 'Moedict TW->TW Dictionary (TC)';
    }

    setOptions(options) {
        this.options = options;
        this.maxexample = options.maxexample;
    }

    async findTerm(word) {
        this.word = word;
        let promises = [this.findMoedict(word), this.findSuisiann(word)];
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

        let base = "https://www.moedict.tw/'";
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
        //console.log("-----萌典 debug start");

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
            /*   if (readings) {
                let reading_uk = T(readings[0]);
                let reading_us = T(readings[1]);
                reading = (reading_uk || reading_us) ? `UK[${reading_uk}] US[${reading_us}] ` : '';
            } */
            
            /* audio */
            let audioMeta = entry.querySelectorAll("h1>i>meta");
            
            audios[0] = audioMeta[1].getAttribute("content");
            // audios[0] = entry.querySelector("h1>i>meta");
            // audios[0] = audios[0] ? 'https://dictionary.cambridge.org' + audios[0].getAttribute('src') : '';
            // audios[0] = audios[0].replace('https', 'http');
            // audios[1] = entry.querySelector(".us.dpron-i source");
            // audios[1] = audios[1] ? 'https://dictionary.cambridge.org' + audios[1].getAttribute('src') : '';
            //audios[1] = audios[1].replace('https', 'http');

            let entryItem = entry.querySelectorAll('.entry-item') || [];
            
            
            for (const ent of entryItem) {
                let definition = '';
                
                // 同音不同詞性部份
                let partOfSpeech = ent.querySelectorAll('.part-of-speech') ;
                let pos = T(partOfSpeech[0]);
                pos = pos ? `<span class='pos'>${pos}</span><br>` : '';
                definition += pos;
                //console.log(T(partOfSpeech[0]));
                
                let moeDefines = ent.querySelectorAll('.definition') ;
                for (const moeDefine of moeDefines){
                    //console.log(moeDefine);
                    let defExp = moeDefine.querySelectorAll('.def') ;
                    let eng_tran = T(defExp[0]);
                    let tran = `<span class='tran'>${eng_tran}</span>`
                    definition += tran ;
                    
                    let examples = moeDefine.querySelectorAll('.example') ;
                    if ( examples.length > 0 ){
                        definition += '<ul class="sents">';
                        for (const example of examples){
                            // 截取白話字句子
                            let exampleHref = example.querySelectorAll('hruby a');
                            let exampleSentences = "";
                            for (const word of exampleHref ){
                                //let dirtyWord = word.getAttribute("href");
                                //dirtyWord = dirtyWord.slice(3);
                                exampleSentences += T(word) ;
                            }
                            
                            // 截取白話字發音
                            let exampleRts = example.querySelectorAll('rt');
                            let examplePronouciation = "";
                            for (const exampleRt of exampleRts ){
                                let dirtyWord = T(exampleRt);
                                examplePronouciation += dirtyWord + " " ;
                            }                        
                            
                            // 截取華語解釋
                            let exampleMandrin = example.querySelectorAll('.mandarin');
                            let exampleMandrinStr = T(exampleMandrin[0]);
                            
                            definition += `<li class='sent'><span class='eng_sent'>${exampleSentences.replace(RegExp(expression, 'gi'),`<b>${expression}</b>`)}</span><br><span class='chn_sent'>${examplePronouciation}</span><br><span class='mdn_sent'>${exampleMandrinStr}</span></li>`;
                            
                        }
                        definition += '</ul>';
                    }
                }
                definition && definitions.push(definition);
/*                 //let sensblocks = sensbody.childNodes || [];
                for (const sensblock of sensblocks) {
                    let phrasehead = '';
                    let defblocks = [];
                    if (sensblock.classList && sensblock.classList.contains('phrase-block')) {
                        phrasehead = T(sensblock.querySelector('.phrase-title'));
                        phrasehead = phrasehead ? `<div class="phrasehead">${phrasehead}</div>` : '';
                        defblocks = sensblock.querySelectorAll('.def-block') || [];
                    }
                    if (sensblock.classList && sensblock.classList.contains('def-block')) {
                        defblocks = [sensblock];
                    }
                    if (defblocks.length <= 0) continue;

                    // make definition segement
                    for (const defblock of defblocks) {
                        let eng_tran = T(defblock.querySelector('.ddef_h .def'));
                        let chn_tran = T(defblock.querySelector('.def-body .trans'));
                        if (!eng_tran) continue;
                        
                        
                        
                        
                        
                        eng_tran = `<span class='eng_tran'>${eng_tran.replace(RegExp(expression, 'gi'),`<b>${expression}</b>`)}</span>`;
                        chn_tran = `<span class='chn_tran'>${chn_tran}</span>`;
                        let tran = `<span class='tran'>${eng_tran}${chn_tran}</span>`;
                        definition += phrasehead ? `${phrasehead}${tran}` : `${pos}${tran}`;

                        // make exmaple segement
                        let examps = defblock.querySelectorAll('.def-body .examp') || [];
                        if (examps.length > 0 && this.maxexample > 0) {
                            definition += '<ul class="sents">';
                            for (const [index, examp] of examps.entries()) {
                                if (index > this.maxexample - 1) break; // to control only 2 example sentence.
                                let eng_examp = T(examp.querySelector('.eg'));
                                let chn_examp = T(examp.querySelector('.trans'));
                                definition += `<li class='sent'><span class='eng_sent'>${eng_examp.replace(RegExp(expression, 'gi'),`<b>${expression}</b>`)}</span><span class='chn_sent'>${chn_examp}</span></li>`;
                            }
                            definition += '</ul>';
                        }
                        definition && definitions.push(definition);
                    }
                } */
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

    async findSuisiann(word) {
        if (!word) return [];
        
        function T(node) {
            if (!node)
                return '';
            else
                return node.innerText.trim();
        }

        function unicodeToChar(text) {
          return text.replace(/\\u[\dA-F]{4}/gi, 
          function (match) {
               return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
          });
        }        

        
        
        let romanBase = "https://hts.ithuan.tw/%E7%BE%85%E9%A6%AC%E5%AD%97%E8%BD%89%E6%8F%9B?%E6%9F%A5%E8%A9%A2%E8%AA%9E%E5%8F%A5=";
        let romanUrl = romanBase + encodeURIComponent(word);
        
        let base = 'https://suisiann.ithuan.tw/%E8%AC%9B/';
        let url = base + encodeURIComponent(word);
        
        let doc = '';
        let parsed = '';
   
        try {
            let dataRoman = await api.fetch(romanUrl);
            let parser = new DOMParser();
            let decodedData = unicodeToChar(dataRoman);
            //console.log(decodedData);
            
            parsed = JSON.parse(decodedData);
            
            //let data = await api.fetch(url);
            //doc = parser.parseFromString(data, 'text/html');
        } catch (err) {
            return [];
        }

        let notes = [];

        //get headword and phonetic
        let expression = word; //headword
        
        let reading = "" ;
        if ( parsed["臺羅"] == word ){ reading += `<span class='wordtype'>臺羅</span>`;}
        if ( parsed["白話字"] == word ){ reading += `<span class='wordtype'>白話字</span>`;}
        reading += `<br><span class='pos'>臺羅</span>${parsed["臺羅"]}<br><span class='pos'>白話字</span>${parsed["白話字"]}`;
        
        let audios = [];
        
        audios[0] = `https://hapsing.ithuan.tw/bangtsam?taibun=${encodeURIComponent(parsed["臺羅"])}`;
        
        
        //audios[1] = `http://dict.youdao.com/dictvoice?audio=${encodeURIComponent(expression)}&type=2`;

        // let definition = '<ul class="ec">';
        // for (const defNode of defNodes){
            // let pos = '';
            // let def = T(defNode);
            // let match = /(^.+?\.)\s/gi.exec(def);
            // if (match && match.length > 1){
                // pos = match[1];
                // def = def.replace(pos, '');
            // }
            // pos = pos ? `<span class="pos simple">${pos}</span>`:'';
            // definition += `<li class="ec">${pos}<span class="ec_chn">${def}</span></li>`;
        // }
        // definition += '</ul>';
        let css = `
            <style>
                span.pos  {text-transform:lowercase; font-size:0.9em; margin-right:5px; padding:2px 4px; color:white; background-color:#0d47a1; border-radius:3px;}
                span.wordtype  {text-transform:lowercase; font-size:0.9em; margin-right:5px; padding:2px 4px; color:white; background-color:#0da14b; border-radius:3px;}
                span.simple {background-color: #999!important}
                ul.ec, li.ec {margin:0; padding:0;}
            </style>`;
        //let css = this.renderCSS();
        notes.push({
            css,
            expression,
            reading,
            definitions: [''],//definition],
            audios
        });
        return notes;
    }
    /* async findYoudao(word) {
        if (!word) return [];

        let base = 'http://dict.youdao.com/w/';
        let url = base + encodeURIComponent(word);
        let doc = '';
        try {
            let data = await api.fetch(url);
            let parser = new DOMParser();
            doc = parser.parseFromString(data, 'text/html');
            let youdao = getYoudao(doc); //Combine Youdao Concise English-Chinese Dictionary to the end.
            let ydtrans = getYDTrans(doc); //Combine Youdao Translation (if any) to the end.
            return [].concat(youdao, ydtrans);
        } catch (err) {
            return [];
        }

        function getYoudao(doc) {
            let notes = [];

            //get Youdao EC data: check data availability
            let defNodes = doc.querySelectorAll('#phrsListTab .trans-container ul li');
            if (!defNodes || !defNodes.length) return notes;

            //get headword and phonetic
            let expression = T(doc.querySelector('#phrsListTab .wordbook-js .keyword')); //headword
            let reading = '';
            let readings = doc.querySelectorAll('#phrsListTab .wordbook-js .pronounce');
            if (readings) {
                let reading_uk = T(readings[0]);
                let reading_us = T(readings[1]);
                reading = (reading_uk || reading_us) ? `${reading_uk} ${reading_us}` : '';
            }

            let audios = [];
            audios[0] = `http://dict.youdao.com/dictvoice?audio=${encodeURIComponent(expression)}&type=1`;
            audios[1] = `http://dict.youdao.com/dictvoice?audio=${encodeURIComponent(expression)}&type=2`;

            let definition = '<ul class="ec">';
            for (const defNode of defNodes){
                let pos = '';
                let def = T(defNode);
                let match = /(^.+?\.)\s/gi.exec(def);
                if (match && match.length > 1){
                    pos = match[1];
                    def = def.replace(pos, '');
                }
                pos = pos ? `<span class="pos simple">${pos}</span>`:'';
                definition += `<li class="ec">${pos}<span class="ec_chn">${def}</span></li>`;
            }
            definition += '</ul>';
            let css = `
                <style>
                    span.pos  {text-transform:lowercase; font-size:0.9em; margin-right:5px; padding:2px 4px; color:white; background-color:#0d47a1; border-radius:3px;}
                    span.simple {background-color: #999!important}
                    ul.ec, li.ec {margin:0; padding:0;}
                </style>`;
            notes.push({
                css,
                expression,
                reading,
                definitions: [definition],
                audios
            });
            return notes;
        }

        function getYDTrans(doc) {
            let notes = [];

            //get Youdao EC data: check data availability
            let transNode = doc.querySelectorAll('#ydTrans .trans-container p')[1];
            if (!transNode) return notes;

            let definition = `${T(transNode)}`;
            let css = `
                <style>
                    .odh-expression {
                        font-size: 1em!important;
                        font-weight: normal!important;
                    }
                </style>`;
            notes.push({
                css,
                definitions: [definition],
            });
            return notes;
        }

        function T(node) {
            if (!node)
                return '';
            else
                return node.innerText.trim();
        }
    } */

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
