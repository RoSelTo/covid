window.$ = window.jQuery = require('jquery');

import Vue from 'vue'
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css'
import App from './App.vue'

Vue.config.productionTip = false

new Vue({
  render: function (h) { return h(App) },
}).$mount('#app')
