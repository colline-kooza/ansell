const fs = require('fs');
const files = fs.readdirSync('apps/web/hooks').filter(f => f.endsWith('.ts'));

files.forEach(f => {
  const filePath = 'apps/web/hooks/' + f;
  let content = fs.readFileSync(filePath, 'utf8');
  
  const regex = /const json = await res\.json\(\);\s+if \(!res\.ok\) throw new Error\(json\.message \|\| (.*?)\);/g;
  
  const newContent = content.replace(regex, function(match, fallbackMsg) {
    return 'if (!res.ok) {\n' +
      '  const text = await res.text();\n' +
      '  let errMsg = ' + fallbackMsg + ';\n' +
      '  if (text.includes("{")) {\n' +
      '    try { errMsg = JSON.parse(text).message || errMsg; } catch(e) {}\n' +
      '  } else if (text) {\n' +
      '    errMsg = text;\n' +
      '  }\n' +
      '  throw new Error(errMsg);\n' +
      '}\n' +
      'const json = await res.json();';
  });
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log('Fixed', f);
  }
});
