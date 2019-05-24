import { mount, shallowMount } from '@vue/test-utils'
import SearchPage from '../src/SearchPage.vue';

describe('SearchPage', () => {
  // Now mount the component and you have the wrapper
  const wrapper = shallowMount(SearchPage, {
    propsData: {
      pageData: {
        firstName: 'alex',
        lastName: 'perkins'
      },
    }
  });

  it('has a table', () => {
    expect(wrapper.contains('table')).toBe(true)
  })
})
