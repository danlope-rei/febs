// app.vue with ES2015+
<style lang="less">
  @import '../styles/main.less';

  a {
    color: blue;
    &:hover {
      color: green;
      content: 'details-import-from-css';
    }
  }

</style>

<template>
  <h1 class="red">{{ msg }}</h1>
</template>

<script>
export default {
  data() {
    const str = 'Hello world!';

    const helloWorld = (o) => {
      const {a, b} = o;
      return `Vue says, "${str}!"`
    };

    return {
      msg: helloWorld(),
    };
  },
};
</script>
