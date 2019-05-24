<template>
  <section class="container-fluid">
    <table>
      <tr>
        <th>Short Bio</th><td>{{ pageData.shortBio }}</td>
      </tr>
      <tr>
        <th>Website</th><td>{{ pageData.website }}</td>
      </tr>
      <tr>
        <th>Born</th><td>{{ pageData.born }}</td>
      </tr>
      <tr>
        <th>Died</th><td>{{ pageData.died }}</td>
      </tr>
      <tr>
        <th>Gender</th><td>{{ pageData.gender }}</td>
      </tr>
      <tr>
        <th>Nationality</th><td>{{ pageData.nationality }}</td>
      </tr>
    </table>

    <ul>
      <li
        v-for="mediaItem in pageData.media"
        :key="mediaItem.id">
        {{ mediaItem }}
      </li>
    </ul>
  </section>
</template>

<script>

export default {
  name: 'App',
  data: function () {
    return {
      a: 1
    }
  },
  props: {
    pageData: {
      type: Object,
      required: true,
      default: () => {
        return {};
      },
    },
  },
};
</script>

