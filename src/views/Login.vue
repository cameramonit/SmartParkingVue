<script>
import {onMounted, ref,reactive} from "vue";
import axios from "axios";
import {useUserStore} from "@/stores/user";
import SIdentify from '../components/Sidentify.vue';
import {ElMessage} from "element-plus";
import {User,Lock} from '@element-plus/icons-vue'
import router from "../router";
import request from "../utils/request";
// 图形验证码
let identifyCodes = "1234567890"
let identifyCode = ref('')
const failCount = ref(0)
const randomNum = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min)
}
const makeCode = (o, l) => {
  for (let i = 0; i < l; i++) {
    identifyCode.value += o[randomNum(0, o.length)];
  }
}
const refreshCode = () => {
  identifyCode.value = "";
  makeCode(identifyCodes, 4);
}


const loginData = reactive({})
export default {

  name: "Login",
  data(){
    return{
      loginData: {
        username: '',
        password: ''
      },
    }
  },
  methods: {
    handleSubmit(){
      this.$refs.ruleFormRef.validate((valid) => {
        if(valid){
          let _this = this
          console.log("开始校验账号密码")
          if (valid) {
            if (loginData.code==null || loginData.code==""){
              ElMessage.warning('验证码不能为空!')
              return
            }
            // 失败3次触发验证码
            if (loginData.code !== identifyCode.value) {
              ElMessage.warning('验证码错误!')
              return
            }
          }
          // axios.get('http://localhost:8080/login',{params:loginData}).then(function (response) {
          //   if (response.data!='' || response.data !=null){ //localStorage.setItem存储token
          //     localStorage.setItem('access-admin',JSON.stringify(response.data))
          //     console.log(response)
          //     console.log("账号密码正确")
          //     console.log("开始校验验证码")
          //     //userStore.setManagerInfo(res.data)//2023.3.4先加的
          //     if (loginData.code !== identifyCode.value) {
          //       ElMessage.warning('验证码错误')
          //       console.log("验证码错误")
          //       _this.$router.replace({path:'/login'})
          //     }else {
          //       _this.$router.replace({path:'/car'})//跳转到主页
          //     }
          //
          //   }else alert("123")
          //
          // })
          request.post('/login', loginData).then(res => {
            if (res == 200 || res.code == '200' ) {
              localStorage.setItem('access-admin',JSON.stringify(res.data))
              ElMessage.success('登录成功')
              const userStore = useUserStore()
              userStore.setManagerInfo(res.data)
              _this.$router.replace({path:'/'})
            }else{
              if(res.code=='500'){
                ElMessage.success('用户名或密码错误!')
              }else {
                ElMessage.success('登录失败'+res.msg)
              }
              //ElMessage.success('登录失败'+res.code)
              //ElMessage.error(res.msg)
            }
          })

        }else{
          console.log('error submit!');
          return false;
        }

      })
    }
  },
};

</script>

<script setup>
import {onMounted} from "vue";

onMounted(() => {
  identifyCode.value = "";
  makeCode(identifyCodes, 4);
})


</script>
<template>

  <div style="height: 100vh;overflow: hidden;background-image: linear-gradient( 135deg, #F97794 10%, #623AA2 100%);" >
    <div style="width: 400px;margin: 150px auto; border: 1px solid #ddd;border-radius: 10px; padding: 20px; background-color: white">
      <el-form
          ref="ruleFormRef"
          :model="loginData"
          :rules="rules"
          size="large"
          status-icon
      >
        <div style="text-align: center;color:dodgerblue; font-size: 20px;font-weight: bold;margin-bottom: 20px">登 录</div>
        <el-form-item  prop="username">
          <el-input v-model="loginData.username" placeholder="请输入账号" :prefix-icon="User"/>
        </el-form-item>

        <el-form-item  prop="password">
          <el-input v-model="loginData.password" show-password placeholder="请输入密码" :prefix-icon="Lock"/>
        </el-form-item>


        <div style="display: flex; margin: 15px 0">
          <div style="flex: 1">
            <el-input v-model="loginData.code" placeholder="验证码"></el-input>
          </div>
          <div>
            <div @click="refreshCode" style="margin-left: 5px">
              <SIdentify :identifyCode="identifyCode" />
            </div>
          </div>
        </div>

        <el-form-item>
          <el-button type="primary" style="width: 100%;" @click="handleSubmit">登 录</el-button>
        </el-form-item>

      </el-form>
    </div>
  </div>

</template>