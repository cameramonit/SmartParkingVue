<template>
  <el-form-item prop="parking" label="停车场: ">

    <el-select clearable v-model="state.form.parking" placeholder="请选择停车场" style="width: 100%">
      <el-option v-for="item in state.parking" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>

  </el-form-item>

  <div slot="left" class="demo-split-pane">
    <video style="height:320px;width: 100%;align-content: center;margin-top: 20px" id="video"></video>
    <canvas id="qr-canvas"></canvas>

    <el-button type="warning" class="ml5" @click="openMedia">
      <el-icon style="vertical-align: middle">
        <RefreshLeft />
      </el-icon>  <span style="vertical-align: middle"> 开启摄像头 </span>
    </el-button>


    <el-button type="warning" class="ml5" @click="closeMedia">
      <el-icon style="vertical-align: middle">
        <RefreshLeft />
      </el-icon>  <span style="vertical-align: middle"> 关闭摄像头 </span>
    </el-button>


    <el-button type="warning" class="ml5" @click="drawMedia">
      <el-icon style="vertical-align: middle">
        <RefreshLeft />
      </el-icon>  <span style="vertical-align: middle"> 视频截取 </span>
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
const uploadData = ref({})
const licensePlate = ref('')



const state = reactive({
  tableData: [],
  form: {},
  parkingInfo :[]

})


const handleSuccess = (response, file) => {
  if (response.code == 200) {
    ElMessage.success(response.data)
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
    }
  }
}

let canvas, context
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
function drawMedia() {
  canvas.setAttribute('width', video.videoWidth)
  canvas.setAttribute('height', video.videoHeight)
  context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)

}

onMounted(() => {
  init()
})
</script>
