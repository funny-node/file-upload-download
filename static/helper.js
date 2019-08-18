/**
 * 前端下载文件
 * @param {String} content 
 * @param {String} filename 
 */
export const downloadFileOnline = (content, filename) => {
  const blob = new Blob([JSON.stringify(content)])
  const eleLink = document.createElement("a")
  eleLink.href = window.URL.createObjectURL(blob)
  eleLink.download = filename
  document.body.appendChild(eleLink)
  eleLink.click()
  document.body.removeChild(eleLink)
}

export const downloadFile = ({ url, params }) => {
  const form = document.createElement('form')
  form.setAttribute('action', url)
  form.setAttribute('method', 'post')
  
  for (const key in params) {
    const input = document.createElement('input')
    input.setAttribute('type', 'hidden')
    input.setAttribute('name', key)
    input.setAttribute('value', params[key])
    form.appendChild(input)
  }

  document.body.append(form)
  form.submit()
  form.remove()
}