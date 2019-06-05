<template>
    <p> {{ greeting }} World!</p>
</template>

<script>
export default {
  name: "TestComponentWithStyle",
  props: {
    serviceData: {
      type: Object,
      required: true
    }
  },

  computed: {
    greeting() {
      return this.serviceData.greeting;
    },

    add(a, b){
      return a + b;
    }
  }
}
</script>

<style scoped lang="scss">
    p {
        font-size: 2em;
        text-align: center;
    }
</style>