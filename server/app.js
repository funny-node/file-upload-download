const Koa = require('koa')
const koaBody = require('koa-body')
const cors = require('@koa/cors')
const Router = require('koa-router')
const path = require('path')
const fs = require('fs')

const UploadPath = path.join(__dirname, 'upload-files/')

const app = new Koa()
app.use(cors())
app.use(require('koa-static')(path.join(__dirname, 'public')))

app.use(koaBody({
  multipart: true, // 支持文件上传
  // encoding: 'gzip',
  // 文件保存设置
  formidable: {
    uploadDir: UploadPath, // 设置文件上传目录
    keepExtensions: true,    // 保持文件的后缀
    // maxFieldsSize:2 * 1024 * 1024, // 文件上传大小
    onFileBegin: (name, file) => { // 文件上传前的设置
      const savedFilesList = JSON.parse(fs.readFileSync('./upload-files.json', 'utf-8'))
      savedFilesList.push({ name: file.name, path: path.basename(file.path) })
      fs.writeFileSync('./upload-files.json', JSON.stringify(savedFilesList))
    }
  }
}))

const router = new Router()

/**
 * 上传接口
 */
router.post('/upload', async (ctx, next) => {
  ctx.body = {
    code: 0
  }
  next()
})

/**
 * 下载接口
 * get 形式，用于 window.open 形式的下载
 */
router.get('/download', async (ctx, next) => {
  // 文件在服务器的真实地址
  const filePath = path.join(UploadPath, ctx.request.query.path)
  const filename = ctx.request.query.name
  ctx.body = fs.createReadStream(filePath)
  ctx.set('Content-disposition', 'attachment; filename=' + filename)
  // ctx.set('Content-type', 'text/html');
  next()
})

/**
 * 下载接口
 * post 形式，用于构造表单下载
 */
router.post('/download', async (ctx, next) => {
  // 文件在服务器的真实地址
  const filePath = path.join(UploadPath, ctx.request.body.path)
  const filename = ctx.request.body.name
  ctx.body = fs.createReadStream(filePath)
  ctx.set('Content-disposition', 'attachment; filename=' + filename)
  ctx.set('Content-type', 'text/html');
  next()
})

/**
 * 获取文件列表
 * upload-files.json 模拟数据库存储
 */
router.get('/files', async (ctx, next) => {
  const files = JSON.parse(fs.readFileSync(path.join(__dirname, './upload-files.json')))

  ctx.body = {
    code: 0,
    data: {
      files
    }
  }
  next()
})

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(2020)