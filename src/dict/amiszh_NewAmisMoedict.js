// ==UserScript==
// @name         在線詞典助手 - 阿美語版
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  整合阿美語詞典到在線詞典助手
// @author       Modified from flyingmars's twtw_moedict.js
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // 註冊字典
    if (window.ODH && window.ODH.register) {
        window.ODH.register({
            name: 'amis_moedict',
            description: '阿美語詞典 (萌典)',
            url: 'https://new-amis.moedict.tw/terms/',
            search: searchWord
        });
    }

    // 搜尋函數
    function searchWord(word, callback) {
        // 清理輸入詞
        word = word.trim();
        if (!word) {
            callback({error: '請輸入查詢詞'});
            return;
        }

        // 構建查詢URL
        const url = `https://new-amis.moedict.tw/terms/api/dictionary/${encodeURIComponent(word)}`;
        
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Accept': 'application/json'
            },
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data && data.translation) {
                        // 格式化結果
                        let result = formatResult(data);
                        callback({content: result});
                    } else {
                        callback({content: '查無結果'});
                    }
                } catch (e) {
                    callback({error: '解析錯誤: ' + e.message});
                }
            },
            onerror: function() {
                callback({error: '網路錯誤，請稍後再試'});
            }
        });
    }

    // 格式化查詢結果
    function formatResult(data) {
        let result = `<div><h3>${data.title || ''}</h3>`;
        
        // 添加翻譯
        if (data.translation) {
            result += '<div><b>翻譯:</b><ul>';
            for (let lang in data.translation) {
                result += `<li>${lang}: ${data.translation[lang]}</li>`;
            }
            result += '</ul></div>';
        }

        // 添加其他資訊（如果有的話）
        if (data.definition) {
            result += `<div><b>定義:</b> ${data.definition}</div>`;
        }

        if (data.example) {
            result += '<div><b>例句:</b><ul>';
            data.example.forEach(ex => {
                result += `<li>${ex}</li>`;
            });
            result += '</ul></div>';
        }

        result += '</div>';
        return result;
    }

})();