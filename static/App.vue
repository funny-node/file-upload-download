<template>
  <div>
    <el-upload
      action="http://localhost:2020/upload"
      :file-list="fileList"
      :on-success="handleSuccess"
      :show-file-list="false"
      multiple
      >
      <el-button size="small" type="primary">点击上传</el-button>
    </el-upload>

    <template>
      <el-table
        :data="fileList"
      >
        <el-table-column
          prop="name"
          label="文件名"
        />
        <el-table-column
          label="操作">
          <template slot-scope="scope">
            <el-button size="small" type="primary" @click="handleClick(scope.row.name, scope.row.path)">
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <el-divider></el-divider>

    <el-button size="small" type="primary" @click="handleDownloadJson">
      在线生成 json 文件并下载
    </el-button>
  </div>
</template>

<script>
import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import axios from 'axios'
import { downloadFileOnline, downloadFile } from './helper'

Vue.use(ElementUI)

export default {
  data() {
    return {
      fileList: []
    }
  },
  methods: {
    handleDownloadJson () {
      // fake 内容
      const jsonContent = {
        code: 0,
        data: {
          name: 'fish',
          age: 30
        }
      }
      
      // fake 文件名
      const filename = Math.random() + '.json'

      downloadFileOnline(jsonContent, filename)
    },
    handleSuccess (response, file, fileList) {
      console.log(response, file, fileList)
      this.fetchFilesList()
    },
    handleClick (name, path) {
      // axios.post('http://localhost:2020/download')
      // window.open(`http://localhost:2020/download?name=${name}&path=${path}`)
      downloadFile({
        url: 'http://localhost:2020/download',
        params: {
          name,
          path
        }
      })
    },
    fetchFilesList () {
      axios.get('http://localhost:2020/files')
        .then(res => {
          this.fileList = res.data.data.files
        })
    }
  },
  created () {
    this.fetchFilesList()
  }
}
</script>