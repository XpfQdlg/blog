/* =====================================================
   tags-json.js —— site 级 Hexo 生成器
   构建时把全站标签输出成 /data/tags.json，
   供页脚标签胶囊（footer-tags.js）运行时拉取渲染。
   好处：标签增删自动同步，不用手维护。
   ===================================================== */
'use strict'

hexo.extend.generator.register('tags-json', function (locals) {
  const root = hexo.config.root // 例如 /blog/
  const base = root.replace(/\/?$/, '/')

  const tags = locals.tags
    .toArray()
    .map(tag => ({
      name: tag.name,
      url: base + tag.path,      // 例如 /blog/tags/hexo/
      count: tag.length
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))

  return {
    path: 'data/tags.json',
    data: JSON.stringify({ tags })
  }
})
