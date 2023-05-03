<script setup>
import {nextTick, onMounted, reactive, ref} from "vue";
import request from "@/utils/request";
import {ElMessage} from "element-plus";
import config from "../../config";
import {useUserStore} from "@/stores/user";

const name = ref('')
const address = ref('')
const pageNum = ref(1)
const pageSize = ref(5)
const total = ref(0)
const userStore = useUserStore()
const token = userStore.getBearerToken
const auths = userStore.getAuths
let flag = userStore.getFlag
console.log(flag)



const state = reactive({
  tableData: [],
  form: {},
  userRole: []
})
const multipleSelection = ref([])

// 批量删除
const handleSelectionChange = (val) => {
  multipleSelection.value = val
}

const confirmDelBatch = () => {
  if (!multipleSelection.value || !multipleSelection.value.length) {
    ElMessage.warning("请选择数据")
    return
  }
  const idArr = multipleSelection.value.map(v => v.id)
  request.post('/user/del/batch', idArr).then(res => {
    if (res.code === '200') {
      ElMessage.success('操作成功')
      load()  // 刷新表格数据
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const load = () => {
    request.get('/user/page', {
      params: {
        name: name.value,
        pageNum: pageNum.value,
        pageSize: pageSize.value
      }
    }).then(res => {
      state.tableData = res.data.records
      total.value = res.data.total
    })
}
load()  // 调用 load方法拿到后台数据

const reset = () => {
  name.value = ''
  address.value = ''
  load()
}

const dialogFormVisible = ref(false)

const rules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在3-20之间', trigger: 'blur' },
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
  ],
  address: [
    { required: true, message: '请输入地址', trigger: 'blur' },
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'blur' },
  ]
})
const ruleFormRef = ref()

// 新增
const handleAdd = () => {
  dialogFormVisible.value = true
  state.form = {}
}

// 保存
const save = () => {
  ruleFormRef.value.validate(valid => {   // valid就是校验的结果
    if (valid) {
      request.request({
        url: '/user',
        method: state.form.id ? 'put' : 'post',
        data: state.form
      }).then(res => {
        if (res.code === '200') {
          ElMessage.success('保存成功')
          dialogFormVisible.value = false
          load()  // 刷新表格数据
        } else {
          ElMessage.error(res.msg)
        }
      })
    }
  })
}

// 编辑
const handleEdit = (raw) => {
  dialogFormVisible.value = true
  nextTick(() => {
    ruleFormRef.value.resetFields()
    state.form = JSON.parse(JSON.stringify(raw))
  })
}

// 删除
const del = (id) => {
  request.delete('/user/' + id).then(res => {
    if (res.code === '200') {
      ElMessage.success('操作成功')
      load()  // 刷新表格数据
    } else {
      ElMessage.error(res.msg)
    }
  })
}

// 导出接口
const exportData = () => {
  window.open(`http://${config.serverUrl}/user/export`)
}

const handleImportSuccess = () => {
  // 刷新表格
  load()
  ElMessage.success("导入成功")
}


const roleInfo = async () => {
  try {
    const response = await request.get('/role/all')
    if (response && response.data) {
      const userRole = response.data.map(item => ({
        label: item.flag,
        value: item.flag
      }))
      state.userRole = userRole
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('获取停车场列表数据失败')
  }
}
onMounted(() => {
  roleInfo()
})

</script>

<template>
  <div>
    <div>
      <span style="margin-left: 5px">用户名 : </span>
      <el-input v-model="name" placeholder="请输入用户名" class="w300" style="width: 300px ;margin-left: 5px"/>
      <el-button type="primary" class="ml5" @click="load" style="margin-left: 10px">
        <el-icon style="vertical-align: middle">
          <Search />
        </el-icon>  <span style="vertical-align: middle"> 搜索 </span>
      </el-button>
      <el-button type="warning" class="ml5" @click="reset">
        <el-icon style="vertical-align: middle">
          <RefreshLeft />
        </el-icon>  <span style="vertical-align: middle"> 重置 </span>
      </el-button>

    </div>

    <div style="margin: 10px 0">
      <el-button type="success" @click="handleAdd" v-if="auths.includes('user.add')">
        <el-icon style="vertical-align: middle">
          <Plus />
        </el-icon>  <span style="vertical-align: middle"> 新增 </span>
      </el-button>
      <el-popconfirm title="您确定删除吗？" @confirm="confirmDelBatch" v-if="auths.includes('user.deleteBatch')">
        <template #reference>
          <el-button type="danger" style="margin-left: 5px">
            <el-icon style="vertical-align: middle">
              <Remove />
            </el-icon>  <span style="vertical-align: middle"> 批量删除 </span>
          </el-button>
        </template>
      </el-popconfirm>
    </div>

    <div style="margin: 10px 0">
      <el-table :data="state.tableData" stripe border  @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="编号"></el-table-column>
      <el-table-column prop="username" label="用户名"></el-table-column>
      <el-table-column prop="password" label="密码"></el-table-column>
      <el-table-column prop="name" label="昵称"></el-table-column>
      <el-table-column prop="email" label="邮箱"></el-table-column>
      <el-table-column prop="address" label="地址"></el-table-column>
      <el-table-column prop="uid" label="用户唯一id"></el-table-column>
      <el-table-column prop="flag" label="角色"></el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button type="primary" @click="handleEdit(scope.row)" v-if="auths.includes('user.edit')">编辑</el-button>
            <el-popconfirm title="您确定删除吗？" @confirm="del(scope.row.id)" v-if="auths.includes('user.delete')">
              <template #reference>
                <el-button type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div style="margin: 10px 0">
      <el-pagination
          @current-change="load"
          @size-change="load"
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          background
          :page-sizes="[2, 5, 10, 20]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
      />
    </div>

    <el-dialog v-model="dialogFormVisible" title="用户信息" width="40%">
      <el-form ref="ruleFormRef" :rules="rules" :model="state.form" label-width="80px" style="padding: 0 20px" status-icon>
        <el-form-item prop="username" label="用户名">
          <el-input v-model="state.form.username" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item prop="password" label="密码">
          <el-input v-model="state.form.password" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item prop="name" label="昵称">
          <el-input v-model="state.form.name" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item prop="email" label="邮箱">
          <el-input v-model="state.form.email" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item prop="address" label="地址">
          <el-input v-model="state.form.address" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item prop="uid" label="用户号">
          <el-input v-model="state.form.uid" autocomplete="off"></el-input>
        </el-form-item>

        <el-form-item prop="userRole" label="角色">
          <el-select clearable v-model="state.form.flag" placeholder="请选择角色">
            <el-option v-for="item in state.userRole" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

      </el-form>
      <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="save">
          保存
        </el-button>
      </span>
      </template>
    </el-dialog>


  </div>
</template>