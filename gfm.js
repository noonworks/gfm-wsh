/*
gfm.js
Copyright (c) 2014 noonworks

This software is released under the MIT License.
http://opensource.org/licenses/mit-license.php

[Usage]
cscript //nologo gfm.js [text] [options]

[Options]
-f file     : GFM file path to convert.
              If this is specified, [text] will be ignored.
-e encoding : The encoding of the file (ex: utf-8)
-o output   : Output file path.
              If omitted, the result is output to the stdout.
-l limit    : Use limit check mode. Other arguments will be ignored.
              Return the string like 'GitHub API 55/60'.
-t token    : 'Personal access token' for GitHub API.
              You can get Personal access tokens on
                [ https://github.com/settings/applications ].
              If you set the token, you can use API 5,000 times per
              hour. If not, 60 times per hour.
--header header_file_path :
              It will be added to the front of the result.
--footer footer_file_path :
              It will be added to the after of the result.
-c commandline_encoding :
              Specify the encoding on the command prompt
              if you use other than shift_jis.
*/

if (typeof GFM2HTML === 'undefined') {
    var GFM2HTML = {};
}

GFM2HTML.baseUrl = 'https://api.github.com:443';
GFM2HTML.xhr = new ActiveXObject('Msxml2.XMLHTTP');
GFM2HTML.rate_limit = null;
GFM2HTML.response = '';
GFM2HTML.access_token = '';
GFM2HTML.responseCharset = 'utf-8';
GFM2HTML.hasResponse = false;

GFM2HTML.adTypeBinary = 1;
GFM2HTML.adTypeText = 2;
GFM2HTML.adReadAll = -1;
GFM2HTML.adSaveCreateOverWrite = 2;

GFM2HTML.setHeader = function() {
    GFM2HTML.xhr.setRequestHeader('User-Agent', 'GFMtoHTML.js');
    if (GFM2HTML.access_token.length != 0)
        GFM2HTML.xhr.setRequestHeader('Authorization',
            'token ' + GFM2HTML.access_token);
};

GFM2HTML.getRateLimit = function() {
    GFM2HTML.hasResponse = false;
    GFM2HTML.xhr.open('GET', GFM2HTML.baseUrl + '/rate_limit');
    GFM2HTML.setHeader();
    GFM2HTML.xhr.send();
    while(true) {
        if (GFM2HTML.xhr.readystate == 4) {
            GFM2HTML.rate_limit = null;
            if (GFM2HTML.xhr.status == 200) {
                try {
                    eval('GFM2HTML.rate_limit = ' +
                        GFM2HTML.xhr.responseText + ' ;');
                } catch (e) {
                    GFM2HTML.rate_limit = null;
                }
            }
            GFM2HTML.hasResponse = true;
            return GFM2HTML.rate_limit;
        }
        WScript.Sleep(100);
    }
};

GFM2HTML.rateLimitRemaining = function() {
    return GFM2HTML.rate_limit['resources']['core']['remaining'];
};

GFM2HTML.rateLimitString = function() {
    if (GFM2HTML.rate_limit == null) {
        return 'could not get rate limits.';
    }
    return 'GutHub API ' +
        GFM2HTML.rate_limit['resources']['core']['remaining'] +
    ' / ' + GFM2HTML.rate_limit['resources']['core']['limit'];
};

GFM2HTML.convertText = function(markdown_string, charset) {
    GFM2HTML.hasResponse = false;
    GFM2HTML.xhr.open('POST', GFM2HTML.baseUrl + '/markdown/raw');
    GFM2HTML.setHeader();
    GFM2HTML.xhr.setRequestHeader('Content-Type',
        'text/plain; charset=' + charset);
    GFM2HTML.xhr.send(markdown_string);
    while(true) {
        if (GFM2HTML.xhr.readystate == 4) {
            var ct = GFM2HTML.xhr.getResponseHeader('Content-Type');
            var i = ct.indexOf('charset=');
            if (i >= 0) {
                GFM2HTML.responseCharset =
                    ct.substring(i + 8, ct.length);
            }
            GFM2HTML.hasResponse = true;
            return true;
        }
        WScript.Sleep(100);
    }
};

GFM2HTML.readFile = function(filename, charset) {
    if (typeof charset === 'undefined' || charset == null) {
        charset = '_autodetect_all';
    }
    var stream = new ActiveXObject('ADODB.Stream');
    stream.Type = GFM2HTML.adTypeText;
    stream.charset = charset;
    stream.Open();
    stream.LoadFromFile(filename);
    var text = stream.ReadText(GFM2HTML.adReadAll);
    stream.Close();
    return text;
};

GFM2HTML.toNoBOMBinary = function(text) {
    var stream = new ActiveXObject('ADODB.Stream');
    stream.Type = GFM2HTML.adTypeText;
    stream.charset = 'utf-8';
    stream.Open();
    stream.WriteText(text);
    stream.Position = 0;
    stream.Type = GFM2HTML.adTypeBinary;
    stream.Position = 3;
    var bin = stream.Read();
    stream.Close();
    return bin;
};

GFM2HTML.mergeToText = function(header_txt, content_bin, footer_txt) {
    var stream = new ActiveXObject('ADODB.Stream');
    stream.Type = GFM2HTML.adTypeBinary;
    stream.Open();
    if (header_txt.length > 0) {
        var header_bin = GFM2HTML.toNoBOMBinary(header_txt);
        stream.Write(header_bin);
    }
    stream.Write(content_bin);
    if (footer_txt.length > 0) {
        var footer_bin = GFM2HTML.toNoBOMBinary(footer_txt);
        stream.Write(footer_bin);
    }
    stream.Position = 0;
    stream.Type = GFM2HTML.adTypeText;
    stream.charset = 'utf-8';
    var txt = stream.ReadText(GFM2HTML.adReadAll);
    stream.Close();
    return txt;
};

GFM2HTML.writeFile = function(filename, header_txt,
                                content_bin, footer_txt) {
    var stream = new ActiveXObject('ADODB.Stream');
    stream.Type = GFM2HTML.adTypeBinary;
    stream.Open();
    if (header_txt.length > 0) {
        var bin = GFM2HTML.toNoBOMBinary(header_txt);
        stream.Write(bin);
    }
    stream.Write(content_bin);
    if (footer_txt.length > 0) {
        var bin = GFM2HTML.toNoBOMBinary(footer_txt);
        stream.Write(bin);
    }
    stream.SaveToFile(filename, GFM2HTML.adSaveCreateOverWrite);
    stream.Close();
};

GFM2HTML.parseArguments = function() {
    var objArgs = WScript.Arguments;
    var params = { text:null, file:null, rate_limit_mode:false,
        cmd_encoding: 'shift_jis', header:null, footer:null,
        outfile:'', encoding:'_autodetect_all' }
    var flg = '';
    var needFSO = false;
    for (var i = 0; i < objArgs.length; i++) {
        switch (flg) {
            case '':
                switch (objArgs(i).toLowerCase()) {
                    case '-f':
                    case '-t':
                    case '-e':
                    case '-c':
                    case '-o':
                    case '--header':
                    case '--footer':
                        flg = objArgs(i).toLowerCase();
                        break;
                    case '-l':
                        params['rate_limit_mode'] = true;
                        needFSO = true;
                        break;
                    default:
                        params['text'] = objArgs(i);
                }
                break;
            case '-f':
                params['file'] = objArgs(i);
                flg = ''; break;
            case '-t':
                GFM2HTML.access_token = objArgs(i);
                flg = ''; break;
            case '-e':
                params['encoding'] = objArgs(i);
                flg = ''; break;
            case '-c':
                params['commandline_encoding'] = objArgs(i);
                flg = ''; break;
            case '-o':
                params['outfile'] = objArgs(i);
                flg = ''; break;
            case '--header':
                params['header'] = objArgs(i);
                needFSO = true;
                flg = ''; break;
            case '--footer':
                params['footer'] = objArgs(i);
                needFSO = true;
                flg = ''; break;
        }
    }
    if (needFSO) {
        GFM2HTML.fso =
            new ActiveXObject('Scripting.FileSystemObject');
    }
    return params;
};

GFM2HTML.readTemplate = function(filename, params) {
    if (filename == null || filename.length == 0) {
        return '';
    }
    var txt = GFM2HTML.readFile(filename, 'utf-8');
    var template_dir = GFM2HTML.fso.GetParentFolderName(
        GFM2HTML.fso.GetAbsolutePathName(filename));
    var outfile = GFM2HTML.fso.GetAbsolutePathName(params['outfile']);
    txt = txt.replace(
        /<!-- GFMtoHTML_template_dir -->/g, template_dir);
    txt = txt.replace(
        /<!-- GFMtoHTML_output_file_name -->/g,
        GFM2HTML.fso.GetFileName(outfile));
    return txt;
};

GFM2HTML.main = function() {
    var params = GFM2HTML.parseArguments();
    if (params['rate_limit_mode']) {
        GFM2HTML.getRateLimit();
        if (params['outfile'] == '') {
            WScript.StdOut.WriteLine(GFM2HTML.rateLimitString());
        } else {
            var file =
                GFM2HTML.fso.OpenTextFile(params['outfile'], 2, true);
            file.Write(GFM2HTML.rateLimitString());
            file.Close();
        }
        return;
    }
    if (params['file'] != null) {
        GFM2HTML.convertText(
            GFM2HTML.readFile(params['file'], params['encoding']));
    } else {
        GFM2HTML.convertText(params['text'], params['cmd_encoding']);
    }
    if (GFM2HTML.hasResponse) {
        var header = GFM2HTML.readTemplate(params['header'], params);
        var footer = GFM2HTML.readTemplate(params['footer'], params);
        if (params['outfile'] == '') {
            WScript.StdOut.WriteLine(GFM2HTML.mergeToText(header,
                GFM2HTML.xhr.responseBody, footer));
        } else {
            GFM2HTML.writeFile(params['outfile'], header,
                GFM2HTML.xhr.responseBody, footer);
        }
    }
};

if (typeof GFM2HTML_NOT_RUN === 'undefined') {
    GFM2HTML.main();
}
