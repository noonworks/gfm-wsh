gfm.js
==========

Convert GFM (GitHub Flavored Markdown) to HTML.


Usage
----------
```
cscript //nologo gfm.js [text] [options]
```


Options
----------

### -f file
GFM file path to convert.
If this is specified, [text] will be ignored.

### -e encoding
The encoding of the file (ex: utf-8)

### -o output
Output file path.
If omitted, the result is output to the stdout.

### -l limit
Use limit check mode. Other arguments will be ignored.
Return the string like 'GitHub API 55/60'.

### -t token
'Personal access token' for GitHub API.
You can get Personal access tokens on [GitHub Setting page](
https://github.com/settings/applications).

* If you set the token, you can use API 5,000 times per hour.
* If not, 60 times per hour.

### --header header_file_path
It will be added to the front of the result.

### --footer footer_file_path
It will be added to the after of the result.

### -c commandline_encoding
Specify the encoding on the command prompt
if you use other than shift_jis.


Example
----------
test.md
```markdown
Hello world github/linguist#1 **cool**, and #1!
```

header.html
```html
<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head>
<body>
```

footer.html
```html

</body></html>
```

command
```
cscript //nologo -f test.md -e utf-8 -o result.html --header header.html --footer footer.html
```

result.html
```html
<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head>
<body>
<p>Hello world github/linguist#1 <strong>cool</strong>, and #1!</p>
</body></html>
```


License
----------
`gfm.js` is released under the MIT License.
http://opensource.org/licenses/mit-license.php

### Thanks
`github.css` is included in the repository [revolunet/sublimetext-markdown-preview](
https://github.com/revolunet/sublimetext-markdown-preview). Thanks.
