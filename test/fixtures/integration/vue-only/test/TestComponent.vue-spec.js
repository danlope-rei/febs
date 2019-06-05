import {shallowMount} from '@vue/test-utils';
import TestComponent from '../src/TestComponentWithStyle.vue';
import assert from 'assert';

describe('Test Component', () => {
  let wrapper;

  beforeEach(function () {
    wrapper = shallowMount(TestComponent, {
      propsData: {
        serviceData: {
          greeting: 'Hello',
        },
      },
    });

  })

  it('renders the correct markup', () => {
    assert.equal(wrapper.find('p').text(), 'Hello World!');
  });
});
