# 文件上传下载

```bash
# 后端启 2020 端口
$ cd server
$ nodemon app.js

# 前端
$ cd static
$ vue serve App.vue
```

demo 没做啥兼容，最好只上传一些常规的文件，比如 json, html, 图片文件等

## 文件上传

文件上传的整体思路是，前端发起 post 请求，body 中携带文件，后端保存文件内容到服务器硬盘中，一般 koa 通过中间件，能用 ctx.request.files 或者 ctx.request.body.files 获取到上传的文件，然后保存即可

之前用的中间件是 koa-bodyparser，这个中间件不支持 multipart/form-data，也就不支持 files 上传（详细可以看 [这个 issue](https://github.com/koajs/bodyparser/issues/94))

推荐的文件上传中间件是 [formidable](https://www.npmjs.com/package/formidable)，koa-body 恰好集成了它，所以直接用 koa-body 就可以实现了（如果用 formidable，则直接在上传接口中操作就可以了）

一般的过程是，上传文件，为该文件设置个 key，将文件名存库（demo 中用 upload-files.json 这个文件模拟数据库存取），保存文件（一般文件名为随机字符串），这样通过 key 就能找到文件所有资料

## 文件下载

如果文件内容 **可以是** 前端生成的，直接调用 blob 就能实现下载，这很方便，对于要下载 json 数据，或者下载个 html 文件这样子（主要是用了 a 标签的 download 属性，以及 blob 的特性）

```js
const blob = new Blob([JSON.stringify(jsonContent)])
const eleLink = document.createElement("a")
eleLink.href = window.URL.createObjectURL(blob)
eleLink.download = filename
document.body.appendChild(eleLink)
eleLink.click()
document.body.removeChild(eleLink)
```

如果需要下载的是服务器上的文件，如果能获取到服务器地址（具体链接），**并且服务器地址和前端地址同域**，则直接用 a 标签的 download 属性也能搞定

但是一般情况下文件只会保存在服务器中，而不会提供具体链接，这时则不能用上面的方法

后端需要设置 `'Content-disposition', 'attachment; filename=xxx'`，前端需要构造表单提交或者用 window.open() 粗暴实现（会打开个新窗口，体验不好）

## 总结

* 文件上传就是找一个能支持获取到 ctx.request.files 的中间件，然后将文件保存到服务器
* 文件下载分多种情况：
  * 如果数据前端可控，直接用 a 标签 download 属性 + blob 可解
  * 如果数据已经保存在了服务端
    * 不嫌麻烦，前端也可以构造 blob 下载
    * 如果文件位置可以用 url 获取并且域名和前端同域，直接用 a 标签 download 属性可解
    * 用 window.open 或者前端构造表单进行下载（同时搭配后端设置 `'Content-disposition', 'attachment; filename=xxx'`）
