<template>
  <el-form-item prop="parking" label="停车场  : ">

    <el-select clearable v-model="state.form.parking" placeholder="请选择停车场" style="width: 300px" >
      <el-option v-for="item in state.parking" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>

  </el-form-item>

  <div slot="left" class="demo-split-pane" style="background-color:white;height: 350px;border: 5px solid aliceblue;border-radius: 20px">
    <video ref="video" style="height:320px;width: 45%;float: left;margin-top: 10px;" id="video"></video>
    <canvas id="qr-canvas" ref="canvas" style="float: right;height:320px;width: 50%;margin-top: 10px;margin-right: 10px"></canvas>

  </div>
  <div>

    <el-button type="success" class="ml5" @click="openMedia" style="margin: 5px">
      <el-icon style="vertical-align: middle">
        <SwitchButton />
      </el-icon>  <span style="vertical-align: middle"> 开启摄像头 </span>
    </el-button>


    <el-button type="danger" class="ml5" @click="closeMedia" style="margin: 5px">
      <el-icon style="vertical-align: middle">
        <Close/>
      </el-icon>  <span style="vertical-align: middle"> 关闭摄像头 </span>
    </el-button>


    <el-button type="primary " class="ml5" @click="drawMedia" style="margin: 5px">
      <el-icon style="vertical-align: middle">
        <Camera/>
      </el-icon>
      <span style="vertical-align: middle"> 视频截取 </span>
    </el-button>
  </div>

  <el-upload
      drag
      action="http://localhost:8080/distinguish/upload"
      multiple
      :data="uploadData"
      :before-upload="handleUpload"
      :on-success="handleSuccess"
  >
    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
    <div class="el-upload__text">
      上传图片到这里<em>文字识别</em>
    </div>
  </el-upload>
</template>
<script setup>
import { UploadFilled } from '@element-plus/icons-vue'
import request from "@/utils/request";
import {onMounted, reactive, ref} from 'vue'
import { ElMessage } from "element-plus";
import axios from "axios";
import {useUserStore} from "@/stores/user";

const uploadData = ref({})
const licensePlate = ref('')
const userStore = useUserStore()
const user = userStore.getUser
const username  = user.name

const state = reactive({
  tableData: [],
  form: {},
   parking: []

})


const handleSuccess = (response, file) => {
  if (response.code === 200 || response.code==="200") {
    ElMessage.success(response.data)
  } else if (response.code=== 800  || response.code==="800"){
    ElMessage.error(response.msg)
  }else if (response.code===500 || response.code==="500"){
    ElMessage.error(response.msg)
  }else if (response.code===801 || response.code==='801'){
    ElMessage.error(response.msg)
  }else {
    ElMessage.error("识别失败"+response.msg+"  "+ response.code)
  }
}
const handleVideoSuccess = (response, file) => {
  console.log(response.data)
  if (response.data.code == '200') {
    ElMessage.success(response.data.data)
  } else {
    ElMessage.error("识别失败"+response.message)
  }
}

const parkingInfo = async () => {
  try {
    const response = await request.get('/parking/all')
    if (response && response.data) {
      const parking = response.data.map(item => ({
        label: item.name,
        value: item.pid
      }))
      state.parking = parking
      state.form.parking = parking[0].value // 给 v-model 赋初始值
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('获取站点列表数据失败')
  }
}
onMounted(() => {
  parkingInfo()
})


const handleUpload = (file) => {
  if (state.form.parking) {
    const selectedParking = state.parking.find(p => p.value === state.form.parking)
    if (selectedParking) {
      uploadData.value.name = selectedParking.label
      uploadData.value.username = username
    }
  }
}

let context
let canvas
let video = null
let mediaStreamTrack

function init() {
  canvas = document.getElementById('qr-canvas')
  context = canvas.getContext('2d')

 // 一堆兼容代码
  window.URL = (window.URL || window.webkitURL || window.mozURL || window.msURL)
  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {}
  }
  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      var getUserMedia =
          navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia ||
          navigator.msGetUserMedia
      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'))
      }
      return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject)
      })
    }
  }
  openMedia()
}

// 摄像头调用配置
const mediaOpts = {
  audio: false,
  video: { facingMode: 'environment' }
};

// 回调
function successFunc(stream) {
  mediaStreamTrack = stream
  video = document.querySelector('video')
  if ('srcObject' in video) {
    video.srcObject = stream
  } else {
    video.src = window.URL && window.URL.createObjectURL(stream) || stream
  }
  video.play()
}
function errorFunc(err) {
  alert(err.name)
}

// 正式启动摄像头
function openMedia() {
  navigator.mediaDevices.getUserMedia(mediaOpts).then(successFunc).catch(errorFunc)
}

// 关闭摄像头
function closeMedia() {
  mediaStreamTrack.getVideoTracks().forEach(function(track) {
    track.stop()
    context.clearRect(0, 0, context.width, context.height) //清除画布
  })
}

// 截取视频
async function drawMedia() {
  // 截取图像
  let canvas = document.querySelector('#qr-canvas');
  let video = document.querySelector('#video');

  const context = canvas.getContext('2d')
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise(resolve => canvas.toBlob(resolve))

  // 上传图像
  const formData = new FormData()

  const selectedParking = state.parking.find(p => p.value === state.form.parking)

  formData.append('file', blob, 'screenshot.jpg')
  formData.append('name', selectedParking.label);
  formData.append('username', username);

  // 调用上传方法
 const response=await axios.post('http://localhost:8080/distinguish/upload',formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  // 调用 handleUpload 方法，并传递参数 file
  handleUpload(blob)
  console.log(response.data.code)

  if (response.data.code=='200'){
    // 在此处调用 handleSuccess 方法，并将响应和文件对象作为参数传递
    handleVideoSuccess(response, blob)
  }else if (response.data.code){
    ElMessage.error("识别失败")
  }else {
    ElMessage.error("识别失败")
  }

}

onMounted(() => {
  init()
})

</script>