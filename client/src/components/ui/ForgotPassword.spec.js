// yarn test:unit src/components/ui/ForgotPassword.spec.js

import { fireEvent } from '@testing-library/vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import ForgotPassword from './ForgotPassword.vue';
import { RouterLinkStub } from '@vue/test-utils';
import mockAxios from 'axios';
import { shallowMount } from '@vue/test-utils';

describe('ForgotPassword component', () => {
  describe('navigation links and buttons', () => {
    it('Renders link to ForgotPassword by default', async () => {
      const { getByRole } = renderWithVuetify(ForgotPassword, {
        store: {},
        propsData: {},
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      getByRole('link', { name: 'Sign in' });
    });
    it('Renders button to ForgotPassword when useLink is false', async () => {
      const { getByRole } = renderWithVuetify(ForgotPassword, {
        store: {},
        propsData: { useLink: false },
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      getByRole('button', { name: 'Sign in' });
    });
  });

  describe('submitting form', () => {
    it('shows an error when email is empty', async () => {
      const { getByLabelText, getByText, queryByText } = renderWithVuetify(ForgotPassword, {
        propsData: {},
        store: {},
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      const emailInput = getByLabelText('Email');
      fireEvent.update(emailInput, '');
      expect(emailInput.value).toBe('');
      expect(queryByText('Please enter a valid email address')).toBeNull();
      const button = getByText('Submit');
      await fireEvent.click(button);
      getByText('Please enter a valid email address');
    });
  });

  describe('mock axios', () => {
    const emailData = 'email@mail.com';

    const TransitionStub = {
      render(h) {
        return h('transition-stub', this.$slots.default);
      },
    };

    it('displays success message when submit is called with a non empty email', async () => {
      const wrapper = shallowMount(ForgotPassword, {
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      mockAxios.post.mockImplementationOnce(() => Promise.resolve());

      wrapper.setData({ email: emailData });
      await wrapper.vm.submit();
      console.log('RESULT', wrapper.vm.status.message);
      await expect(wrapper.html()).toContain(`Check your inbox on ${emailData}`);
    });
  });
});
