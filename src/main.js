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

Vue.mixin({
  methods: {
    movingAvg(array, count){
      // calculate average for subarray
      var avg = function(array){
          var sum = 0, count = 0, val;
          for (var i in array){
            sum += array[i].valueSec;
            count++;
          }
          return sum / count;
      };
    
      var result = [], val;
      // pad beginning of result with null values
      for (var i=0; i < count-1; i++)
          result.push({date: array[i].date, movingAverage: null});
    
      // calculate average for each subarray and add to result
      for (var i=0, len=array.length - count; i < len; i++){
          val = avg(array.slice(i, i + count));
          if (isNaN(val))
              result.push({date: array[i+count].date, movingAverage: null});
          else
              result.push({date: array[i+count].date, movingAverage: val});
      }
    
      return result;
    }
  },
})

new Vue({
  render: function (h) { return h(App) },
}).$mount('#app')