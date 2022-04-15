<template>
    <div class="card col-md-2">
        <div class="card-body" v-if="value != 0">
            <h5 class="card-title">{{title}}</h5>
            <h6 class="card-subtitle mb-2">{{value}} <span v-if="field == 'posRate'">%</span></h6>
            <h6 class="card-subtitle mb-2" :class="{'better': isBetter, 'worse': !isBetter}"><span v-if="evolution > 0">+</span>{{evolution}} <span v-if="field == 'posRate'">%</span></h6>
        </div>
        <div class="card-body" v-else>
            <h5 class="card-title">Pas de données pour ce jour</h5>
        </div>
    </div>
</template>

<script>
import dayjs from 'dayjs'
export default {
  name: 'Card',
  props: {
    title: String,
    data: Object,
    date: String,
    field: String
  },
  computed: {
      value: function(){
          return this.data[this.date][this.field];
      },
      evolution: function(){
          var dateBefore =  this.field == "posRate" || this.field == "pos" ? dayjs(this.date, "YYYY-MM-DD").add(-7, "days").format("YYYY-MM-DD") : dayjs(this.date, "YYYY-MM-DD").add(-1, "days").format("YYYY-MM-DD");
          return Math.round((this.data[this.date][this.field] - this.data[dateBefore][this.field]) * 100)/100;
      },
      isBetter: function(){
          return this.evolution < 0;
      }
  }
}
</script>

<style>
    .card {
        border: 0px;
    }

    .card-body {
        border: 1px solid rgba(0,0,0,.125);
        padding: 1rem;
    }

    .card-subtitle {
        font-size: 22px;
    }

    .card-subtitle.better {
        color: green;
    }

    .card-subtitle.worse {
        color: red;
    }
</style>