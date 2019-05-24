import { shallowMount } from '@vue/test-utils'
import TestComponent from '../src/TestComponentWithStyle.vue';
console.log('in test!');
describe('Test Component', () => {
  // Now mount the component and you have the wrapper
  const wrapper = shallowMount(TestComponent);

  it('renders the correct markup', () => {
    expect(wrapper.contains('p')).toBe(true);
  });
});
