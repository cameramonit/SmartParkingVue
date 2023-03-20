import { createRouter, createWebHistory } from 'vue-router'
import {useUserStore} from "@/stores/user"
import axios from "axios";
const modules = import.meta.glob('../views/*.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Layout',
      component: () => import('../layout/Layout.vue'),
      redirect: '/home',
      children: [
        {
          path:'home',
          name : 'Home',
          component: ()=> import('../views/HomeView.vue')
        },
       ]
    },
    {
      path:'/login',
      name : 'login',
      component: ()=> import('../views/Login.vue')
    },
    {
      path:'/error',
      name : 'Error',
      component: ()=> import('../views/Error.vue')
    },
  ]
})
//刷新页面会导致路由重置
export const setRoutes = (menus) => {
  if (!menus || !menus.length) {
    const manager = localStorage.getItem('manager')
    if (!manager) {
      return
    }
    menus = JSON.parse(manager).managerInfo.menus
  }

  if (menus.length) {
    // 开始渲染 未来的不确定的  用户添加的路由
    menus.forEach(item => {   // 所有的页面都需要设置路由，而目录不需要设置路由
      if (item.path) {  // 当且仅当path不为空的时候才去设置路由
        router.addRoute('Layout', { path: item.path, name: item.page, component: modules['../views/' + item.page + '.vue'] })
      } else {
        if (item.children && item.children.length) {
          item.children.forEach(sub => {
            if (sub.path) {
              router.addRoute('Layout', { path: sub.path, name: sub.page, component: modules['../views/' + sub.page + '.vue'] })
            }
          })
        }
      }
    })
  }
}
setRoutes()

//路由卫士
router.beforeEach((to, from, next) => {
  if (to.path.startsWith('/login')) {
    window.localStorage.removeItem('access-admin')
    next()
  } else {
    let admin = JSON.parse(window.localStorage.getItem('access-admin'))
    if (!admin) {
      if(to.path =='/login'){
        next();
      }else{
        next({path: '/login'})
      }

    } else {
      //校验token合法性
      axios({
        url:'http://localhost:8080/checkToken',
        method:'get',
        headers:{
          token:admin.token
        }
      }).then((response) => {
        if(!response.data){
          console.log('校验失败')
          router.push({ name: 'Error' })
        }
      })
      next()
    }
  }
})
export default router
