const fs = require('fs');
['articles/page.tsx', 'jobs/page.tsx', 'tenders/page.tsx'].forEach(f => {
  const p = 'apps/web/app/admin/dashboard/' + f;
  if(fs.existsSync(p)){
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/<ArticleFormModal open=\{formOpen\} onClose=\{\(\) => setFormOpen\(false\)\} article=\{editingArticle\} \/>/, '<ArticleFormModal key={editingArticle ? editingArticle.id : "new"} open={formOpen} onClose={() => setFormOpen(false)} article={editingArticle} />');
    content = content.replace(/<JobFormModal open=\{formOpen\} onClose=\{\(\) => setFormOpen\(false\)\} job=\{editingJob\} \/>/, '<JobFormModal key={editingJob ? editingJob.id : "new"} open={formOpen} onClose={() => setFormOpen(false)} job={editingJob} />');
    content = content.replace(/<TenderFormModal open=\{formOpen\} onClose=\{\(\) => setFormOpen\(false\)\} tender=\{editingTender\} \/>/, '<TenderFormModal key={editingTender ? editingTender.id : "new"} open={formOpen} onClose={() => setFormOpen(false)} tender={editingTender} />');

// also replace for users page or any other
    fs.writeFileSync(p, content);
    console.log('Fixed', p);
  }
});
