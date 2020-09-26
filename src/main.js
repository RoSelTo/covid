window.$ = window.jQuery = require('jquery');

import Vue from 'vue'
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css'
import { setTimeout } from 'timers'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faHome } from '@fortawesome/free-solid-svg-icons'
import { faPlay } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import App from './App.vue'

library.add(faHome);
library.add(faPlay);
Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.config.productionTip = false

new Vue({
  render: function (h) { return h(App) },
}).$mount('#app')
