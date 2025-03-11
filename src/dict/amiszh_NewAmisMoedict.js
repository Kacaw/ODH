/* global api */
class amis_moedict {
    constructor(options) {
        this.options = options;
        this.maxexample = 2;
        this.word = '';
    }
    
    getName() {
        return 'Coastal Amis Dictionary';
    }
    
    find(text) {
        this.word = text;
        const url = `https://new-amis.moedict.tw/terms/${encodeURIComponent(text)}`;
        return api.get(url).then((data) => {
            return this.parse(data);
        });
    }
    
    parse(data) {
        try {
            let jsonData = JSON.parse(data);
            if (jsonData && jsonData.definition) {
                // 將換行轉換成 HTML 的 <br>
                return jsonData.definition.replace(/\n/g, '<br>');
            } else {
                return 'No definition found.';
            }
        } catch (e) {
            return 'Error parsing response.';
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = amis_moedict;
}
