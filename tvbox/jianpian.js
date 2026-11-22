// 荐片 (jianpian) CatVod JS spider — H5 API 版
// API: https://h5.jianpianips1.com/api  搜索/详情/周榜 实测可用(无签名)
// 播放: detail 返回的 m3u8 直链(AES-128 HLS, 播放器原生解)
var HOST = 'https://h5.jianpianips1.com';
var IMG = 'https://img.cqkgy.com';
var UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';

function fetchJson(url) {
    try {
        var r = req(url, { headers: { 'User-Agent': UA } });
        if (r && r.content) return JSON.parse(r.content);
    } catch (e) {}
    return null;
}

function pic(p) {
    if (!p) return '';
    if (p.indexOf('http') === 0) return p;
    return IMG + p;
}

function toVod(it) {
    return {
        vod_id: '' + it.id,
        vod_name: it.title || '',
        vod_pic: pic(it.thumbnail || it.path || ''),
        vod_remarks: it.score ? ('评分 ' + it.score) : (it.status || ''),
        vod_year: it.year || (it.years ? ('' + it.years) : '')
    };
}

var spider = {
    init: function (cfg) {},
    home: function (filter) {
        var classes = [
            { type_id: '1', type_name: '电影' },
            { type_id: '2', type_name: '电视剧' },
            { type_id: '67', type_name: '短剧' },
            { type_id: '3', type_name: '动漫' },
            { type_id: '4', type_name: '综艺' }
        ];
        return JSON.stringify({ 'class': classes, filters: {} });
    },
    homeVod: function () {
        var d = fetchJson(HOST + '/api/weekRank/list?category_id=1');
        var list = [];
        if (d && d.data) {
            for (var i = 0; i < d.data.length; i++) list.push(toVod(d.data[i]));
        }
        return JSON.stringify({ list: list });
    },
    category: function (tid, pg, filter, extend) {
        var d = fetchJson(HOST + '/api/weekRank/list?category_id=' + tid);
        var list = [];
        if (d && d.data) {
            for (var i = 0; i < d.data.length; i++) list.push(toVod(d.data[i]));
        }
        return JSON.stringify({ list: list, page: 1, pagecount: 1, limit: list.length, total: list.length });
    },
    detail: function (id) {
        var d = fetchJson(HOST + '/api/video/detailv2?id=' + id);
        if (!d || !d.data) return JSON.stringify({ list: [] });
        var n = d.data;
        var froms = [];
        var urls = [];
        var lines = n.source_list_source || [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var eps = line.source_list || [];
            var parts = [];
            for (var j = 0; j < eps.length; j++) {
                var ep = eps[j];
                if (ep.url) parts.push((ep.source_name || ('第' + (j + 1) + '集')) + '$' + ep.url);
            }
            if (parts.length > 0) {
                froms.push(line.name || ('线路' + (i + 1)));
                urls.push(parts.join('#'));
            }
        }
        var vod = {
            vod_id: '' + n.id,
            vod_name: n.title || '',
            vod_pic: pic(n.thumbnail || ''),
            vod_remarks: n.definition || '',
            vod_year: n.year || '',
            vod_actor: (n.actors || []).join(','),
            vod_director: (n.directors || []).join(','),
            vod_content: n.description || '',
            vod_play_from: froms.join('$$$'),
            vod_play_url: urls.join('$$$')
        };
        return JSON.stringify({ list: [vod] });
    },
    play: function (flag, id, flags) {
        return JSON.stringify({ parse: 0, playUrl: '', url: id, header: { 'User-Agent': UA } });
    },
    search: function (wd, quick, pg) {
        var page = pg || 1;
        var d = fetchJson(HOST + '/api/v2/search/videoV2?key=' + encodeURIComponent(wd) + '&page=' + page);
        var list = [];
        if (d && d.data) {
            for (var i = 0; i < d.data.length; i++) list.push(toVod(d.data[i]));
        }
        return JSON.stringify({ list: list, page: page, pagecount: 999, limit: list.length, total: 999 });
    },
    isVideoFormat: function (url) { return false; },
    manualVideoCheck: function () { return false; },
    destroy: function () {}
};
