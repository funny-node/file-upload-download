# 文件上传下载

```bash
# 后端启 2020 端口
$ cd server
$ nodemon app.js

# 前端
$ cd static
$ vue serve App.vue
```

demo 没做啥兼容（主要是下载时的 Content-type 设置），最好只上传一些常规的文件，比如 json, html, 图片文件等

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
    

---

2019-10-01 补充：

服务开启后，如果需要 Node.js 模拟提交，应该怎么做？

看了下客户端上传个文件，请求头的 `Content-Type` 值是 `multipart/form-data; boundary=----WebKitFormBoundaryFJB5iBjtsb2IUmAq`

Form Data 的值是：

```
------WebKitFormBoundaryFJB5iBjtsb2IUmAq
Content-Disposition: form-data; name="file"; filename="a (1) (3).json"
Content-Type: application/json


------WebKitFormBoundaryFJB5iBjtsb2IUmAq--
```

查看一下 cURL：

```
curl 'http://localhost:2020/upload' -H 'Sec-Fetch-Mode: cors' -H 'Referer: http://localhost:8080/' -H 'Origin: http://localhost:8080' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36' -H 'Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryFJB5iBjtsb2IUmAq' --data-binary $'------WebKitFormBoundaryFJB5iBjtsb2IUmAq\r\nContent-Disposition: form-data; name="file"; filename="a (1) (3).json"\r\nContent-Type: application/json\r\n\r\n\r\n------WebKitFormBoundaryFJB5iBjtsb2IUmAq--\r\n' --compressed
```

然后在命令行复制过去，我们发现虽然还是能生成文件，**但是内容却传不过去**，这不难理解，请求的文件数据根本没有体现嘛（理论上应该传递过去一个二进制流）

[form-data](https://www.npmjs.com/package/form-data) 模块可以很轻松地在 Node 中模拟上传表单

```js
const FormData = require('form-data')
const fs = require('fs');
const form = new FormData()
// 需要上传的文件
form.append('file', fs.createReadStream('./a.json'))

form.submit('http://localhost:2020/upload', function(err, res) {
  console.log(res.statusCode)
})
```

我会有这个需求是因为我需要在一个 laravel-admin 构建的后台批量插入一些数据，也是 form 形式，然后也需要文件，看了下 [文档](https://github.com/form-data/form-data#integration-with-other-libraries)，form-data 库能和 request node-fetch 以及 axios 配合，因为我对 superagent 比较偏爱，最终发现 superagent 应该集成了 form-data，使用起来也是非常方便的（attach 为表单文件字段，field 为表单的其他字段）

```js
/**
 * 提交一道题目
 * img_url：图片在本地地址
 * name: 题目名称
 * level: 关卡（1-3）
 * classify: 答案（1-4）
 */
function postQuestion({ img_url, name, level, classify }) {
  return new Promise(resolve => {
    agent.post('xxx')
      .attach('img_url', img_url)
      .field('name', name)
      .field('status', 'on')
      .field('level', level) // 关卡
      .field('classify', classify) // 答案
      .field('_token', _token)
      .field('_previous_', 'xxx')
      .end((err, res) => {
        if (err || res.statusCode !== 200) {
          resolve({
            code: 201,
            name
          })
        } else {
          resolve({ code: 200 })
        }
      })
  })
}
```
